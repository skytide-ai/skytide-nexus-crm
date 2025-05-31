
export interface MemberProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'member' | 'superadmin';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MemberInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  expires_at: string;
  created_at: string;
  used: boolean;
}

export interface CreateMemberForm {
  email: string;
  firstName: string;
  lastName: string;
}
