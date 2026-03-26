import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, CheckCircle } from "lucide-react";
import type { CourseWithProgress } from "@workspace/api-client-react";
import { motion } from "framer-motion";

interface CourseCardProps {
  course: CourseWithProgress;
  index: number;
}

export function CourseCard({ course, index }: CourseCardProps) {
  const isCompleted = course.progressPercent === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link href={`/course/${course.id}`} className="block h-full outline-none">
        <Card className="h-full overflow-hidden bg-card border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer flex flex-col group rounded-2xl">
          <div className="relative aspect-video overflow-hidden bg-secondary">
            {course.thumbnailUrl ? (
              <img 
                src={course.thumbnailUrl} 
                alt={course.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <BookOpen className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
            
            {course.isEnrolled && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-white">Completed</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-white">{Math.round(course.progressPercent)}%</span>
                  </>
                )}
              </div>
            )}
            
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1.5 border border-white/10">
                <BookOpen className="w-3.5 h-3.5" />
                {course.totalLessons} Lessons
              </div>
            </div>
          </div>
          
          <CardContent className="p-5 flex flex-col flex-1">
            <h3 className="font-display text-lg font-bold text-foreground line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {course.description}
            </p>
            
            {course.isEnrolled && (
              <div className="mt-auto space-y-2">
                <Progress value={course.progressPercent} className="h-1.5 bg-secondary" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
