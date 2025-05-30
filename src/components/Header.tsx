
import { Bell, Search, User, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { profile, organization, signOut, isSuperAdmin, isAdmin } = useAuth();

  const getUserInitials = () => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getRoleBadge = () => {
    if (!profile) return null;
    
    const roleColors = {
      superadmin: 'bg-purple-500',
      admin: 'bg-blue-500',
      member: 'bg-green-500'
    };

    const roleLabels = {
      superadmin: 'Super Admin',
      admin: 'Administrador',
      member: 'Miembro'
    };

    return (
      <Badge className={`${roleColors[profile.role]} text-white text-xs`}>
        {roleLabels[profile.role]}
      </Badge>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-gray-100" />
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar contactos, servicios, citas..."
              className="pl-10 border-gray-200 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
                    </p>
                    {getRoleBadge()}
                  </div>
                  <p className="text-xs text-gray-500">
                    {profile?.email || 'email@usuario.com'}
                  </p>
                  {organization && (
                    <p className="text-xs text-gray-400">
                      {organization.name}
                    </p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              {(isAdmin || isSuperAdmin) && (
                <DropdownMenuItem>
                  Configuración de organización
                </DropdownMenuItem>
              )}
              {isSuperAdmin && (
                <DropdownMenuItem>
                  Panel de Super Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
