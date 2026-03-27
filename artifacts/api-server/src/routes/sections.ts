import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sectionsTable, lessonsTable } from "@workspace/db";
import {
  GetCourseSectionsParams,
  CreateSectionParams,
  CreateSectionBody,
  UpdateSectionParams,
  UpdateSectionBody,
  DeleteSectionParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/courses/:courseId/sections", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = GetCourseSectionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const sections = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.courseId, params.data.courseId))
    .orderBy(sectionsTable.orderIndex);

  const result = await Promise.all(
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

  res.json(result);
});

router.post("/courses/:courseId/sections", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = CreateSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existingSections = await db
    .select({ orderIndex: sectionsTable.orderIndex })
    .from(sectionsTable)
    .where(eq(sectionsTable.courseId, params.data.courseId));

  const nextOrder = parsed.data.orderIndex ?? existingSections.length;

  const [section] = await db
    .insert(sectionsTable)
    .values({ courseId: params.data.courseId, title: parsed.data.title, orderIndex: nextOrder })
    .returning();

  res.status(201).json(section);
});

router.patch("/sections/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [section] = await db
    .update(sectionsTable)
    .set(parsed.data)
    .where(eq(sectionsTable.id, params.data.id))
    .returning();

  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }

  res.json(section);
});

router.delete("/sections/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [section] = await db.delete(sectionsTable).where(eq(sectionsTable.id, params.data.id)).returning();

  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }

  res.json({ success: true, message: "Section deleted" });
});

export default router;
