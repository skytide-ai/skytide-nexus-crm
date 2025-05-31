
-- Crear tabla para tokens de invitación
CREATE TABLE public.member_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

-- Política para que los admins puedan ver invitaciones de su organización
CREATE POLICY "Admins can view organization invitations" ON public.member_invitations
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Política para que los admins puedan crear invitaciones
CREATE POLICY "Admins can create invitations" ON public.member_invitations
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Política para que los admins puedan actualizar invitaciones de su organización
CREATE POLICY "Admins can update organization invitations" ON public.member_invitations
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

-- Índice para optimizar búsquedas por token
CREATE INDEX idx_member_invitations_token ON public.member_invitations(token);
CREATE INDEX idx_member_invitations_organization ON public.member_invitations(organization_id);
