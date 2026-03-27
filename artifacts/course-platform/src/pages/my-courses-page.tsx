import { useGetEnrollments } from "@workspace/api-client-react";
import { CourseCard } from "@/components/course-card";
import { Loader2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function MyCoursesPage() {
  const { data: enrollments, isLoading } = useGetEnrollments();

  return (
    <div className="space-y-8 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 border-b border-border/50 pb-6"
      >
        <h1 className="text-4xl font-display font-bold text-foreground">Meus Aprendizados</h1>
        <p className="text-muted-foreground text-lg">
          Continue de onde parou.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : enrollments && enrollments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrollments.map((enrollment, i) => (
            <CourseCard key={enrollment.id} course={enrollment.course} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 bg-card/30 rounded-3xl border border-border/50 border-dashed max-w-2xl mx-auto"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3">Você ainda não está matriculado em nenhum curso.</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            Explore o catálogo e encontre o próximo assunto que vai dominar.
          </p>
          <Link href="/">
            <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
              Ver Catálogo
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
