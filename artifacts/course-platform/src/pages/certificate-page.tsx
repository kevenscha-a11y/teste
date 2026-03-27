import { useParams, Link } from "wouter";
import { useGetCertificate } from "@workspace/api-client-react";
import { Loader2, Download, ChevronLeft, Award, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
        <h1 className="text-2xl font-bold mb-2">Certificado não disponível</h1>
        <p className="text-muted-foreground mb-6">Você precisa concluir 100% do curso para visualizar o seu certificado.</p>
        <Link href={`/course/${courseId}`}>
          <Button variant="secondary">Voltar ao Curso</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full mb-6 flex justify-between items-center">
        <Link href={`/course/${courseId}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5 mr-2" /> Voltar ao Curso
          </Button>
        </Link>
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20">
          <Download className="w-4 h-4 mr-2" /> Baixar PDF
        </Button>
      </div>

      {/* Instrução ao estudante */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl p-4">
          <Send className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Próximo passo</p>
            <p className="text-sm text-muted-foreground">
              Parabéns por concluir o curso <span className="font-semibold text-foreground">{cert.courseName}</span>! Baixe este documento e envie-o ao coordenador do curso para validação.
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="relative w-full max-w-[1000px] aspect-[1.414/1] bg-white rounded-sm shadow-2xl overflow-hidden print:shadow-none print:w-[297mm] print:h-[210mm] print:m-0">
          {/* Bordas decorativas */}
          <div className="absolute inset-8 border-[12px] border-double border-[#1e3a8a] opacity-80 pointer-events-none" />
          <div className="absolute inset-10 border border-[#1e3a8a] opacity-40 pointer-events-none" />

          {/* Fundo decorativo sutil */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 1px, transparent 1px, transparent 20px)" }}
          />

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 text-center text-[#0f172a]">

            <div className="mb-6">
              <Award className="w-16 h-16 text-[#ca8a04] mx-auto" />
            </div>

            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-widest text-[#1e3a8a] mb-1 uppercase">
              Certificado
            </h1>
            <p className="text-lg md:text-xl font-serif tracking-widest text-[#ca8a04] mb-8 uppercase">
              de Conclusão
            </p>

            <p className="text-base md:text-lg text-slate-600 mb-4 font-sans">
              Certificamos com orgulho que
            </p>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0f172a] border-b-2 border-slate-300 pb-2 mb-6 inline-block px-12">
              {cert.studentName}
            </h2>

            <p className="text-base md:text-lg text-slate-600 mb-4 font-sans">
              concluiu com êxito o curso online
            </p>

            <h3 className="text-xl md:text-2xl font-display font-bold text-[#1e3a8a] mb-4 max-w-3xl leading-tight">
              {cert.courseName}
            </h3>

            {/* Mensagem ao coordenador */}
            <p className="text-xs text-slate-500 italic mb-6 max-w-lg">
              Envie este documento ao coordenador do curso para validação da conclusão.
            </p>

            <div className="flex justify-between w-full max-w-3xl mt-auto items-end">
              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 px-8 mb-2 font-semibold text-base text-slate-700">
                  {format(new Date(cert.completedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data de Conclusão</p>
              </div>

              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 px-8 mb-2 font-display font-bold text-xl text-[#1e3a8a]">
                  EduPlay
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plataforma</p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
