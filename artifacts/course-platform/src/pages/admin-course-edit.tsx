import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetCourse,
  useUpdateCourse,
  useDeleteCourse,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  getGetCourseQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2, ChevronLeft, Plus, GripVertical, Settings, Trash2, Pencil, PlayCircle, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean()
});

const sectionSchema = z.object({
  title: z.string().min(2),
  orderIndex: z.coerce.number().int().default(0)
});

const lessonSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.coerce.number().int().optional().or(z.literal('')),
  orderIndex: z.coerce.number().int().default(0)
});

export function AdminCourseEdit() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useGetCourse(courseId);
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const deleteSectionMutation = useDeleteSection();

  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();

  const [sectionDialog, setSectionDialog] = useState({ open: false, mode: 'create', id: 0 });
  const [lessonDialog, setLessonDialog] = useState({ open: false, mode: 'create', id: 0, sectionId: 0 });

  const courseForm = useForm<z.infer<typeof courseSchema>>({ resolver: zodResolver(courseSchema) });
  const sectionForm = useForm<z.infer<typeof sectionSchema>>({ resolver: zodResolver(sectionSchema) });
  const lessonForm = useForm<z.infer<typeof lessonSchema>>({ resolver: zodResolver(lessonSchema) });

  useState(() => {
    if (course) {
      courseForm.reset({
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl || "",
        isPublished: course.isPublished
      });
    }
  });

  if (isLoading || !course) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });

  const onUpdateCourse = async (data: z.infer<typeof courseSchema>) => {
    try {
      await updateCourseMutation.mutateAsync({
        id: courseId,
        data: { ...data, thumbnailUrl: data.thumbnailUrl || null }
      });
      invalidate();
      toast({ title: "Curso atualizado com sucesso" });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  const openCreateSection = () => {
    sectionForm.reset({ title: "", orderIndex: course.sections.length * 10 });
    setSectionDialog({ open: true, mode: 'create', id: 0 });
  };

  const openEditSection = (section: any) => {
    sectionForm.reset({ title: section.title, orderIndex: section.orderIndex });
    setSectionDialog({ open: true, mode: 'edit', id: section.id });
  };

  const onSectionSubmit = async (data: z.infer<typeof sectionSchema>) => {
    try {
      if (sectionDialog.mode === 'create') {
        await createSectionMutation.mutateAsync({ courseId, data });
      } else {
        await updateSectionMutation.mutateAsync({ id: sectionDialog.id, data });
      }
      invalidate();
      setSectionDialog({ open: false, mode: 'create', id: 0 });
      toast({ title: `Seção ${sectionDialog.mode === 'create' ? 'criada' : 'atualizada'} com sucesso` });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  const openCreateLesson = (sectionId: number, currentLessonsCount: number) => {
    lessonForm.reset({ title: "", description: "", videoUrl: "", duration: 0, orderIndex: currentLessonsCount * 10 });
    setLessonDialog({ open: true, mode: 'create', id: 0, sectionId });
  };

  const openEditLesson = (lesson: any, sectionId: number) => {
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description || "",
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || 0,
      orderIndex: lesson.orderIndex
    });
    setLessonDialog({ open: true, mode: 'edit', id: lesson.id, sectionId });
  };

  const onLessonSubmit = async (data: z.infer<typeof lessonSchema>) => {
    try {
      const payload = {
        ...data,
        description: data.description || null,
        videoUrl: data.videoUrl || null,
        duration: data.duration ? Number(data.duration) : null
      };

      if (lessonDialog.mode === 'create') {
        await createLessonMutation.mutateAsync({ sectionId: lessonDialog.sectionId, data: payload });
      } else {
        await updateLessonMutation.mutateAsync({ id: lessonDialog.id, data: payload });
      }
      invalidate();
      setLessonDialog({ open: false, mode: 'create', id: 0, sectionId: 0 });
      toast({ title: `Aula ${lessonDialog.mode === 'create' ? 'criada' : 'atualizada'} com sucesso` });
    } catch (e: any) { toast({ variant: "destructive", title: "Erro", description: e.message }); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">Editar Curso</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      <Tabs defaultValue="curriculum" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-secondary/50 p-1 mb-8">
          <TabsTrigger value="curriculum" className="rounded-lg data-[state=active]:bg-card">Conteúdo</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-card">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-display font-semibold">Conteúdo do Curso</h2>
            <Button onClick={openCreateSection} variant="outline" className="rounded-xl bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Seção
            </Button>
          </div>

          <Accordion type="multiple" defaultValue={course.sections.map(s => s.id.toString())} className="space-y-4">
            {course.sections.map((section, sIdx) => (
              <AccordionItem value={section.id.toString()} key={section.id} className="border border-border/50 bg-card rounded-2xl overflow-hidden px-1">
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary/20 rounded-t-xl group">
                  <div className="flex items-center w-full justify-between pr-4">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seção {sIdx + 1}:</div>
                      <div className="font-bold text-lg">{section.title}</div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => openEditSection(section)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={async () => {
                        if (confirm('Excluir esta seção e todas as suas aulas?')) {
                          await deleteSectionMutation.mutateAsync({ id: section.id });
                          invalidate();
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-4 pb-4">
                  <div className="space-y-2 ml-4 border-l-2 border-border pl-4 py-2">
                    {section.lessons.map((lesson, lIdx) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-border/50 rounded-xl group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {lIdx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{lesson.title}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              {lesson.duration && <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" /> {lesson.duration}min</span>}
                              {lesson.videoUrl && <span className="text-green-500/80">Tem Vídeo</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLesson(lesson, section.id)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            if (confirm('Excluir esta aula?')) {
                              await deleteLessonMutation.mutateAsync({ id: lesson.id });
                              invalidate();
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={() => openCreateLesson(section.id, section.lessons.length)}
                      variant="ghost"
                      className="w-full mt-2 border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-colors rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Aula
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {course.sections.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-card/20">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma seção ainda. Crie a primeira para montar o currículo.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Configurações do Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={courseForm.handleSubmit(onUpdateCourse)} className="space-y-6">
                <div className="space-y-2">
                  <Label>Título do Curso</Label>
                  <Input className="bg-secondary/30 h-12 rounded-xl" {...courseForm.register("title")} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea className="bg-secondary/30 min-h-[150px] rounded-xl" {...courseForm.register("description")} />
                </div>
                <div className="space-y-2">
                  <Label>URL da Capa</Label>
                  <Input className="bg-secondary/30 h-12 rounded-xl" {...courseForm.register("thumbnailUrl")} />
                  {courseForm.watch("thumbnailUrl") && (
                    <div className="mt-2 aspect-video w-64 rounded-xl overflow-hidden bg-secondary border border-border">
                      <img src={courseForm.watch("thumbnailUrl")} className="w-full h-full object-cover" alt="Pré-visualização" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="space-y-0.5">
                    <Label>Status de Publicação</Label>
                    <p className="text-sm text-muted-foreground">Tornar este curso visível para estudantes</p>
                  </div>
                  <Switch checked={courseForm.watch("isPublished")} onCheckedChange={v => courseForm.setValue("isPublished", v)} />
                </div>
                <div className="pt-4 border-t border-border/50 flex justify-between">
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={async () => {
                      if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                        await deleteCourseMutation.mutateAsync({ id: courseId });
                        window.location.href = "/admin";
                      }
                    }}
                  >
                    Excluir Curso
                  </Button>
                  <Button type="submit" disabled={updateCourseMutation.isPending} className="rounded-xl px-8 h-12 bg-primary">
                    {updateCourseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Seção */}
      <Dialog open={sectionDialog.open} onOpenChange={(o) => setSectionDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>{sectionDialog.mode === 'create' ? 'Criar Seção' : 'Editar Seção'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={sectionForm.handleSubmit(onSectionSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input className="bg-secondary/50" {...sectionForm.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" className="bg-secondary/50" {...sectionForm.register("orderIndex")} />
            </div>
            <Button type="submit" className="w-full mt-4 bg-primary" disabled={createSectionMutation.isPending || updateSectionMutation.isPending}>
              Salvar Seção
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Aula */}
      <Dialog open={lessonDialog.open} onOpenChange={(o) => setLessonDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="bg-card border-border/50 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{lessonDialog.mode === 'create' ? 'Criar Aula' : 'Editar Aula'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={lessonForm.handleSubmit(onLessonSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Título da Aula</Label>
              <Input className="bg-secondary/50" {...lessonForm.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input className="bg-secondary/50" placeholder="https://..." {...lessonForm.register("videoUrl")} />
              <p className="text-xs text-muted-foreground">Link direto para MP4 ou vídeo HTML5 compatível</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input type="number" className="bg-secondary/50" {...lessonForm.register("duration")} />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" className="bg-secondary/50" {...lessonForm.register("orderIndex")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição / Conteúdo</Label>
              <Textarea className="bg-secondary/50 min-h-[150px]" {...lessonForm.register("description")} />
            </div>
            <Button type="submit" className="w-full mt-4 bg-primary" disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>
              Salvar Aula
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
