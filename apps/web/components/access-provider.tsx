"use client"

import * as React from "react"

interface AccessSnapshot { permissions: ReadonlySet<string>; roles: ReadonlySet<string> }
const AccessContext = React.createContext<AccessSnapshot>({ permissions: new Set(), roles: new Set() })

export function AccessProvider({ permissions, roles, children }: { permissions: string[]; roles: string[]; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ permissions: new Set(permissions), roles: new Set(roles) }), [permissions, roles])
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const access = React.useContext(AccessContext)
  return React.useMemo(() => ({
    ...access,
    can: (permission?: string) => !permission || access.permissions.has(permission),
    hasRole: (role?: string) => !role || access.roles.has(role),
  }), [access])
}
