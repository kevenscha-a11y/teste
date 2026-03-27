import { Router, type IRouter } from "express";
import { eq, sql, count } from "drizzle-orm";
import { db, coursesTable, sectionsTable, lessonsTable, enrollmentsTable, lessonProgressTable } from "@workspace/db";
import {
  CreateCourseBody,
  UpdateCourseBody,
  GetCourseParams,
  UpdateCourseParams,
  DeleteCourseParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/courses", optionalAuth, async (req, res): Promise<void> => {
  const userId = req.user?.id;

  const courses = await db.select().from(coursesTable).where(eq(coursesTable.isPublished, true));

  const result = await Promise.all(
    courses.map(async (course) => {
      const lessons = await db
        .select({ id: lessonsTable.id })
        .from(lessonsTable)
        .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
        .where(eq(sectionsTable.courseId, course.id));

      const totalLessons = lessons.length;

      let isEnrolled = false;
      let progressPercent = 0;

      if (userId) {
        const [enrollment] = await db
          .select()
          .from(enrollmentsTable)
          .where(eq(enrollmentsTable.userId, userId))
          .where(eq(enrollmentsTable.courseId, course.id));
        isEnrolled = !!enrollment;

        if (isEnrolled && totalLessons > 0) {
          const lessonIds = lessons.map((l) => l.id);
          const completed = await db
            .select()
            .from(lessonProgressTable)
            .where(eq(lessonProgressTable.userId, userId));
          const completedCount = completed.filter((p) => lessonIds.includes(p.lessonId)).length;
          progressPercent = Math.round((completedCount / totalLessons) * 100);
        }
      }

      return {
        ...course,
        thumbnailUrl: course.thumbnailUrl ?? null,
        createdAt: course.createdAt.toISOString(),
        totalLessons,
        isEnrolled,
        progressPercent,
      };
    })
  );

  res.json(result);
});

router.get("/courses/admin", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable);

  const result = await Promise.all(
    courses.map(async (course) => {
      const sections = await db.select({ id: sectionsTable.id }).from(sectionsTable).where(eq(sectionsTable.courseId, course.id));
      const totalSections = sections.length;

      const lessons = await db
        .select({ id: lessonsTable.id })
        .from(lessonsTable)
        .innerJoin(sectionsTable, eq(lessonsTable.sectionId, sectionsTable.id))
        .where(eq(sectionsTable.courseId, course.id));
      const totalLessons = lessons.length;

      const [{ value: totalStudents }] = await db
        .select({ value: count() })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.courseId, course.id));

      return {
        ...course,
        thumbnailUrl: course.thumbnailUrl ?? null,
        createdAt: course.createdAt.toISOString(),
        totalSections,
        totalLessons,
        totalStudents,
      };
    })
  );

  res.json(result);
});

router.get("/courses/create", (_req, res): void => {
  res.status(405).json({ error: "Use POST" });
});

router.post("/courses/create", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db.insert(coursesTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    isPublished: parsed.data.isPublished ?? false,
  }).returning();

  res.status(201).json({
    ...course,
    thumbnailUrl: course.thumbnailUrl ?? null,
    createdAt: course.createdAt.toISOString(),
  });
});

router.get("/courses/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const sections = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.courseId, course.id))
    .orderBy(sectionsTable.orderIndex);

  const sectionsWithLessons = await Promise.all(
    sections.map(async (section) => {
      const lessons = await db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.sectionId, section.id))
        .orderBy(lessonsTable.orderIndex);
      return {
        ...section,
        lessons: lessons.map((l) => ({
          ...l,
          description: l.description ?? null,
          videoUrl: l.videoUrl ?? null,
          duration: l.duration ?? null,
        })),
      };
    })
  );

  const userId = req.user?.id;
  let isEnrolled = false;
  let progressPercent = 0;
  let completedLessons: number[] = [];

  if (userId) {
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, userId))
      .where(eq(enrollmentsTable.courseId, course.id));
    isEnrolled = !!enrollment;

    if (isEnrolled) {
      const allLessonIds = sectionsWithLessons.flatMap((s) => s.lessons.map((l) => l.id));
      const progress = await db
        .select()
        .from(lessonProgressTable)
        .where(eq(lessonProgressTable.userId, userId));

      completedLessons = progress.filter((p) => allLessonIds.includes(p.lessonId)).map((p) => p.lessonId);
      if (allLessonIds.length > 0) {
        progressPercent = Math.round((completedLessons.length / allLessonIds.length) * 100);
      }
    }
  }

  res.json({
    ...course,
    thumbnailUrl: course.thumbnailUrl ?? null,
    createdAt: course.createdAt.toISOString(),
    sections: sectionsWithLessons,
    isEnrolled,
    progressPercent,
    completedLessons,
  });
});

router.patch("/courses/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db
    .update(coursesTable)
    .set(parsed.data)
    .where(eq(coursesTable.id, params.data.id))
    .returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json({
    ...course,
    thumbnailUrl: course.thumbnailUrl ?? null,
    createdAt: course.createdAt.toISOString(),
  });
});

router.delete("/courses/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [course] = await db.delete(coursesTable).where(eq(coursesTable.id, params.data.id)).returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json({ success: true, message: "Course deleted" });
});

export default router;
