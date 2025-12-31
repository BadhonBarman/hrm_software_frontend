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
  Home,
  ClipboardList,
  Users,
  BookOpen,
  School,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  LogOut,
} from "lucide-react"

const menuItems = [
  { title: "Overview", icon: Home, href: "/dashboard", isActive: true },
  { title: "Attendance entry", icon: ClipboardList, href: "/dashboard/attendance" },
  { title: "Students", icon: Users, href: "/dashboard/students" },
  { title: "Subjects", icon: BookOpen, href: "/dashboard/subjects" },
  { title: "Class", icon: School, href: "/dashboard/class" },
  { title: "Lesson planning", icon: Calendar, href: "/dashboard/lesson-planning" },
  { title: "Class scheduling", icon: CalendarCheck, href: "/dashboard/scheduling" },
  { title: "Mark entry & tracking", icon: ClipboardCheck, href: "/dashboard/marks" },
  { title: "Exams & results", icon: FileText, href: "/dashboard/exams" },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      {/* Logo Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <School className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Your Logo</span>
                  <span className="text-xs">Teacher Management</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/logout">
                <LogOut />
                <span>Logout</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}