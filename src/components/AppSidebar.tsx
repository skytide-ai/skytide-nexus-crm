import {
  Calendar,
  Home,
  Settings,
  Users,
  Wrench,
  Clock,
  UserCheck,
  MessageSquare,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Link, useLocation } from "react-router-dom"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["admin", "member", "superadmin"],
  },
  {
    title: "Miembros",
    url: "/members",
    icon: Users,
    roles: ["admin", "superadmin"],
  },
  {
    title: "Servicios",
    url: "/services",
    icon: Wrench,
    roles: ["admin", "member", "superadmin"],
  },
  {
    title: "Disponibilidad",
    url: "/availability",
    icon: Clock,
    roles: ["admin", "member", "superadmin"],
  },
  {
    title: "Contactos",
    url: "/contacts",
    icon: UserCheck,
    roles: ["admin", "member", "superadmin"],
  },
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
    roles: ["admin", "member", "superadmin"],
  },
  // La sección de Citas ha sido eliminada
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
    roles: ["admin", "superadmin"],
  },
  {
    title: "WhatsApp",
    url: "/admin/whatsapp",
    icon: MessageSquare,
    roles: ["admin", "superadmin"],
  },
]

export function AppSidebar() {
  const { profile } = useAuth()
  const location = useLocation()

  if (!profile) return null

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(profile.role)
  )

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
