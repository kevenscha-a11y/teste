import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, enrollmentsTable, lessonProgressTable, coursesTable, sectionsTable, lessonsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// GET /api/admin/users - list all users with stats
router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
  }).from(usersTable);

  const result = await Promise.all(users.map(async (user) => {
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, user.id));

    const completedLessons = await db
      .select()
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.userId, user.id));

    return {
      ...user,
      enrollmentCount: enrollments.length,
      completedLessonsCount: completedLessons.length,
    };
  }));

  res.json(result);
});

// GET /api/admin/users/:id/progress - get a specific user's course progress
router.get("/admin/users/:id/progress", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
  }).from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, userId));

  const completedProgress = await db
    .select()
    .from(lessonProgressTable)
    .where(eq(lessonProgressTable.userId, userId));

  const completedLessonIds = new Set(completedProgress.map(p => p.lessonId));

  const courses = await Promise.all(enrollments.map(async (enrollment) => {
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, enrollment.courseId));

    if (!course) return null;

    const lessons = await db
      .select({ id: lessonsTable.id })
      .from(lessonsTable)
      .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
      .where(eq(sectionsTable.courseId, course.id));

    const totalLessons = lessons.length;
    const completedCount = lessons.filter(l => completedLessonIds.has(l.id)).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      thumbnailUrl: course.thumbnailUrl ?? null,
      isPublished: course.isPublished,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      totalLessons,
      completedLessons: completedCount,
      progressPercent,
    };
  }));

  res.json({
    user,
    courses: courses.filter(Boolean),
  });
});

// POST /api/admin/users - create a student
router.post("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name, email, password } = req.body || {};
  if (!name || typeof name !== "string" || name.length < 2) {
    res.status(400).json({ error: "Nome inválido" }); return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "E-mail inválido" }); return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" }); return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "E-mail já está em uso" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role: "student" }).returning();

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// DELETE /api/admin/users/:id - delete a user
router.delete("/admin/users/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  if (userId === req.user!.id) {
    res.status(400).json({ error: "Você não pode excluir sua própria conta" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

export default router;
