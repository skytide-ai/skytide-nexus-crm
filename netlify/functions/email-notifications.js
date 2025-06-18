import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Variables de entorno
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@updates.skytidecrm.com';

// Inicializar clientes
let resend = null;
let supabase = null;

function initializeClients() {
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
}

/**
 * Función principal de Netlify Scheduled Function
 * Se ejecuta cada minuto según configuración en netlify.toml
 */
export default async (req) => {
  console.log('🔄 [Netlify] Verificando notificaciones de email...');
  
  try {
    // Parsear el body de la request (contiene next_run)
    const { next_run } = await req.json();
    console.log('📅 Próxima ejecución programada:', next_run);

    // Validar configuración
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Variables de entorno faltantes');
    }

    // Inicializar clientes
    initializeClients();

    // Obtener configuraciones de organizaciones activas
    const { data: configs, error: configError } = await supabase
      .from('email_notifications_config')
      .select(`
        organization_id,
        send_time,
        timezone,
        organizations (
          name
        )
      `)
      .eq('is_enabled', true);

    if (configError) {
      throw new Error(`Error al obtener configuraciones: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('ℹ️ No hay organizaciones con notificaciones habilitadas');
      return new Response(JSON.stringify({ 
        message: 'No organizations with notifications enabled',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    let processedOrgs = 0;
    let emailsSent = 0;

    // Verificar cada organización
    for (const config of configs) {
      const shouldSend = await shouldSendNotificationNow(config, now);
      
      if (shouldSend) {
        console.log(`📧 Enviando notificaciones para: ${config.organizations.name}`);
        const sent = await processOrganizationNotifications(
          config.organization_id, 
          config.organizations.name
        );
        emailsSent += sent;
        processedOrgs++;
      }
    }

    const result = {
      timestamp: now.toISOString(),
      organizationsProcessed: processedOrgs,
      emailsSent: emailsSent,
      totalConfigsChecked: configs.length,
      nextRun: next_run
    };

    console.log('✅ [Netlify] Verificación completada:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [Netlify] Error en función programada:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Determina si debe enviar notificación ahora según configuración
 */
async function shouldSendNotificationNow(config, currentTime) {
  try {
    // Convertir hora actual a zona horaria de la organización
    const orgTime = new Date(currentTime.toLocaleString("en-US", {
      timeZone: config.timezone
    }));
    
    // Obtener hora y minuto actual
    const currentHour = orgTime.getHours();
    const currentMinute = orgTime.getMinutes();
    
    // Parsear hora configurada (formato HH:MM:SS)
    const [targetHour, targetMinute] = config.send_time.split(':').map(Number);
    
    // Verificar si es exactamente la hora configurada
    const isTargetTime = currentHour === targetHour && currentMinute === targetMinute;
    
    console.log(`🕐 Org ${config.organization_id}: ${currentHour}:${currentMinute.toString().padStart(2, '0')} vs ${targetHour}:${targetMinute.toString().padStart(2, '0')} (${config.timezone}) - ${isTargetTime ? 'ENVIAR' : 'ESPERAR'}`);
    
    return isTargetTime;
    
  } catch (error) {
    console.error(`❌ Error verificando tiempo para org ${config.organization_id}:`, error);
    return false;
  }
}

/**
 * Procesa notificaciones para una organización
 */
async function processOrganizationNotifications(organizationId, organizationName) {
  try {
    // Obtener miembros activos
    const members = await getOrganizationMembers(organizationId);
    
    if (members.length === 0) {
      console.log(`⚠️ No hay miembros activos en: ${organizationName}`);
      return 0;
    }

    // Obtener citas del día siguiente
    const appointments = await getTomorrowAppointments(organizationId);
    console.log(`📅 ${appointments.length} citas encontradas para mañana en ${organizationName}`);

    // Agrupar citas por miembro
    const memberAppointments = groupAppointmentsByMember(appointments);

    let emailsSent = 0;

    // Enviar email a cada miembro
    for (const member of members) {
      const memberData = {
        email: member.email,
        name: `${member.first_name} ${member.last_name}`,
        appointments: memberAppointments[member.id]?.appointments || []
      };

      const success = await sendMemberEmail(memberData, organizationName);
      if (success) emailsSent++;
    }

    console.log(`✅ ${organizationName}: ${emailsSent} emails enviados`);
    return emailsSent;

  } catch (error) {
    console.error(`❌ Error procesando ${organizationId}:`, error);
    return 0;
  }
}

/**
 * Obtiene miembros activos de una organización
 */
async function getOrganizationMembers(organizationId) {
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .eq('organization_id', organizationId)
    .eq('role', 'member')
    .not('email', 'is', null);

  if (error) {
    console.error('❌ Error obteniendo miembros:', error);
    return [];
  }

  return members || [];
}

/**
 * Obtiene citas del día siguiente
 */
async function getTomorrowAppointments(organizationId) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      end_time,
      status,
      notes,
      contact_id,
      service_id,
      member_id,
      contacts (
        first_name,
        last_name,
        phone,
        email
      ),
      services (
        name,
        duration_minutes
      ),
      member:profiles!member_id (
        first_name,
        last_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .eq('appointment_date', tomorrowStr)
    .in('status', ['confirmada', 'programada'])
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error obteniendo citas:', error);
    return [];
  }

  return appointments || [];
}

/**
 * Agrupa citas por miembro
 */
function groupAppointmentsByMember(appointments) {
  const memberAppointments = {};

  appointments.forEach(appointment => {
    const memberId = appointment.member_id;
    const memberEmail = appointment.member?.email;
    const memberName = `${appointment.member?.first_name} ${appointment.member?.last_name}`;

    if (!memberId || !memberEmail) {
      console.warn('⚠️ Cita sin miembro asignado:', appointment.id);
      return;
    }

    if (!memberAppointments[memberId]) {
      memberAppointments[memberId] = {
        email: memberEmail,
        name: memberName,
        appointments: []
      };
    }

    memberAppointments[memberId].appointments.push(appointment);
  });

  return memberAppointments;
}

/**
 * Envía email a un miembro
 */
async function sendMemberEmail(memberData, organizationName) {
  try {
    const { email, name, appointments } = memberData;

    // Generar template según si tiene citas o no
    const htmlContent = appointments.length > 0 
      ? generateEmailTemplate(name, appointments, organizationName)
      : generateNoAppointmentsTemplate(name, organizationName);

    const subject = appointments.length > 0
      ? `📅 Tienes ${appointments.length} cita${appointments.length > 1 ? 's' : ''} programada${appointments.length > 1 ? 's' : ''} para mañana`
      : `📅 No tienes citas programadas para mañana`;

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`❌ Error enviando email a ${email}:`, error);
      return false;
    }

    console.log(`✅ Email enviado a ${name} (${email}) - ID: ${data.id}`);
    return true;

  } catch (error) {
    console.error(`❌ Error en sendMemberEmail:`, error);
    return false;
  }
}

/**
 * Template para miembros con citas
 */
function generateEmailTemplate(memberName, appointments, organizationName) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const appointmentRows = appointments.map(apt => {
    const startTime = new Date(`1970-01-01T${apt.start_time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(`1970-01-01T${apt.end_time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const clientName = `${apt.contacts.first_name} ${apt.contacts.last_name}`;
    const serviceName = apt.services?.name || 'Servicio no especificado';
    const clientPhone = apt.contacts.phone || 'No disponible';
    const status = apt.status === 'confirmada' ? '✅ Confirmada' : '📅 Programada';

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px 8px; font-weight: 500; color: #1f2937;">${startTime} - ${endTime}</td>
        <td style="padding: 16px 8px; color: #374151;">${clientName}</td>
        <td style="padding: 16px 8px; color: #374151;">${serviceName}</td>
        <td style="padding: 16px 8px; color: #6b7280; font-size: 14px;">${clientPhone}</td>
        <td style="padding: 16px 8px; font-weight: 500;">${status}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Citas del día - ${tomorrowFormatted}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${organizationName}</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Resumen de citas programadas</p>
      </div>

      <!-- Greeting -->
      <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">¡Hola ${memberName}! 👋</h2>
        <p style="color: #4b5563; margin: 0; font-size: 16px;">
          Aquí tienes el resumen de tus citas programadas para <strong>${tomorrowFormatted}</strong>.
        </p>
      </div>

      <!-- Summary Stats -->
      <div style="margin-bottom: 32px;">
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size: 48px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">${appointments.length}</div>
          <div style="color: #6b7280; font-size: 18px;">Cita${appointments.length > 1 ? 's' : ''} programada${appointments.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Appointments Table -->
      <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 32px;">
        <div style="background: #f8fafc; padding: 16px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">📅 Detalle de citas</h3>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Horario</th>
              <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Cliente</th>
              <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Servicio</th>
              <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Teléfono</th>
              <th style="padding: 16px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${appointmentRows}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
          Este es un recordatorio automático enviado por ${organizationName}
        </p>
        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
          Powered by Skytide CRM • Enviado desde Netlify Functions
        </p>
      </div>

    </body>
    </html>
  `;
}

/**
 * Template para miembros sin citas
 */
function generateNoAppointmentsTemplate(memberName, organizationName) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sin citas programadas - ${tomorrowFormatted}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${organizationName}</h1>
        <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">Resumen diario</p>
      </div>

      <!-- Greeting -->
      <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">¡Hola ${memberName}! 👋</h2>
        <p style="color: #4b5563; margin: 0; font-size: 16px;">
          Te informamos sobre tu agenda para <strong>${tomorrowFormatted}</strong>.
        </p>
      </div>

      <!-- No Appointments -->
      <div style="background: white; padding: 32px; border-radius: 8px; text-align: center; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size: 64px; margin-bottom: 16px;">🌟</div>
        <h3 style="color: #10b981; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">¡Día libre!</h3>
        <p style="color: #6b7280; margin: 0; font-size: 16px;">
          No tienes citas programadas para mañana. Es un buen momento para:
        </p>
      </div>

      <!-- Suggestions -->
      <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h4 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">💡 Sugerencias para tu día libre:</h4>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">📚 Actualizar conocimientos o capacitarte</li>
          <li style="margin-bottom: 8px;">📞 Contactar clientes potenciales</li>
          <li style="margin-bottom: 8px;">🔧 Organizar tu espacio de trabajo</li>
          <li style="margin-bottom: 8px;">📊 Revisar métricas y objetivos</li>
          <li style="margin-bottom: 8px;">🤝 Planificar estrategias de seguimiento</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
          Recordatorio automático de ${organizationName}
        </p>
        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
          Powered by Skytide CRM • Enviado desde Netlify Functions
        </p>
      </div>

    </body>
    </html>
  `;
} 