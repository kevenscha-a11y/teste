import { useParams, Link } from "wouter";
import { useGetCertificate } from "@workspace/api-client-react";
import { Loader2, Download, ChevronLeft, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: cert, isLoading, error } = useGetCertificate(parseInt(courseId || "0", 10));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-2">Certificate not available</h1>
        <p className="text-muted-foreground mb-6">You need to complete 100% of the course to view your certificate.</p>
        <Link href={`/course/${courseId}`}>
          <Button variant="secondary">Return to Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full mb-8 flex justify-between items-center">
        <Link href={`/course/${courseId}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5 mr-2" /> Back to Course
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center"
      >
        {/* Certificate Container - The part that prints */}
        <div className="relative w-full max-w-[1000px] aspect-[1.414/1] bg-white rounded-sm shadow-2xl overflow-hidden print:shadow-none print:w-[297mm] print:h-[210mm] print:m-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/cert-bg.png`} 
            alt="Certificate Border" 
            className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
          />
          
          <div className="absolute inset-8 border-[12px] border-double border-[#1e3a8a] opacity-80 pointer-events-none" />
          <div className="absolute inset-10 border border-[#1e3a8a] opacity-40 pointer-events-none" />
          
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-16 text-center text-[#0f172a]">
            
            <div className="mb-8">
              <Award className="w-20 h-20 text-[#ca8a04] mx-auto" />
            </div>

            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-widest text-[#1e3a8a] mb-2 uppercase">
              Certificate
            </h1>
            <p className="text-xl md:text-2xl font-serif tracking-widest text-[#ca8a04] mb-12 uppercase">
              of Completion
            </p>

            <p className="text-lg md:text-xl text-slate-600 mb-6 font-sans">
              This is to proudly certify that
            </p>

            <h2 className="text-4xl md:text-5xl font-display font-bold text-[#0f172a] border-b-2 border-slate-300 pb-2 mb-8 inline-block px-12">
              {cert.studentName}
            </h2>

            <p className="text-lg md:text-xl text-slate-600 mb-6 font-sans max-w-2xl">
              has successfully completed the online course
            </p>

            <h3 className="text-2xl md:text-3xl font-display font-bold text-[#1e3a8a] mb-16 max-w-3xl leading-tight">
              {cert.courseName}
            </h3>

            <div className="flex justify-between w-full max-w-3xl mt-auto items-end">
              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 px-8 mb-2 font-semibold text-lg text-slate-700">
                  {format(new Date(cert.completedAt), "MMMM do, yyyy")}
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Date</p>
              </div>
              
              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 px-8 mb-2 font-display font-bold text-2xl text-[#1e3a8a]">
                  EduPlay
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Platform</p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
