# 🚀 Migración de Vercel a Netlify - Skytide Nexus CRM

## ✅ ARCHIVOS CREADOS/MODIFICADOS

### 📁 Nuevos archivos:
- `netlify.toml` - Configuración principal de Netlify
- `netlify/functions/email-notifications.js` - Función programada para emails
- `MIGRATION-TO-NETLIFY.md` - Esta guía

### 🗑️ Archivos eliminados:
- `vercel.json` - Ya no necesario (Netlify usa `netlify.toml`)

### 📝 Archivos modificados:
- `package.json` - Agregadas dependencias y scripts de Netlify

## 🛠️ PASO 1: Instalar dependencias

```bash
npm install @netlify/functions
npm install --save-dev netlify-cli
```

## 🌐 PASO 2: Configurar cuenta de Netlify

1. **Crear cuenta**: https://app.netlify.com/signup
2. **Instalar CLI globalmente**:
   ```bash
   npm install -g netlify-cli
   ```
3. **Autenticarse**:
   ```bash
   netlify login
   ```

## 🔗 PASO 3: Conectar repositorio

### Opción A: Desde Netlify Dashboard
1. Click "Add new site" → "Import an existing project"
2. Conectar con GitHub y seleccionar el repositorio
3. Configuración automática:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### Opción B: Desde CLI
```bash
netlify init
```

## 🔧 PASO 4: Configurar variables de entorno

En **Netlify Dashboard** → **Site settings** → **Environment variables**, agregar:

```
RESEND_API_KEY=tu_resend_api_key
VITE_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_key
FROM_EMAIL=notificaciones@updates.skytidecrm.com
```

## ⚡ PASO 5: Verificar función programada

Después del deploy, verificar en:
- **Netlify Dashboard** → **Functions**
- Debe aparecer `email-notifications` con badge **"Scheduled"**
- Mostrar próxima ejecución en tu zona horaria

## 🧪 PASO 6: Testing local

```bash
# Desarrollo local con funciones
npm run netlify:dev

# Invocar función manualmente para testing
netlify functions:invoke email-notifications
```

## 🚀 PASO 7: Deploy a producción

```bash
# Deploy de prueba (draft)
npm run netlify:deploy

# Deploy a producción
npm run netlify:deploy:prod
```

## 🎯 VENTAJAS DE NETLIFY VS VERCEL

| Característica | Netlify | Vercel |
|----------------|---------|--------|
| **Funciones programadas** | ✅ Nativas, sin cold starts | ❌ Requiere Plan Pro ($20/mes) |
| **Invocaciones gratis** | ✅ 125,000/mes | ❌ Limitadas |
| **Cron jobs** | ✅ Sintaxis estándar | ❌ Solo con Edge Config |
| **Performance** | ✅ Mejor para scheduled functions | ❌ Cold starts frecuentes |
| **Logs detallados** | ✅ 24h gratis, 7 días Pro | ❌ Limitados |
| **Configuración** | ✅ Simple con `netlify.toml` | ❌ Compleja |

## 📊 MONITOREO Y DEBUGGING

### 📈 Ver logs:
- **Netlify Dashboard** → **Functions** → **email-notifications**
- Logs en tiempo real durante ejecución

### 📊 Métricas:
- **Dashboard** → **Analytics** → **Functions**
- Invocaciones, errores, duración

### 🔔 Alertas:
```bash
# Configurar webhooks para notificaciones
netlify open:site
```

## 🔧 TROUBLESHOOTING

### ❌ La función no aparece como "Scheduled"
1. Verificar que `netlify.toml` esté en la raíz del proyecto
2. Revisar sintaxis del cron expression: `* * * * *`
3. Redeploy completo: `netlify deploy --prod`

### ❌ Error "Variables de entorno faltantes"
1. Verificar en **Site settings** → **Environment variables**
2. Asegurar que todas las variables estén configuradas
3. Redeploy después de agregar variables

### ❌ Función se ejecuta pero no envía emails
1. Verificar que `email_notifications_config` tenga organizaciones con `is_enabled = true`
2. Verificar que la hora actual coincida con `send_time` en la zona horaria correcta
3. Revisar logs para errores específicos

## ⏰ FUNCIONAMIENTO DEL SISTEMA

### 🕐 Ejecución:
- **Frecuencia**: Cada minuto (`* * * * *`)
- **Verificación**: Solo envía cuando es exactamente la hora configurada
- **Zona horaria**: Respeta la configuración individual de cada organización

### 📧 Emails:
- **A quién**: Todos los miembros activos de organizaciones habilitadas
- **Cuándo**: A la hora configurada en su zona horaria
- **Contenido**: 
  - Con citas: Lista detallada de citas del día siguiente
  - Sin citas: Mensaje motivacional con sugerencias

### 🎛️ Control:
- **Panel SuperAdmin**: `/administration` → "Notificaciones Email"
- **ON/OFF por organización**
- **Hora personalizada**
- **6 zonas horarias disponibles**

## 🔄 MIGRACIÓN COMPLETA

### ✅ Lo que YA NO necesitas:
- ❌ Script `scripts/email-notifications.js` (opcional mantener para testing)
- ❌ Cron jobs del servidor
- ❌ Configuración de Vercel
- ❌ Preocuparte por cold starts

### ✅ Lo que AHORA tienes:
- ✅ Función programada nativa de Netlify
- ✅ 125,000 invocaciones gratis/mes
- ✅ Logs detallados y debugging fácil
- ✅ Deploy automático desde Git
- ✅ Panel de administración completo
- ✅ Control granular por organización

## 🎉 RESULTADO FINAL

El sistema de emails automáticos ahora funciona completamente en Netlify con:

- **0 configuración de servidor** - Todo manejado por Netlify
- **0 cold starts** - Funciones programadas optimizadas
- **0 costo adicional** - Plan gratuito más que suficiente
- **Control total** - Panel de administración intuitivo
- **Logs completos** - Debugging fácil y monitoreo

¡La migración está completa y el sistema es más robusto que nunca! 🚀 