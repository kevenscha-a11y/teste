import { useState } from "react";
import { Link } from "wouter";
import { useGetAdminCourses, useCreateCourse, getGetAdminCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutDashboard, Users, BookOpen, Settings, Loader2, PlayCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createCourseSchema = z.object({
  title: z.string().min(3, "Título obrigatório"),
  description: z.string().min(10, "Descrição obrigatória"),
  thumbnailUrl: z.string().url("Insira uma URL válida").optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});

const createStudentSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export function AdminDashboard() {
  const { data: courses, isLoading } = useGetAdminCourses();
  const createMutation = useCreateCourse();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const courseForm = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: "", description: "", thumbnailUrl: "", isPublished: false }
  });

  const studentForm = useForm<z.infer<typeof createStudentSchema>>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const onSubmitCourse = async (data: z.infer<typeof createCourseSchema>) => {
    try {
      await createMutation.mutateAsync({ data: {
        ...data,
        thumbnailUrl: data.thumbnailUrl || null
      }});
      queryClient.invalidateQueries({ queryKey: getGetAdminCoursesQueryKey() });
      toast({ title: "Curso criado com sucesso!" });
      setIsCourseDialogOpen(false);
      courseForm.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao criar curso", description: e.message });
    }
  };

  const onSubmitStudent = async (data: z.infer<typeof createStudentSchema>) => {
    setIsCreatingStudent(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro desconhecido");
      }
      toast({ title: "Estudante criado com sucesso!", description: `Conta criada para ${data.email}` });
      setIsStudentDialogOpen(false);
      studentForm.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao criar estudante", description: e.message });
    } finally {
      setIsCreatingStudent(false);
    }
  };

  const totalStudents = courses?.reduce((acc, c) => acc + c.totalStudents, 0) || 0;
  const publishedCount = courses?.filter(c => c.isPublished).length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Painel do Coordenador</h1>
          <p className="text-muted-foreground">Gerencie seus cursos e conteúdos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Criar Estudante */}
          <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl h-11 px-5 border-border/60" data-testid="button-create-student">
                <UserPlus className="w-4 h-4 mr-2" /> Criar Estudante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Novo Estudante</DialogTitle>
              </DialogHeader>
              <form onSubmit={studentForm.handleSubmit(onSubmitStudent)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input className="bg-secondary/50 border-border/50 h-11" placeholder="João Silva" {...studentForm.register("name")} />
                  {studentForm.formState.errors.name && <p className="text-xs text-destructive">{studentForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" className="bg-secondary/50 border-border/50 h-11" placeholder="estudante@exemplo.com" {...studentForm.register("email")} />
                  {studentForm.formState.errors.email && <p className="text-xs text-destructive">{studentForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" className="bg-secondary/50 border-border/50 h-11" {...studentForm.register("password")} />
                  {studentForm.formState.errors.password && <p className="text-xs text-destructive">{studentForm.formState.errors.password.message}</p>}
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isCreatingStudent} className="h-11 px-8 rounded-xl bg-primary">
                    {isCreatingStudent ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Estudante
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Criar Curso */}
          <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 bg-primary shadow-lg shadow-primary/20" data-testid="button-create-course">
                <Plus className="w-5 h-5 mr-2" /> Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display">Criar Curso</DialogTitle>
              </DialogHeader>
              <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input className="bg-secondary/50 border-border/50 h-11" {...courseForm.register("title")} />
                  {courseForm.formState.errors.title && <p className="text-xs text-destructive">{courseForm.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea className="bg-secondary/50 border-border/50 min-h-[100px]" {...courseForm.register("description")} />
                  {courseForm.formState.errors.description && <p className="text-xs text-destructive">{courseForm.formState.errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>URL da Capa (Opcional)</Label>
                  <Input className="bg-secondary/50 border-border/50 h-11" placeholder="https://..." {...courseForm.register("thumbnailUrl")} />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <div className="space-y-0.5">
                    <Label>Publicar imediatamente</Label>
                    <p className="text-xs text-muted-foreground">Estudantes poderão ver o curso.</p>
                  </div>
                  <Switch checked={courseForm.watch("isPublished")} onCheckedChange={(v) => courseForm.setValue("isPublished", v)} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMutation.isPending} className="h-11 px-8 rounded-xl bg-primary">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Criar Curso
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
              <h3 className="text-2xl font-bold font-display">{courses?.length || 0}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Matrículas</p>
              <h3 className="text-2xl font-bold font-display">{totalStudents}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Publicados</p>
              <h3 className="text-2xl font-bold font-display">{publishedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cursos */}
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Gerenciar Cursos</h2>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses?.map((course) => (
              <Card key={course.id} className="bg-card border-border/50 overflow-hidden hover:border-primary/50 transition-colors" data-testid={`card-course-${course.id}`}>
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-32 bg-secondary shrink-0 relative">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-muted-foreground/30" /></div>
                    )}
                    {!course.isPublished && (
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-yellow-500 border border-yellow-500/30">Rascunho</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display line-clamp-1 mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-4">{course.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> {course.totalSections} Seções</span>
                        <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> {course.totalLessons} Aulas</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course.totalStudents} Alunos</span>
                      </div>
                      <Link href={`/admin/course/${course.id}`}>
                        <Button variant="secondary" className="rounded-lg h-9 font-medium">
                          <Settings className="w-4 h-4 mr-2" /> Editar Conteúdo
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {courses?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border/50">
                Nenhum curso cadastrado. Crie o primeiro para começar!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
