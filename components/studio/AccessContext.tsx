"use client";

import { createContext, useContext } from "react";
import type { UserAccess } from "@/components/dashboard/instructor/types";

const AccessContext = createContext<UserAccess | null>(null);

export function AccessProvider({ access, children }: { access: UserAccess | null; children: React.ReactNode }) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>;
}

/** The signed-in user's `access` object from /users/me (§4.2). */
export function useAccess() {
  const access = useContext(AccessContext);
  return {
    access,
    capabilities: access?.capabilities ?? {},
    // Treat a missing flag as "on": the governed flow is the safe default.
    governanceEnabled: access?.governance_enabled !== false,
  };
}
