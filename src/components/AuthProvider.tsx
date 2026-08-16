"use client";

import { SessionProvider } from "next-auth/react";
import { API_BASE } from "@/lib/api";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath={`${API_BASE}/api/auth`}>
      {children}
    </SessionProvider>
  );
}
