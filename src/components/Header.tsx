
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/ClerkAuthContext";

export function Header() {
  const { profile, organization, isSuperAdmin, isAdmin } = useAuth();

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

          <div className="flex items-center gap-3">
            <div className="text-right">
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
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
              showName={false}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
