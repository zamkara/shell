import { Shell } from "@/components/shell"
import { getAdminProfile } from "@/lib/profile"

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getAdminProfile()

  return (
    <Shell
      user={{
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        avatar_url: profile.resolved_avatar_url,
        role: profile.role,
        roles: profile.roles,
        permissions: profile.permissions,
      }}
      profile={profile}
    >
      {children}
    </Shell>
  )
}
