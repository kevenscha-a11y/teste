import { useGetCourses } from "@workspace/api-client-react";
import { CourseCard } from "@/components/course-card";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

export function CatalogPage() {
  const { data: courses, isLoading } = useGetCourses();
  const [search, setSearch] = useState("");

  const filteredCourses = courses?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold">Explore Courses</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Discover premium content created by experts. Upgrade your skills today.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative w-full md:w-72"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search courses..." 
            className="pl-10 h-12 bg-card border-border/50 rounded-xl focus:border-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card/30 rounded-3xl border border-border/50 border-dashed">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search query.</p>
        </div>
      )}
    </div>
  );
}
