"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "@/lib/trpc";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </SessionProvider>
  );
}
