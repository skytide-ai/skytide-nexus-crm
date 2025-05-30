
import React from 'react';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ClerkAuth() {
  const clerk = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  
  console.log("Clerk instance:", clerk);
  console.log("Clerk loaded:", clerk?.loaded);
  console.log("User:", user);

  // Redirect authenticated users to organization creation or dashboard
  useEffect(() => {
    if (user && clerk?.loaded) {
      console.log("User authenticated, checking organization...");
      // If user has organizations, go to dashboard, otherwise create one
      if (user.organizationMemberships && user.organizationMemberships.length > 0) {
        navigate('/');
      } else {
        navigate('/create-organization');
      }
    }
  }, [user, clerk?.loaded, navigate]);

  if (!clerk?.loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skytide</h1>
              <p className="text-sm text-gray-500">CRM</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión o crea tu cuenta
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Iniciar Sesión</h3>
                <p className="text-sm text-gray-600">Ingresa con tu cuenta existente</p>
              </div>
              <div className="w-full">
                <SignIn 
                  path="/auth"
                  routing="path"
                  signUpUrl="/auth"
                  fallbackRedirectUrl="/create-organization"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                      card: 'shadow-none border-0 bg-transparent',
                      rootBox: 'w-full',
                      form: 'space-y-4'
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Crear Cuenta</h3>
                <p className="text-sm text-gray-600">Crea una nueva cuenta y organización</p>
              </div>
              <div className="w-full">
                <SignUp 
                  path="/auth"
                  routing="path"
                  signInUrl="/auth"
                  fallbackRedirectUrl="/create-organization"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                      card: 'shadow-none border-0 bg-transparent',
                      rootBox: 'w-full',
                      form: 'space-y-4'
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
