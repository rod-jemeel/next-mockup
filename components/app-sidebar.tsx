"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Invoice01Icon,
  DeliveryBox01Icon,
  Settings01Icon,
  Logout01Icon,
  Building03Icon,
  ArrowDown01Icon,
  Shield01Icon,
  AiBrain01Icon,
  UserMultiple02Icon,
  Recycle01Icon,
} from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

const mainNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquare01Icon,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: Invoice01Icon,
  },
  {
    title: "Recurring",
    href: "/expenses/recurring",
    icon: Recycle01Icon,
  },
  {
    title: "Inventory",
    href: "/inventory/items",
    icon: DeliveryBox01Icon,
  },
  {
    title: "AI Assistant",
    href: "/ai",
    icon: AiBrain01Icon,
  },
]

const settingsNav = [
  {
    title: "Organization",
    href: "/settings/organization",
    icon: Building03Icon,
  },
  {
    title: "Categories",
    href: "/settings/categories",
    icon: Settings01Icon,
  },
  {
    title: "Members",
    href: "/settings/members",
    icon: UserMultiple02Icon,
  },
]

export function AppSidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="size-3" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton>
                    <Skeleton className="size-4" />
                    <Skeleton className="h-4 w-20" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-20" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex flex-1 flex-col items-start gap-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-28" />
              </div>
              <Skeleton className="size-3" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { data: activeOrg, isPending: orgPending } = authClient.useActiveOrganization()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/auth/sign-in"
        },
      },
    })
  }

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || "?"

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton className="w-full justify-between" />}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="size-4" />
                  {orgPending ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    <span className="truncate text-xs font-medium">
                      {activeOrg?.name || "Select Organization"}
                    </span>
                  )}
                </div>
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem render={<Link href="/org/select" />}>
                  Switch Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {session?.user?.role === "superadmin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/super"}
                  >
                    <Link href="/super">
                      <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />
                      <span>Super Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/super/organizations")}
                  >
                    <Link href="/super/organizations">
                      <HugeiconsIcon icon={Building03Icon} strokeWidth={2} />
                      <span>Organizations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton className="w-full" />}
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">
                    {sessionPending ? "..." : userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start text-left">
                  {sessionPending ? (
                    <Skeleton className="h-3 w-20" />
                  ) : (
                    <>
                      <span className="truncate text-xs font-medium">
                        {session?.user?.name || "User"}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {session?.user?.email}
                      </span>
                    </>
                  )}
                </div>
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem render={<Link href="/settings/profile" />}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
