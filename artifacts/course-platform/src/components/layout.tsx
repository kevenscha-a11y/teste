import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Library, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  GraduationCap
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Catalog", href: "/", icon: Library, show: true },
    { label: "My Courses", href: "/my-courses", icon: BookOpen, show: !!user && !isAdmin },
    { label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard, show: isAdmin },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const NavLinks = () => (
    <div className="flex flex-col gap-2 w-full">
      {navItems.filter(i => i.show).map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
              ${isActive 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"}
            `}>
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeNav" 
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 h-screen p-4 z-20">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-gradient">EduPlay</span>
        </div>
        
        <nav className="flex-1">
          <NavLinks />
        </nav>

        {user && (
          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl bg-secondary/50">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.role}</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-gradient">EduPlay</span>
        </div>
        
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-card border-border flex flex-col p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-gradient">EduPlay</span>
            </div>
            <nav className="flex-1">
              <NavLinks />
            </nav>
            {user && (
              <div className="mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-3 py-3 mb-2">
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-8 lg:p-10 min-h-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
