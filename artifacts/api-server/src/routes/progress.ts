import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, lessonProgressTable, lessonsTable, sectionsTable, coursesTable, enrollmentsTable, usersTable } from "@workspace/db";
import { MarkLessonCompleteParams, MarkLessonIncompleteParams, GetCourseProgressParams, GetCertificateParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/progress/:lessonId", requireAuth, async (req, res): Promise<void> => {
  const params = MarkLessonCompleteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const lessonId = params.data.lessonId;

  const [existing] = await db
    .select()
    .from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, lessonId)));

  if (existing) {
    res.json({
      lessonId: existing.lessonId,
      userId: existing.userId,
      completedAt: existing.completedAt.toISOString(),
    });
    return;
  }

  const [progress] = await db
    .insert(lessonProgressTable)
    .values({ userId, lessonId })
    .returning();

  res.json({
    lessonId: progress.lessonId,
    userId: progress.userId,
    completedAt: progress.completedAt.toISOString(),
  });
});

router.delete("/progress/:lessonId", requireAuth, async (req, res): Promise<void> => {
  const params = MarkLessonIncompleteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const lessonId = params.data.lessonId;

  await db
    .delete(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, lessonId)));

  res.json({ success: true, message: "Lesson marked as incomplete" });
});

router.get("/courses/:courseId/progress", requireAuth, async (req, res): Promise<void> => {
  const params = GetCourseProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const courseId = params.data.courseId;

  const lessons = await db
    .select({ id: lessonsTable.id })
    .from(lessonsTable)
    .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
    .where(eq(sectionsTable.courseId, courseId));

  const totalLessons = lessons.length;
  const lessonIds = lessons.map((l) => l.id);

  const progress = await db
    .select()
    .from(lessonProgressTable)
    .where(eq(lessonProgressTable.userId, userId));

  const completedLessonIds = progress.filter((p) => lessonIds.includes(p.lessonId)).map((p) => p.lessonId);
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCompleted = totalLessons > 0 && completedCount >= totalLessons;

  res.json({
    courseId,
    totalLessons,
    completedLessons: completedCount,
    progressPercent,
    completedLessonIds,
    isCompleted,
  });
});

router.get("/certificates/:courseId", requireAuth, async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const courseId = params.data.courseId;

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const lessons = await db
    .select({ id: lessonsTable.id })
    .from(lessonsTable)
    .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
    .where(eq(sectionsTable.courseId, courseId));

  const totalLessons = lessons.length;
  if (totalLessons === 0) {
    res.status(404).json({ error: "Course has no lessons" });
    return;
  }

  const lessonIds = lessons.map((l) => l.id);
  const progress = await db
    .select()
    .from(lessonProgressTable)
    .where(eq(lessonProgressTable.userId, userId));

  const completedCount = progress.filter((p) => lessonIds.includes(p.lessonId)).length;

  if (completedCount < totalLessons) {
    res.status(404).json({ error: "Course not yet completed" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const lastCompleted = progress
    .filter((p) => lessonIds.includes(p.lessonId))
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0];

  res.json({
    studentName: user.name,
    courseName: course.title,
    completedAt: lastCompleted.completedAt.toISOString(),
    courseId: course.id,
  });
});

export default router;
