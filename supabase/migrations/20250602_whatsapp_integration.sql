-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla para la configuración global de WhatsApp por organización
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_url TEXT,
  bot_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id)
);

-- Tabla para la configuración por número de teléfono
CREATE TABLE IF NOT EXISTS whatsapp_phone_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  bot_enabled BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, phone_number)
);

-- Tabla para almacenar mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_from_admin BOOLEAN DEFAULT FALSE,
  is_from_bot BOOLEAN DEFAULT FALSE,
  media_url TEXT,
  media_type TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS whatsapp_messages_organization_id_idx ON whatsapp_messages(organization_id);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_number_idx ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS whatsapp_messages_timestamp_idx ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS whatsapp_messages_contact_id_idx ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS whatsapp_phone_config_contact_id_idx ON whatsapp_phone_config(contact_id);

-- Función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp en whatsapp_config
DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar el timestamp en whatsapp_phone_config
DROP TRIGGER IF EXISTS update_whatsapp_phone_config_updated_at ON whatsapp_phone_config;
CREATE TRIGGER update_whatsapp_phone_config_updated_at
BEFORE UPDATE ON whatsapp_phone_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener los chats de WhatsApp con la última información
CREATE OR REPLACE FUNCTION get_whatsapp_chats(org_id UUID)
RETURNS TABLE (
  phone_number TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT,
  contact_id UUID,
  contact_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT
      wm.phone_number,
      wm.message AS last_message,
      wm.timestamp AS last_message_at,
      wm.contact_id,
      ROW_NUMBER() OVER (PARTITION BY wm.phone_number ORDER BY wm.timestamp DESC) AS rn
    FROM
      whatsapp_messages wm
    WHERE
      wm.organization_id = org_id
  ),
  unread_counts AS (
    SELECT
      wm.phone_number,
      COUNT(*) AS unread_count
    FROM
      whatsapp_messages wm
    WHERE
      wm.organization_id = org_id
      AND wm.is_from_admin = FALSE
      AND wm.is_from_bot = FALSE
    GROUP BY
      wm.phone_number
  ),
  contact_info AS (
    SELECT 
      wpc.phone_number,
      wpc.contact_id,
      c.name AS contact_name
    FROM
      whatsapp_phone_config wpc
    LEFT JOIN
      contacts c ON wpc.contact_id = c.id
    WHERE
      wpc.organization_id = org_id
  )
  SELECT
    lm.phone_number,
    lm.last_message,
    lm.last_message_at,
    COALESCE(uc.unread_count, 0) AS unread_count,
    COALESCE(ci.contact_id, lm.contact_id) AS contact_id,
    ci.contact_name
  FROM
    latest_messages lm
  LEFT JOIN
    unread_counts uc ON lm.phone_number = uc.phone_number
  LEFT JOIN
    contact_info ci ON lm.phone_number = ci.phone_number
  WHERE
    lm.rn = 1
  ORDER BY
    lm.last_message_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para whatsapp_config
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their organization's WhatsApp config"
  ON whatsapp_config FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Admins can insert their organization's WhatsApp config"
  ON whatsapp_config FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Admins can update their organization's WhatsApp config"
  ON whatsapp_config FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

-- Políticas RLS para whatsapp_phone_config
ALTER TABLE whatsapp_phone_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their organization's WhatsApp phone config"
  ON whatsapp_phone_config FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_phone_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Admins can insert their organization's WhatsApp phone config"
  ON whatsapp_phone_config FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_phone_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Admins can update their organization's WhatsApp phone config"
  ON whatsapp_phone_config FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_phone_config.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

-- Políticas RLS para whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization's WhatsApp messages"
  ON whatsapp_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_messages.organization_id
    )
  );

CREATE POLICY "Admins can insert their organization's WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p
      WHERE p.organization_id = whatsapp_messages.organization_id
      AND (p.role = 'admin' OR p.role = 'super_admin')
    )
  );

-- Función para crear o actualizar la configuración de un número de teléfono
CREATE OR REPLACE FUNCTION get_or_create_phone_config(
  org_id UUID,
  phone_num TEXT,
  contact_id UUID DEFAULT NULL,
  bot_enabled_val BOOLEAN DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  config_id UUID;
  global_bot_enabled BOOLEAN;
BEGIN
  -- Intentar obtener la configuración existente
  SELECT id INTO config_id FROM whatsapp_phone_config
  WHERE organization_id = org_id AND phone_number = phone_num;
  
  IF config_id IS NULL THEN
    -- Si no existe, obtener la configuración global para el valor por defecto de bot_enabled
    IF bot_enabled_val IS NULL THEN
      SELECT bot_enabled INTO global_bot_enabled FROM whatsapp_config
      WHERE organization_id = org_id;
    ELSE
      global_bot_enabled := bot_enabled_val;
    END IF;
    
    -- Crear nueva configuración
    INSERT INTO whatsapp_phone_config (
      organization_id, 
      phone_number, 
      contact_id, 
      bot_enabled
    ) VALUES (
      org_id, 
      phone_num, 
      contact_id, 
      COALESCE(bot_enabled_val, global_bot_enabled, FALSE)
    )
    RETURNING id INTO config_id;
  ELSE
    -- Actualizar configuración existente si se proporcionan nuevos valores
    UPDATE whatsapp_phone_config
    SET 
      contact_id = COALESCE(contact_id, whatsapp_phone_config.contact_id),
      bot_enabled = COALESCE(bot_enabled_val, whatsapp_phone_config.bot_enabled)
    WHERE id = config_id;
  END IF;
  
  RETURN config_id;
END;
$$ LANGUAGE plpgsql;
