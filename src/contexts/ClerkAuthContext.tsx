
import React, { createContext, useContext } from 'react';
import { useUser, useOrganization, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface ClerkAuthContextType {
  user: any;
  profile: any;
  organization: any;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const { signOut: clerkSignOut } = useClerkAuth();

  // Check if user has admin role in the organization
  // En Clerk, cuando creas una organización, automáticamente te conviertes en "org:admin"
  const isAdmin = membership?.role === 'org:admin' || membership?.role === 'admin' || false;
  const isSuperAdmin = membership?.role === 'org:admin' || membership?.role === 'superadmin' || false;

  console.log("Membership role:", membership?.role);
  console.log("Is admin:", isAdmin);
  console.log("Is super admin:", isSuperAdmin);

  // Create a profile object compatible with the existing code
  const profile = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    organization_id: organization?.id || null,
    role: isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'member'),
    avatar_url: user.imageUrl,
    is_active: true,
    created_at: user.createdAt?.toISOString() || '',
    updated_at: user.updatedAt?.toISOString() || ''
  } : null;

  const organizationData = organization ? {
    id: organization.id,
    name: organization.name,
    created_at: organization.createdAt?.toISOString() || '',
    updated_at: organization.updatedAt?.toISOString() || ''
  } : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  const loading = !userLoaded || !orgLoaded;

  const value = {
    user,
    profile,
    organization: organizationData,
    loading,
    isAdmin,
    isSuperAdmin,
    signOut,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(ClerkAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a ClerkAuthProvider');
  }
  return context;
}
