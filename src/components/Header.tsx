
import { Bell, Search, User, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { profile, organization, isSuperAdmin, isAdmin, signOut } = useAuth();

  const getRoleBadge = () => {
    if (!profile) return null;
    
    const roleConfig = {
      superadmin: { color: 'bg-gradient-to-r from-purple-500 to-purple-600', label: 'Super Admin' },
      admin: { color: 'bg-gradient-to-r from-blue-500 to-blue-600', label: 'Administrador' },
      member: { color: 'bg-gradient-to-r from-green-500 to-green-600', label: 'Miembro' }
    };

    const config = roleConfig[profile.role];

    return (
      <Badge className={`${config.color} text-white text-xs font-medium px-2 py-0.5 shadow-sm`}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = () => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200/80 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-gray-100 transition-colors" />
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar contactos, servicios, citas..."
              className="pl-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-sm">
              3
            </span>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-3 hover:bg-gray-50 transition-colors px-3 py-2 h-auto rounded-lg"
              >
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
                    </p>
                    {getRoleBadge()}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {profile?.email || 'email@usuario.com'}
                  </p>
                  {organization && (
                    <p className="text-xs text-gray-400 truncate">
                      {organization.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border border-gray-200/50">
              <div className="px-3 py-2 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {profile?.email || 'email@usuario.com'}
                    </p>
                    {organization && (
                      <p className="text-xs text-gray-400 truncate">
                        {organization.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  {getRoleBadge()}
                </div>
              </div>
              
              <DropdownMenuItem className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50">
                <UserCircle className="mr-3 h-4 w-4 text-gray-500" />
                <span className="text-sm">Mi Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-50">
                <Settings className="mr-3 h-4 w-4 text-gray-500" />
                <span className="text-sm">Configuración</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem 
                onClick={signOut}
                className="px-3 py-2 rounded-md cursor-pointer hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
