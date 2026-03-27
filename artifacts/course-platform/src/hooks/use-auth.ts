import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetMe, 
  useLogin, 
  useRegister, 
  useLogout,
  getGetMeQueryKey 
} from "@workspace/api-client-react";
import type { LoginRequest, RegisterRequest } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  // Check if we have a valid token by fetching user
  const { data: user, isLoading: isUserLoading, error: userError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  // If fetching me fails (e.g. 401), clear token
  useEffect(() => {
    if (userError) {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, [userError]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: err.message || "Please check your credentials.",
        });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({
          title: "Account created!",
          description: "Bem-vindo ao Unesc Labs.",
        });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: err.message || "Could not create account.",
        });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSettled: () => {
        localStorage.removeItem("token");
        setToken(null);
        queryClient.clear(); // Clear all cached data
        toast({
          title: "Logged out",
          description: "You have been logged out successfully.",
        });
      }
    }
  });

  const login = async (data: LoginRequest) => loginMutation.mutateAsync({ data });
  const register = async (data: RegisterRequest) => registerMutation.mutateAsync({ data });
  const logout = async () => logoutMutation.mutateAsync();

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isUserLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    login,
    register,
    logout,
    isAdmin: user?.role === "admin",
  };
}
