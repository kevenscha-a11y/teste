import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetCourse, 
  useEnrollCourse, 
  useMarkLessonComplete, 
  getGetCourseQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, 
  PlayCircle, 
  CheckCircle, 
  Lock, 
  Award,
  ChevronLeft,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading, error } = useGetCourse(courseId);
  const enrollMutation = useEnrollCourse();
  const completeMutation = useMarkLessonComplete();

  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);

  // Initialize active lesson
  useEffect(() => {
    if (course && !activeLessonId && course.sections.length > 0) {
      // Find first incomplete lesson
      let firstIncomplete = null;
      let firstLesson = null;
      
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (!firstLesson) firstLesson = lesson.id;
          if (!course.completedLessons.includes(lesson.id)) {
            firstIncomplete = lesson.id;
            break;
          }
        }
        if (firstIncomplete) break;
      }
      setActiveLessonId(firstIncomplete || firstLesson);
    }
  }, [course, activeLessonId]);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !course) {
    return <div className="text-center py-20 text-destructive">Course not found.</div>;
  }

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({ courseId });
      queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
      toast({ title: "Enrolled successfully!", description: "You can now start learning." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Enrollment failed", description: e.message });
    }
  };

  const handleMarkComplete = async (lessonId: number) => {
    try {
      await completeMutation.mutateAsync({ lessonId });
      queryClient.invalidateQueries({ queryKey: getGetCourseQueryKey(courseId) });
      
      // Auto-advance to next lesson
      let foundCurrent = false;
      let nextLessonId = null;
      
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (foundCurrent) {
            nextLessonId = lesson.id;
            break;
          }
          if (lesson.id === lessonId) {
            foundCurrent = true;
          }
        }
        if (nextLessonId) break;
      }
      
      if (nextLessonId) {
        setActiveLessonId(nextLessonId);
      } else {
        toast({ title: "Course Completed!", description: "Congratulations!" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to mark complete", description: e.message });
    }
  };

  const isCompleted = course.progressPercent === 100;
  
  // Find current lesson object
  let currentLesson = null;
  for (const section of course.sections) {
    const found = section.lessons.find(l => l.id === activeLessonId);
    if (found) currentLesson = found;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] -mx-4 md:-mx-8 lg:-mx-10 mt-[-1rem]">
      {/* Player Header */}
      <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="hidden md:block w-px h-6 bg-border/50 mx-2" />
          <h1 className="font-display font-semibold text-lg line-clamp-1">{course.title}</h1>
        </div>
        
        {course.isEnrolled && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-primary">{Math.round(course.progressPercent)}% Complete</span>
              <Progress value={course.progressPercent} className="w-32 h-1.5 bg-secondary" />
            </div>
            {isCompleted && (
              <Link href={`/certificate/${course.id}`}>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 rounded-full h-9">
                  <Award className="w-4 h-4 mr-2" /> Get Certificate
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Player Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-background scrollbar-hide relative">
          {!course.isEnrolled ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/20">
              <div className="w-24 h-24 bg-gradient-to-tr from-primary to-accent rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">{course.title}</h2>
              <p className="text-muted-foreground max-w-lg mb-8 text-lg">{course.description}</p>
              <Button 
                onClick={handleEnroll} 
                disabled={enrollMutation.isPending}
                className="h-14 px-10 text-lg rounded-full font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all"
              >
                {enrollMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Enroll Now to Start Learning
              </Button>
            </div>
          ) : currentLesson ? (
            <div className="flex-1 flex flex-col">
              <div className="w-full aspect-video bg-black flex items-center justify-center relative shadow-2xl">
                {currentLesson.videoUrl ? (
                  <video 
                    src={currentLesson.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                    onEnded={() => {
                      if (!course.completedLessons.includes(currentLesson!.id)) {
                        handleMarkComplete(currentLesson!.id);
                      }
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <PlayCircle className="w-16 h-16 mb-4 opacity-20" />
                    <p>No video available for this lesson.</p>
                  </div>
                )}
              </div>
              
              <div className="p-8 max-w-4xl w-full mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-3xl font-display font-bold">{currentLesson.title}</h2>
                  
                  {!course.completedLessons.includes(currentLesson.id) ? (
                    <Button 
                      onClick={() => handleMarkComplete(currentLesson!.id)}
                      disabled={completeMutation.isPending}
                      className="bg-secondary hover:bg-secondary/80 text-foreground border border-border shrink-0"
                    >
                      {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2 text-muted-foreground" />}
                      Mark Complete
                    </Button>
                  ) : (
                    <div className="flex items-center text-green-500 font-medium px-4 py-2 bg-green-500/10 rounded-lg shrink-0">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Completed
                    </div>
                  )}
                </div>
                
                <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {currentLesson.description || "No description provided."}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a lesson to begin.
            </div>
          )}
        </div>

        {/* Sidebar Curriculum */}
        <div className="w-full lg:w-96 border-l border-border/50 bg-card flex flex-col shrink-0 lg:h-full z-10">
          <div className="p-4 border-b border-border/50 font-semibold text-lg font-display bg-secondary/20">
            Course Content
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={course.sections.map(s => s.id.toString())} className="w-full">
              {course.sections.map((section, idx) => (
                <AccordionItem value={section.id.toString()} key={section.id} className="border-b border-border/50">
                  <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-secondary/30 data-[state=open]:bg-secondary/10 transition-colors">
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Section {idx + 1}</span>
                      <span className="font-semibold text-sm">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-0">
                    <div className="flex flex-col">
                      {section.lessons.map((lesson, lIdx) => {
                        const isActive = activeLessonId === lesson.id;
                        const isDone = course.completedLessons.includes(lesson.id);
                        const isLocked = !course.isEnrolled;

                        return (
                          <button
                            key={lesson.id}
                            disabled={isLocked}
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`
                              w-full flex items-start gap-3 p-4 text-left transition-all
                              ${isActive ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-secondary/40"}
                              ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                              ) : isLocked ? (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${isActive ? 'border-primary text-primary' : 'border-muted-foreground/50 text-muted-foreground'}`}>
                                  {lIdx + 1}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col flex-1">
                              <span className={`text-sm ${isActive ? 'text-primary font-semibold' : 'text-foreground'}`}>
                                {lesson.title}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {lesson.duration} min
                                </span>
                              )}
                            </div>
                            {isActive && !isDone && (
                               <div className="w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
