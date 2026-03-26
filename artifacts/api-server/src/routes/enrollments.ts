import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, enrollmentsTable, coursesTable, sectionsTable, lessonsTable, lessonProgressTable } from "@workspace/db";
import { EnrollCourseParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/courses/:courseId/enroll", requireAuth, async (req, res): Promise<void> => {
  const params = EnrollCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = req.user!.id;
  const courseId = params.data.courseId;

  const [existing] = await db
    .select()
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)));

  if (existing) {
    res.status(400).json({ error: "Already enrolled in this course" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({ userId, courseId })
    .returning();

  res.status(201).json({
    ...enrollment,
    enrolledAt: enrollment.enrolledAt.toISOString(),
  });
});

router.get("/enrollments", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, userId));

  const result = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
      if (!course) return null;

      const lessons = await db
        .select({ id: lessonsTable.id })
        .from(lessonsTable)
        .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
        .where(eq(sectionsTable.courseId, course.id));

      const totalLessons = lessons.length;
      const lessonIds = lessons.map((l) => l.id);

      const progress = await db
        .select()
        .from(lessonProgressTable)
        .where(eq(lessonProgressTable.userId, userId));

      const completedCount = progress.filter((p) => lessonIds.includes(p.lessonId)).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        ...enrollment,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        course: {
          ...course,
          thumbnailUrl: course.thumbnailUrl ?? null,
          createdAt: course.createdAt.toISOString(),
          totalLessons,
          isEnrolled: true,
          progressPercent,
        },
      };
    })
  );

  res.json(result.filter(Boolean));
});

export default router;
