import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false, // Don't throw on 401 errors
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}