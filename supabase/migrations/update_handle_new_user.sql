
-- Actualizar la función handle_new_user para manejar usuarios invitados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  org_id UUID;
BEGIN
  -- Si el usuario fue invitado, usar los datos de la invitación
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    -- Usuario invitado - usar organización de la invitación
    INSERT INTO public.profiles (id, email, first_name, last_name, organization_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      (NEW.raw_user_meta_data->>'organization_id')::UUID,
      'member'
    );
  ELSIF NEW.raw_user_meta_data->>'organization_name' IS NOT NULL THEN
    -- Admin creando nueva organización
    INSERT INTO public.organizations (name)
    VALUES (NEW.raw_user_meta_data->>'organization_name')
    RETURNING id INTO org_id;
    
    INSERT INTO public.profiles (id, email, first_name, last_name, organization_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      org_id,
      'admin'
    );
  ELSE
    -- Usuario sin organización (para casos especiales)
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      'member'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
