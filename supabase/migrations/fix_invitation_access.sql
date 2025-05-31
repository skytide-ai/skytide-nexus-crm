
-- Crear política para permitir acceso público a invitaciones válidas por token
CREATE POLICY "Anyone can view invitation by token" ON public.member_invitations
FOR SELECT USING (
  -- Permitir acceso si la invitación no está usada y no ha expirado
  used = false AND expires_at > now()
);

-- Política para permitir actualizar invitaciones cuando se marcan como usadas
CREATE POLICY "Anyone can mark invitation as used" ON public.member_invitations
FOR UPDATE USING (
  used = false AND expires_at > now()
) WITH CHECK (
  used = true
);
