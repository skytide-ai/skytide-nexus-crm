# 📧 Sistema de Notificaciones Automáticas por Email

Este sistema envía automáticamente emails diarios a cada miembro de las organizaciones con sus citas programadas para el día siguiente. Incluye panel de administración para configurar horarios y activación por organización.

## 🚀 Características

- **Panel de administración** para configurar notificaciones por organización
- **Activación/desactivación** individual por organización desde SuperAdmin
- **Horarios personalizados** para cada organización (configurable desde la UI)
- **Múltiples zonas horarias** soportadas (Bogotá, Nueva York, Madrid, etc.)
- **Templates HTML profesionales** con diseño responsive
- **Emails a TODOS los miembros** (con citas o sin citas)
- **Template especial** para miembros sin citas del día siguiente
- **Agrupación inteligente** de citas por miembro
- **Verificación cada minuto** para respetar horarios personalizados
- **Manejo robusto de errores** y logging completo
- **Modo de prueba** para desarrollo

## 📋 Requisitos Previos

### 1. Cuenta de Resend
- Crear cuenta en [Resend](https://resend.com)
- Obtener API Key
- Configurar dominio verificado (opcional pero recomendado)

### 2. Variables de Entorno
Crear archivo `.env` en la raíz del proyecto con:

```env
# Configuración de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Configuración de Resend para emails
RESEND_API_KEY=re_tu_api_key_de_resend_aqui

# Configuración de emails (opcional)
FROM_EMAIL=notificaciones@updates.skytidecrm.com
ORGANIZATION_NAME=Tu Organización
```

### 3. Base de Datos
Ejecutar el siguiente SQL en Supabase para crear la tabla de configuraciones:

```sql
-- Crear tabla para configuraciones de notificaciones por email
CREATE TABLE email_notifications_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  send_time TIME DEFAULT '18:00:00',
  timezone VARCHAR(50) DEFAULT 'America/Bogota',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id)
);

-- Insertar configuraciones por defecto para organizaciones existentes
INSERT INTO email_notifications_config (organization_id, is_enabled, send_time, timezone)
SELECT id, true, '18:00:00', 'America/Bogota'
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
```

### 4. Dependencias
Las dependencias ya están instaladas:
- `resend` - Cliente para envío de emails
- `node-cron` - Programación de tareas
- `dotenv` - Manejo de variables de entorno

## 🎯 Configuración desde el Panel

### Panel de SuperAdmin
1. **Acceder** a `/administration` como SuperAdmin
2. **Ir a la pestaña** "Notificaciones Email"
3. **Configurar cada organización**:
   - ✅ **Activar/Desactivar** notificaciones con el switch
   - 🕐 **Seleccionar hora** de envío (formato 24h)
   - 🌍 **Elegir zona horaria** de la lista
   - 📊 **Ver estado** actual de la configuración

### Zonas Horarias Disponibles
- **Bogotá** (UTC-5) - `America/Bogota`
- **Nueva York** (UTC-5/-4) - `America/New_York`
- **Ciudad de México** (UTC-6) - `America/Mexico_City`
- **Los Ángeles** (UTC-8/-7) - `America/Los_Angeles`
- **Madrid** (UTC+1/+2) - `Europe/Madrid`
- **Londres** (UTC+0/+1) - `Europe/London`

## 🎯 Uso por Línea de Comandos

### Modo de Prueba (Ejecutar Inmediatamente)
```bash
node scripts/email-notifications.js --now
```

### Modo Programado (Cron Job)
```bash
node scripts/email-notifications.js --cron
```

### Mostrar Ayuda
```bash
node scripts/email-notifications.js --help
```

## ⚙️ Configuración en Servidor

### 1. Usando Cron del Sistema (Recomendado)
Editar crontab:
```bash
crontab -e
```

Agregar línea para ejecutar a las 6:00 PM diariamente:
```bash
0 18 * * * cd /ruta/al/proyecto && node scripts/email-notifications.js --now >> /var/log/email-notifications.log 2>&1
```

### 2. Usando PM2 (Proceso Persistente)
```bash
# Instalar PM2
npm install -g pm2

# Ejecutar en modo cron
pm2 start scripts/email-notifications.js --name "email-notifications" -- --cron

# Ver logs
pm2 logs email-notifications

# Configurar para reiniciar en boot
pm2 startup
pm2 save
```

### 3. Usando Systemd (Linux)
Crear archivo `/etc/systemd/system/email-notifications.service`:

```ini
[Unit]
Description=Email Notifications Service
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/al/proyecto
ExecStart=/usr/bin/node scripts/email-notifications.js --cron
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activar servicio:
```bash
sudo systemctl enable email-notifications
sudo systemctl start email-notifications
sudo systemctl status email-notifications
```

## 📊 Funcionalidades del Email

### Contenido Incluido
- **Saludo personalizado** con nombre del miembro
- **Resumen estadístico**: Número total de citas programadas
- **Tabla detallada** con:
  - Horarios de inicio y fin
  - Nombres de clientes
  - Servicios programados
  - Teléfonos de contacto
  - Estado de la cita (Confirmada o Programada)
- **Consejos útiles** para el día
- **Diseño responsive** para móviles y desktop

### Lógica de Envío
- **Se envían emails a TODOS los miembros activos** (con o sin citas)
- **Miembros con citas**: Reciben email con tabla detallada de sus citas
- **Miembros sin citas**: Reciben email informativo de "día libre"
- Se agrupan todas las citas del miembro en un solo email
- Se incluyen citas con status 'programada' y 'confirmada'
- Se muestra claramente el estado de cada cita en el email
- **Ejecuta TODOS LOS DÍAS** (incluye fines de semana) a las 6:00 PM

## 🔧 Personalización

### Modificar Horario de Envío
Editar la expresión cron en `email-notifications.js`:
```javascript
// Actual: 6:00 PM TODOS LOS DÍAS (incluye fines de semana)
cron.schedule('0 18 * * *', ...)

// Ejemplos:
// 8:00 AM: '0 8 * * *'
// 12:00 PM: '0 12 * * *'
// Solo días laborales: '0 18 * * 1-5'
// Solo fines de semana: '0 18 * * 6,0'
```

### Personalizar Template
Modificar la función `generateEmailTemplate()` para:
- Cambiar colores y estilos
- Agregar o quitar secciones
- Modificar el contenido de los consejos
- Incluir logo de la empresa

### Filtros de Citas
Modificar `getTomorrowAppointments()` para:
- Incluir diferentes estados de citas
- Filtrar por servicios específicos
- Agregar criterios adicionales

## 📝 Logs y Monitoreo

### Logs del Sistema
El script genera logs detallados:
```
🚀 Iniciando envío de notificaciones diarias
🏢 Encontradas 3 organizaciones
📅 Buscando citas para 2024-01-15
✅ Encontradas 5 citas confirmadas
👥 Enviando notificaciones a 2 miembros
📧 Enviando email a Juan Pérez con 3 citas
✅ Email enviado exitosamente
📊 RESUMEN FINAL: 2 enviados, 0 omitidos, 0 errores
```

### Monitoreo Recomendado
- Configurar alertas para errores críticos
- Revisar logs diariamente
- Monitorear límites de Resend API
- Verificar entregabilidad de emails

## ⚠️ Consideraciones Importantes

### Límites de Resend
- Plan gratuito: 100 emails/día, 3,000/mes
- Verificar límites según tu plan
- Implementar rate limiting si es necesario

### Seguridad
- Mantener `SUPABASE_SERVICE_ROLE_KEY` segura
- No exponer `RESEND_API_KEY` en el frontend
- Usar variables de entorno en producción

### Rendimiento
- El script incluye pausas entre envíos (1 segundo)
- Pausa entre organizaciones (2 segundos)
- Ajustar según necesidades y límites de API

## 🆘 Solución de Problemas

### Error: "RESEND_API_KEY no está configurada"
- Verificar archivo `.env`
- Confirmar que la variable está definida
- Reiniciar el proceso

### Error: "Variables de Supabase no están configuradas"
- Verificar `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Confirmar permisos del Service Role Key

### Emails no se envían
- Verificar configuración de dominio en Resend
- Revisar límites de API
- Confirmar que hay citas confirmadas para mañana

### Cron job no ejecuta
- Verificar sintaxis de crontab
- Confirmar permisos de usuario
- Revisar logs del sistema (`/var/log/cron`)

## 🔄 Actualizaciones Futuras

### Funcionalidades Planeadas
- [ ] Notificaciones por SMS (Twilio)
- [ ] Templates personalizables por organización
- [ ] Dashboard de estadísticas de envío
- [ ] Recordatorios a clientes
- [ ] Integración con calendario

### Mejoras Técnicas
- [ ] Tests automatizados
- [ ] Métricas de entregabilidad
- [ ] Retry automático en fallos
- [ ] Configuración vía interfaz web 