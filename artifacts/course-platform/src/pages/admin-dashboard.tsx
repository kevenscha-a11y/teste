import { useState } from "react";
import { Link } from "wouter";
import { useGetAdminCourses, useCreateCourse, getGetAdminCoursesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutDashboard, Users, BookOpen, Settings, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  title: z.string().min(3, "Title required"),
  description: z.string().min(10, "Description required"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});

export function AdminDashboard() {
  const { data: courses, isLoading } = useGetAdminCourses();
  const createMutation = useCreateCourse();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: "", description: "", thumbnailUrl: "", isPublished: false }
  });

  const onSubmit = async (data: z.infer<typeof createCourseSchema>) => {
    try {
      await createMutation.mutateAsync({ data: {
        ...data,
        thumbnailUrl: data.thumbnailUrl || null
      }});
      queryClient.invalidateQueries({ queryKey: getGetAdminCoursesQueryKey() });
      toast({ title: "Course created successfully" });
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error creating course", description: e.message });
    }
  };

  const totalStudents = courses?.reduce((acc, c) => acc + c.totalStudents, 0) || 0;
  const publishedCount = courses?.filter(c => c.isPublished).length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and content.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Create New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Create Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input className="bg-secondary/50 border-border/50 h-11" {...form.register("title")} />
                {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea className="bg-secondary/50 border-border/50 min-h-[100px]" {...form.register("description")} />
                {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Thumbnail URL (Optional)</Label>
                <Input className="bg-secondary/50 border-border/50 h-11" placeholder="https://..." {...form.register("thumbnailUrl")} />
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                  <Label>Publish Immediately</Label>
                  <p className="text-xs text-muted-foreground">Students can see published courses.</p>
                </div>
                <Switch checked={form.watch("isPublished")} onCheckedChange={(v) => form.setValue("isPublished", v)} />
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createMutation.isPending} className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Course
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50 shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
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
              <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
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
              <p className="text-sm font-medium text-muted-foreground">Published</p>
              <h3 className="text-2xl font-bold font-display">{publishedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-xl font-display font-semibold mb-4">Manage Courses</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {courses?.map((course) => (
              <Card key={course.id} className="bg-card border-border/50 overflow-hidden hover:border-primary/50 transition-colors">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 h-32 bg-secondary shrink-0 relative">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-muted-foreground/30" /></div>
                    )}
                    {!course.isPublished && (
                      <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-yellow-500 border border-yellow-500/30">Draft</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-lg font-bold font-display line-clamp-1 mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-4">{course.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> {course.totalSections} Sections</span>
                        <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> {course.totalLessons} Lessons</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course.totalStudents} Students</span>
                      </div>
                      <Link href={`/admin/course/${course.id}`}>
                        <Button variant="secondary" className="rounded-lg h-9 font-medium hover:bg-primary hover:text-primary-foreground">
                          <Settings className="w-4 h-4 mr-2" /> Edit Curriculum
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {courses?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border/50">
                No courses yet. Create one to get started!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
