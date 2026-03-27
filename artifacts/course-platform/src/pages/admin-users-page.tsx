import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, Trash2, Eye, Loader2, Users, BookOpen, CheckCircle, X, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = import.meta.env.BASE_URL;

function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "student";
  enrollmentCount: number;
  completedLessonsCount: number;
}

interface CourseProgress {
  courseId: number;
  courseTitle: string;
  thumbnailUrl: string | null;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

interface UserProgress {
  user: { id: number; name: string; email: string; role: string };
  courses: CourseProgress[];
}

const createUserSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [progressUserId, setProgressUserId] = useState<number | null>(null);

  // List users
  const { data: users, isLoading } = useQuery<UserRow[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await authFetch("api/admin/users");
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      return res.json();
    },
  });

  // Get user progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/admin/users", progressUserId, "progress"],
    queryFn: async () => {
      const res = await authFetch(`api/admin/users/${progressUserId}/progress`);
      if (!res.ok) throw new Error("Falha ao carregar progresso");
      return res.json();
    },
    enabled: progressUserId !== null,
  });

  // Create user mutation
  const createForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      const res = await authFetch("api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao criar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Estudante criado com sucesso!" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await authFetch(`api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao excluir");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuário excluído" });
    },
    onError: (e: Error) => {
      toast({ variant: "destructive", title: "Erro", description: e.message });
    },
  });

  const filtered = users?.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalStudents = users?.filter(u => u.role === "student").length || 0;
  const totalAdmins = users?.filter(u => u.role === "admin").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Cadastre, visualize e exclua contas de estudantes.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 bg-primary shadow-lg shadow-primary/20" data-testid="button-create-user">
              <UserPlus className="w-4 h-4 mr-2" /> Novo Estudante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">Criar Estudante</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input className="bg-secondary/50 border-border/50 h-11" placeholder="João Silva" {...createForm.register("name")} />
                {createForm.formState.errors.name && <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" className="bg-secondary/50 border-border/50 h-11" placeholder="joao@exemplo.com" {...createForm.register("email")} />
                {createForm.formState.errors.email && <p className="text-xs text-destructive">{createForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" className="bg-secondary/50 border-border/50 h-11" {...createForm.register("password")} />
                {createForm.formState.errors.password && <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>}
              </div>
              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={createMutation.isPending} className="h-11 px-8 rounded-xl bg-primary">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-bold font-display">{users?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estudantes</p>
              <p className="text-2xl font-bold font-display">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold font-display">{totalAdmins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          data-testid="input-user-search"
          className="pl-10 h-11 bg-card border-border/50 rounded-xl"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors" data-testid={`card-user-${user.id}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-11 h-11 border border-border shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate" data-testid={`text-username-${user.id}`}>{user.name}</p>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px] shrink-0">
                            {user.role === "admin" ? "Admin" : "Estudante"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex gap-5 text-sm text-muted-foreground">
                        <div className="text-center">
                          <p className="font-bold text-foreground text-lg">{user.enrollmentCount}</p>
                          <p className="text-xs">Matrículas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-foreground text-lg">{user.completedLessonsCount}</p>
                          <p className="text-xs">Aulas Concluídas</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          data-testid={`button-view-progress-${user.id}`}
                          onClick={() => setProgressUserId(user.id)}
                          title="Ver progresso"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="icon"
                            data-testid={`button-delete-user-${user.id}`}
                            className="text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => {
                              if (confirm(`Excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`)) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-16 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border/50">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      )}

      {/* Progress Modal */}
      <AnimatePresence>
        {progressUserId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setProgressUserId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  {progressData ? (
                    <>
                      <h2 className="text-xl font-display font-bold">{progressData.user.name}</h2>
                      <p className="text-sm text-muted-foreground">{progressData.user.email}</p>
                    </>
                  ) : (
                    <h2 className="text-xl font-display font-bold">Progresso do Estudante</h2>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setProgressUserId(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                {isProgressLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : progressData?.courses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Este estudante ainda não está matriculado em nenhum curso.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressData?.courses.map(course => (
                      <Card key={course.courseId} className="bg-secondary/30 border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl bg-secondary shrink-0 overflow-hidden">
                              {course.thumbnailUrl ? (
                                <img src={course.thumbnailUrl} alt={course.courseTitle} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold mb-1 truncate">{course.courseTitle}</p>
                              <div className="flex items-center gap-2 mb-3">
                                <Progress value={course.progressPercent} className="flex-1 h-2 bg-secondary" />
                                <span className="text-sm font-bold text-primary shrink-0">{course.progressPercent}%</span>
                              </div>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                  {course.completedLessons} / {course.totalLessons} aulas
                                </span>
                                <span>
                                  Matriculado em {new Date(course.enrolledAt).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
