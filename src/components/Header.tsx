import { User, ChevronDown, LogOut, Settings, UserCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { Link } from "react-router-dom";

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
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          <SidebarTrigger className="hover:bg-gray-100 transition-colors p-2 rounded-lg shrink-0" />
          
          {/* Organization Info - Hidden on small screens */}
          <div className="hidden lg:block min-w-0">
            {organization && (
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {organization.name}
                </h1>
                <p className="text-xs text-gray-500">
                  Sistema de Gestión CRM
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Notification Dropdown */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-50/80 transition-all duration-200 px-2 md:px-3 py-2 h-auto rounded-xl border border-transparent hover:border-gray-200"
              >
                {/* User info - Show only on larger screens */}
                <div className="text-right min-w-0 hidden md:block">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario'}
                  </p>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    {getRoleBadge()}
                  </div>
                </div>
                
                {/* Avatar and chevron */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-gray-100 shadow-sm">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold text-xs md:text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 p-2 shadow-lg border border-gray-200/80 bg-white/95 backdrop-blur-sm">
              {/* User Info Header */}
              <div className="px-3 py-3 border-b border-gray-100 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-gray-100">
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
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {organization.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  {getRoleBadge()}
                </div>
              </div>
              
              {/* Menu Items */}
              <DropdownMenuItem asChild className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                <Link to="/settings" className="flex items-center w-full">
                  <Settings className="mr-3 h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                  <span className="text-sm font-medium">Configuración</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem 
                onClick={signOut}
                className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-600 transition-colors group"
              >
                <LogOut className="mr-3 h-4 w-4 group-hover:text-red-700" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
