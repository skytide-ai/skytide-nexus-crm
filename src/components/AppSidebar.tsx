
import {
  Calendar,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  Clock,
  Phone,
  Plus,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Agendamientos",
    url: "/appointments",
    icon: Clock,
  },
  {
    title: "Contactos",
    url: "/contacts",
    icon: Phone,
  },
  {
    title: "Servicios",
    url: "/services",
    icon: Plus,
    requiresAdmin: true,
  },
  {
    title: "Miembros",
    url: "/members",
    icon: Users,
    requiresAdmin: true,
  },
  {
    title: "Disponibilidad",
    url: "/availability",
    icon: UserCheck,
  },
];

const settingsItems = [
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
    requiresAdmin: true,
  },
];

const systemItems = [
  {
    title: "Sistema Admin",
    url: "/system-admin",
    icon: Shield,
    requiresSuperAdmin: true,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isSuperAdmin } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiresAdmin || (item.requiresAdmin && (isAdmin || isSuperAdmin))
  );

  const filteredSettingsItems = settingsItems.filter(item => 
    !item.requiresAdmin || (item.requiresAdmin && (isAdmin || isSuperAdmin))
  );

  const filteredSystemItems = systemItems.filter(item => 
    !item.requiresSuperAdmin || (item.requiresSuperAdmin && isSuperAdmin)
  );

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Skytide</h1>
            <p className="text-sm text-gray-500">CRM</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    className={`w-full justify-start gap-3 h-10 hover:bg-primary/5 hover:text-primary transition-colors ${
                      location.pathname === item.url
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-gray-700"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSettingsItems.length > 0 && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`w-full justify-start gap-3 h-10 hover:bg-primary/5 hover:text-primary transition-colors ${
                        location.pathname === item.url
                          ? "bg-primary/10 text-primary border-r-2 border-primary"
                          : "text-gray-700"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredSystemItems.length > 0 && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSystemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`w-full justify-start gap-3 h-10 hover:bg-primary/5 hover:text-primary transition-colors ${
                        location.pathname === item.url
                          ? "bg-primary/10 text-primary border-r-2 border-primary"
                          : "text-gray-700"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
