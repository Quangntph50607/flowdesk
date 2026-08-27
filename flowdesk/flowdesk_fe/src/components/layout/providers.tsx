"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

function TokenRefresher({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const { accessToken, refreshToken, setTokens, clearAuth } =
      useAuthStore.getState();

    // Đã có accessToken → không cần làm gì
    if (accessToken) {
      setReady(true);
      return;
    }

    // Có refreshToken nhưng mất accessToken → lấy lại trước khi render
    if (refreshToken) {
      authService
        .refresh({ refreshToken })
        .then((res) => setTokens(res.accessToken, res.refreshToken))
        .catch(() => clearAuth())
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TokenRefresher>{children}</TokenRefresher>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
