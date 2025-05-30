
import React, { useState } from 'react';
import { useOrganizationList } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Building2, ArrowRight } from 'lucide-react';

export default function CreateOrganization() {
  const { createOrganization } = useOrganizationList();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState('');

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la organización es requerido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const organization = await createOrganization({
        name: orgName,
      });

      console.log("Organization created:", organization);

      toast({
        title: "¡Organización creada!",
        description: `${orgName} ha sido creada exitosamente`,
      });

      // Redirect to dashboard
      navigate('/');
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la organización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skytide</h1>
              <p className="text-sm text-gray-500">CRM</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Crear Organización</h2>
          <p className="mt-2 text-sm text-gray-600">
            Configura tu organización para comenzar a usar Skytide CRM
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Organización</CardTitle>
            <CardDescription>
              Ingresa el nombre de tu empresa u organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nombre de la Organización</Label>
                <Input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Mi Empresa S.A."
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    Crear Organización
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
