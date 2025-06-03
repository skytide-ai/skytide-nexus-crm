
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string | null;
  role: 'superadmin' | 'admin' | 'member';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, organizationName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any | null }>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    // Evitar múltiples llamadas simultáneas
    if (profileLoading) {
      console.log('Profile fetch already in progress, skipping...');
      return;
    }

    try {
      setProfileLoading(true);
      console.log('Fetching profile for user:', userId);
      
      // Usamos any para evitar problemas de tipado con Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles' as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores si no existe

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        if (profileError.code !== 'PGRST116') { // PGRST116 es "no rows found", que no es un error real
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil del usuario",
            variant: "destructive",
          });
        }
        return;
      }

      if (!profileData) {
        console.log('No profile found for user:', userId);
        return;
      }

      console.log('Profile data:', profileData);
      
      // Verificar que profileData tiene la estructura esperada antes de asignarlo
      if (typeof profileData === 'object' && profileData !== null) {
        // Convertir a unknown primero y luego a Profile para evitar errores de tipado
        setProfile(profileData as unknown as Profile);
        
        // Verificar que organization_id existe y no es null antes de usarlo
        const orgId = (profileData as any).organization_id;
        if (orgId) {
          // Usamos any para evitar problemas de tipado con Supabase
          const { data: orgData, error: orgError } = await supabase
            .from('organizations' as any)
            .select('*')
            .eq('id', orgId)
            .maybeSingle();

          if (orgError) {
            console.error('Error fetching organization:', orgError);
          } else if (orgData) {
            console.log('Organization data:', orgData);
            // Convertir a unknown primero y luego a Organization para evitar errores de tipado
            setOrganization(orgData as unknown as Organization);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setProfileLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Usar setTimeout para evitar problemas de concurrencia
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id);
            }
          }, 100);
        } else {
          setProfile(null);
          setOrganization(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        console.log('Initial session:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, organizationName?: string) => {
    try {
      const userData: any = {
        first_name: firstName,
        last_name: lastName,
      };

      if (organizationName) {
        userData.organization_name = organizationName;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registro exitoso",
          description: "Por favor revisa tu email para confirmar tu cuenta",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Error in signIn:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setSession(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
    } catch (error: any) {
      console.error('Error in signOut:', error);
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  // Función para actualizar el perfil del usuario en el contexto
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No hay usuario autenticado') };
    
    try {
      // Actualizar el perfil en la base de datos
      // Usamos any para evitar problemas de tipado con Supabase
      const { error } = await supabase
        .from('profiles' as any)
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        console.error('Error al actualizar perfil:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil",
          variant: "destructive",
        });
        return { error };
      }
      
      // Actualizar el perfil en el estado local
      if (profile) {
        // Usamos un tipo más específico para evitar errores de tipado
        setProfile((prevProfile) => ({ ...prevProfile, ...updates }));
      }
      
      // Recargar el perfil para asegurar que tenemos los datos más recientes
      fetchUserProfile(user.id);
      
      return { error: null };
    } catch (error) {
      console.error('Error en updateProfile:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    organization,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin,
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
