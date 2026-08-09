"use client"

import { ChevronRight, ChevronsUpDown, LogOut, UserRound } from "lucide-react"
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Toolbar, PageHeader } from "./toolbar"
import { Frame } from "@workspace/ui/components/frame"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Collapsible,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"
import { SHELL_NAV_TREE, type ShellNavigationItem } from "@/lib/data"
import type { SessionUser } from "@/lib/session"
import type { Profile } from "@/lib/profile"
import { ProfileForm } from "./profile/profile-form"
import { AccessProvider } from "./access-provider"

// Base nav item - used by simple sidebars
// User data for footer (Sidebar6+)
type UserData = {
  name: string
  email: string
  avatar: string
  roles: string[]
}

// Complete sidebar data structure
type SidebarData = {
  // Logo/branding (all sidebars)
  logo: {
    title: string
    description: string
  }
  navigation: ShellNavigationItem[]
}

// Shared sidebar data - works with all sidebar variations
const sidebarData: SidebarData = {
  logo: {
    title: "Almatera Incubator",
    description: "Landing Control Centre",
  },
  navigation: SHELL_NAV_TREE,
}

const AlmateraLogo = (props: React.ComponentProps<"svg">) => (
  <svg
    viewBox="0 0 46 40"
    fill="none"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M0 33L4.60606 25H12.2448C17.2569 25 21.4947 28.7103 22.1571 33.6784L23 40H13L11.5585 36.6365C10.613 34.4304 8.44379 33 6.04362 33H0Z"
      fill="currentColor"
    />
    <path
      d="M46 33L41.3939 25H33.7552C28.7431 25 24.5053 28.7103 23.8429 33.6784L23 40H33L34.4415 36.6365C35.387 34.4304 37.5562 33 39.9564 33H46Z"
      fill="currentColor"
    />
    <path
      d="M4.60608 25L18.9999 0H23L22.6032 9.52405C22.2608 17.7406 15.7455 24.3596 7.53539 24.8316L4.60608 25Z"
      fill="currentColor"
    />
    <path
      d="M41.3939 25L27.0001 0H23L23.3968 9.52405C23.7392 17.7406 30.2545 24.3596 38.4646 24.8316L41.3939 25Z"
      fill="currentColor"
    />
  </svg>
)

const SidebarLogo = ({ logo }: { logo: SidebarData["logo"] }) => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">
          <AlmateraLogo className="size-8 shrink-0 text-sidebar-foreground" />
          <span className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">{logo.title}</span>
            <span className="text-muted-foreground">{logo.description}</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const NavMenuItem = ({
  item,
  pathname,
}: {
  item: ShellNavigationItem
  pathname: string
}) => {
  const router = useRouter()
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0
  const isActive =
    pathname === item.href ||
    item.children?.some((child) => pathname === child.href) === true

  if (!hasChildren) {
    if (!item.href) return null
    const href = item.href
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onPress={() => router.push(href)}
          isActive={isActive}
        >
          <Icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      defaultExpanded={item.defaultOpen || isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <SidebarMenuButton slot="trigger" isActive={isActive}>
          <Icon />
          <span>{item.label}</span>
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-expanded/collapsible:rotate-90" />
        </SidebarMenuButton>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => {
              const ChildIcon = child.icon
              if (!child.href) return null
              const href = child.href
              return (
                <SidebarMenuSubItem key={child.label}>
                  <SidebarMenuSubButton
                    onPress={() => router.push(href)}
                    isActive={pathname === href}
                  >
                    <ChildIcon />
                    <span>{child.label}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const NavUser = ({
  user,
  canOpenProfile,
  onOpenProfile,
}: {
  user: UserData
  canOpenProfile: boolean
  onOpenProfile: () => void
}) => {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  async function signOut() {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      router.replace("/auth")
      router.refresh()
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenuTrigger>
          <SidebarMenuButton
            size="lg"
            className="data-expanded:bg-sidebar-accent data-expanded:text-sidebar-accent-foreground"
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
          <DropdownMenu
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            placement="bottom end"
            offset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canOpenProfile && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onAction={onOpenProfile}>
                    <UserRound />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem onAction={signOut} isDisabled={isSigningOut}>
                <LogOut />
                {isSigningOut ? "Logging out…" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

const AppSidebar = ({
  user,
  permissions,
  onOpenProfile,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: UserData
  permissions: string[]
  onOpenProfile: () => void
}) => {
  const pathname = usePathname()
  const allowed = React.useMemo(() => new Set(permissions), [permissions])
  const navigation = React.useMemo(() => {
    const isAllowed = (item: ShellNavigationItem) =>
      (!item.permission || allowed.has(item.permission)) &&
      (!item.role || user.roles.includes(item.role))

    return sidebarData.navigation
      .map((item) => ({
        ...item,
        children: item.children?.filter(isAllowed),
      }))
      .filter((item) =>
        item.children ? item.children.length > 0 : isAllowed(item)
      )
  }, [allowed, user.roles])
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarLogo logo={sidebarData.logo} />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="min-h-0 flex-1">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <NavMenuItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          canOpenProfile={allowed.has("profile.read")}
          onOpenProfile={onOpenProfile}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

interface ShellProps {
  className?: string
  children?: React.ReactNode
  user: SessionUser
  profile: Profile
}

export function Shell({ className, children, user, profile }: ShellProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)

  return (
    <AccessProvider permissions={user.permissions} roles={user.roles}>
      <SidebarProvider className={cn(className)}>
        <AppSidebar
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar_url,
            roles: user.roles,
          }}
          permissions={user.permissions}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        <SidebarInset className="h-svh overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-sidebar px-6">
            <SidebarTrigger className="-ml-2" />
            <Separator
              orientation="vertical"
              className="mr-2 hidden data-[orientation=vertical]:h-4 md:block"
            />
            <PageHeader />
            <Toolbar />
          </header>
          <main className="flex min-h-0 flex-1 flex-col gap-4 bg-muted p-4">
            <Frame className="relative grid min-h-0 w-full flex-1 grid-cols-[1fr_20%] gap-(--frame-gap) shadow-none">
              {children}
            </Frame>
          </main>
        </SidebarInset>
        <ProfileForm
          initialProfile={profile}
          isOpen={isProfileOpen}
          canUpdate={user.permissions.includes("profile.update")}
          onOpenChange={setIsProfileOpen}
        />
      </SidebarProvider>
    </AccessProvider>
  )
}
