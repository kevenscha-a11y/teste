import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setupApiClient } from "./lib/api-setup";
import { useAuth } from "./hooks/use-auth";
import { Layout } from "./components/layout";
import { AuthPage } from "./pages/auth-page";
import { CatalogPage } from "./pages/catalog-page";
import { MyCoursesPage } from "./pages/my-courses-page";
import { CoursePlayerPage } from "./pages/course-player-page";
import { AdminDashboard } from "./pages/admin-dashboard";
import { AdminCourseEdit } from "./pages/admin-course-edit";
import { CertificatePage } from "./pages/certificate-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Initialize API client token handling
setupApiClient();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  if (adminOnly && !isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Student Routes */}
      <Route path="/">
        {(params) => <ProtectedRoute component={CatalogPage} {...params} />}
      </Route>
      <Route path="/my-courses">
        {(params) => <ProtectedRoute component={MyCoursesPage} {...params} />}
      </Route>
      <Route path="/course/:id">
        {(params) => <ProtectedRoute component={CoursePlayerPage} {...params} />}
      </Route>
      <Route path="/certificate/:courseId">
        {(params) => <ProtectedRoute component={CertificatePage} {...params} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {(params) => <ProtectedRoute component={AdminDashboard} adminOnly {...params} />}
      </Route>
      <Route path="/admin/course/:id">
        {(params) => <ProtectedRoute component={AdminCourseEdit} adminOnly {...params} />}
      </Route>

      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
