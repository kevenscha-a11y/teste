import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lessonsTable, sectionsTable } from "@workspace/db";
import {
  CreateLessonParams,
  CreateLessonBody,
  UpdateLessonParams,
  UpdateLessonBody,
  DeleteLessonParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/sections/:sectionId/lessons", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existingLessons = await db
    .select({ orderIndex: lessonsTable.orderIndex })
    .from(lessonsTable)
    .where(eq(lessonsTable.sectionId, params.data.sectionId));

  const nextOrder = parsed.data.orderIndex ?? existingLessons.length;

  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      sectionId: params.data.sectionId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
      duration: parsed.data.duration ?? null,
      orderIndex: nextOrder,
    })
    .returning();

  res.status(201).json({
    ...lesson,
    description: lesson.description ?? null,
    videoUrl: lesson.videoUrl ?? null,
    duration: lesson.duration ?? null,
  });
});

router.patch("/lessons/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lesson] = await db
    .update(lessonsTable)
    .set(parsed.data)
    .where(eq(lessonsTable.id, params.data.id))
    .returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json({
    ...lesson,
    description: lesson.description ?? null,
    videoUrl: lesson.videoUrl ?? null,
    duration: lesson.duration ?? null,
  });
});

router.delete("/lessons/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lesson] = await db.delete(lessonsTable).where(eq(lessonsTable.id, params.data.id)).returning();

  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  res.json({ success: true, message: "Lesson deleted" });
});

export default router;
