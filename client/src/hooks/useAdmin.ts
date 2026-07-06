import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export function useAdmin() {
  const { data, isLoading, refetch } = trpc.admin.status.useQuery();
  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const login = useCallback(
    async (password: string) => {
      return loginMutation.mutateAsync({ password });
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading,
    login,
    logout,
    loginError: loginMutation.error?.message || null,
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
  };
}
