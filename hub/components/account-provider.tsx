"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { accountClient } from "@/lib/account-client";

const SessionContext = createContext<Session | null>(null);
export const useAccountSession = () => useContext(SessionContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!accountClient) return;
    const listener = accountClient.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.data.subscription.unsubscribe();
  }, []);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
