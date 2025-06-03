import { useAuth } from "@/contexts/AuthContext";

export default function DebugAuth() {
  const { user, profile, organization } = useAuth();

  return (
    <div className="bg-gray-100 p-4 rounded-md mb-4 text-xs">
      <h3 className="font-bold mb-2">Información de depuración</h3>
      <div>
        <p><strong>Usuario ID:</strong> {user?.id || 'No autenticado'}</p>
        <p><strong>Perfil:</strong> {profile ? `${profile.first_name} ${profile.last_name} (${profile.role})` : 'No disponible'}</p>
        <p><strong>Organización:</strong> {organization ? `${organization.name} (${organization.id})` : 'No disponible'}</p>
      </div>
    </div>
  );
}
