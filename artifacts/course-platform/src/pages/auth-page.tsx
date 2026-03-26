import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Redirect } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export function AuthPage() {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data);
    } catch (e) {
      // Error is handled in hook
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      await register(data);
    } catch (e) {
      // Error handled in hook
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-md px-4"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">EduPlay</h1>
          <p className="text-muted-foreground mt-2">Unlock your potential today.</p>
        </div>

        <Card className="glass-panel border-border/50 shadow-2xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-xl p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0 outline-none">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl"
                      {...loginForm.register("email")} 
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl"
                      {...loginForm.register("password")} 
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0 outline-none">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input 
                      id="register-name" 
                      placeholder="John Doe" 
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl"
                      {...registerForm.register("name")} 
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl"
                      {...registerForm.register("email")} 
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl"
                      {...registerForm.register("password")} 
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl font-semibold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 hover:-translate-y-0.5 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
