#!/usr/bin/env node

/**
 * Sistema de Notificaciones Automáticas por Email
 * Envía emails diarios a las 6:00 PM con las citas del día siguiente
 * 
 * Uso:
 * - Ejecutar manualmente: node scripts/email-notifications.js
 * - Programar con cron: 0 18 * * * /usr/bin/node /path/to/scripts/email-notifications.js
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

// Cargar variables de entorno
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@updates.skytidecrm.com';
const ORGANIZATION_NAME = process.env.ORGANIZATION_NAME || 'Skytide Agency';

// Función para validar configuración
function validateConfig() {
  if (!RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY no está configurada');
    return false;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Variables de Supabase no están configuradas');
    return false;
  }
  
  return true;
}

// Variables para clientes (se inicializan cuando se necesiten)
let resend = null;
let supabase = null;

// Función para inicializar clientes
function initializeClients() {
  if (!resend) {
    resend = new Resend(RESEND_API_KEY);
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
}

/**
 * Obtiene las citas del día siguiente para una organización específica
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
    console.error('❌ Error al obtener citas:', error);
    return [];
  }

  return appointments || [];
}

/**
 * Agrupa las citas por miembro
 */
function groupAppointmentsByMember(appointments) {
  const memberAppointments = {};

  appointments.forEach(appointment => {
    const memberId = appointment.member_id;
    const memberEmail = appointment.member?.email;
    const memberName = `${appointment.member?.first_name} ${appointment.member?.last_name}`;

    if (!memberId || !memberEmail) {
      console.warn('⚠️ Cita sin miembro asignado o email:', appointment.id);
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
 * Genera el template HTML del email
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
          <div style="font-size: 32px; font-weight: 700; color: #3b82f6; margin-bottom: 4px;">${appointments.length}</div>
          <div style="color: #6b7280; font-size: 14px; font-weight: 500;">Citas programadas para mañana</div>
        </div>
      </div>

      <!-- Appointments Table -->
      <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 32px;">
        <div style="background: #f8fafc; padding: 16px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">📅 Agenda del día</h3>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Horario</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Cliente</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Servicio</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Teléfono</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${appointmentRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tips Section -->
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">💡 Consejos para el día</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Revisa los datos de tus clientes antes de cada cita</li>
          <li>Prepara los materiales necesarios para cada servicio</li>
          <li>Mantén un margen de tiempo entre citas para imprevistos</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 8px; margin-top: 32px;">
        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
          Este email fue enviado automáticamente por SkytideCRM
        </p>
        <p style="color: #9ca3af; margin: 0 0 16px 0; font-size: 12px;">
          Si tienes alguna pregunta, contacta al administrador del sistema
        </p>
        <img src="https://fyyzaysmpephomhmudxt.supabase.co/storage/v1/object/public/skytide-media/LogoSkytide.png" alt="Skytide" style="height: 32px; width: auto; opacity: 0.7;">
      </div>

    </body>
    </html>
  `;
}

/**
 * Genera template para miembros sin citas
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
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${organizationName}</h1>
        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Resumen diario de agenda</p>
      </div>

      <!-- Greeting -->
      <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">¡Hola ${memberName}! 👋</h2>
        <p style="color: #4b5563; margin: 0; font-size: 16px;">
          Te informamos sobre tu agenda para <strong>${tomorrowFormatted}</strong>.
        </p>
      </div>

      <!-- No Appointments Message -->
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">😌</div>
        <h3 style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">¡Día libre!</h3>
        <p style="color: #0369a1; margin: 0; font-size: 16px;">
          No tienes citas agendadas para el día de mañana. Aprovecha este tiempo para descansar o realizar otras actividades.
        </p>
      </div>

      <!-- Tips Section -->
      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h4 style="color: #166534; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">💡 Aprovecha tu día libre</h4>
        <ul style="color: #166534; margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Revisa tu agenda de los próximos días</li>
          <li>Organiza tu espacio de trabajo</li>
          <li>Actualiza tus conocimientos profesionales</li>
          <li>Disfruta de un merecido descanso</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 8px; margin-top: 32px;">
        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
          Este email fue enviado automáticamente por SkytideCRM
        </p>
        <p style="color: #9ca3af; margin: 0 0 16px 0; font-size: 12px;">
          Si tienes alguna pregunta, contacta al administrador del sistema
        </p>
        <img src="https://fyyzaysmpephomhmudxt.supabase.co/storage/v1/object/public/skytide-media/LogoSkytide.png" alt="Skytide" style="height: 32px; width: auto; opacity: 0.7;">
      </div>

    </body>
    </html>
  `;
}

/**
 * Envía un email a un miembro con sus citas del día siguiente (o sin citas)
 */
async function sendMemberEmail(memberData, organizationName) {
  const { email, name, appointments } = memberData;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const hasAppointments = appointments.length > 0;
  const appointmentText = hasAppointments ? `${appointments.length} citas` : 'sin citas';
  
  console.log(`📧 Enviando email a ${name} (${email}) - ${appointmentText}`);

  try {
    const emailHtml = hasAppointments 
      ? generateEmailTemplate(name, appointments, organizationName)
      : generateNoAppointmentsTemplate(name, organizationName);
    
    const subject = hasAppointments 
      ? `📅 Tus citas del ${tomorrowFormatted} - ${organizationName}`
      : `😌 Agenda del ${tomorrowFormatted} - ${organizationName}`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error(`❌ Error al enviar email a ${name}:`, error);
      return { success: false, error };
    }

    console.log(`✅ Email enviado exitosamente a ${name} (ID: ${data.id})`);
    return { success: true, data };

  } catch (error) {
    console.error(`❌ Error inesperado al enviar email a ${name}:`, error);
    return { success: false, error };
  }
}

/**
 * Obtiene todos los miembros activos de una organización
 */
async function getOrganizationMembers(organizationId) {
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .not('email', 'is', null);

  if (error) {
    console.error('❌ Error al obtener miembros:', error);
    return [];
  }

  return members || [];
}

/**
 * Procesa las notificaciones para una organización
 */
async function processOrganizationNotifications(organizationId, organizationName) {
  console.log(`\n🏢 Procesando organización: ${organizationName} (${organizationId})`);
  
  try {
    // Obtener citas del día siguiente
    const appointments = await getTomorrowAppointments(organizationId);
    console.log(`📅 Encontradas ${appointments.length} citas para mañana`);
    
    // Obtener todos los miembros activos
    const allMembers = await getOrganizationMembers(organizationId);
    console.log(`👥 Encontrados ${allMembers.length} miembros activos`);
    
    if (allMembers.length === 0) {
      console.log('👥 No hay miembros activos en esta organización');
      return { success: true, processed: 0, skipped: 0, errors: 0 };
    }

    // Agrupar citas por miembro
    const memberAppointments = groupAppointmentsByMember(appointments);
    
    const results = {
      processed: 0,
      skipped: 0,
      errors: 0
    };

    // Enviar email a cada miembro (con o sin citas)
    for (const member of allMembers) {
      const memberData = {
        email: member.email,
        name: `${member.first_name} ${member.last_name}`,
        appointments: memberAppointments[member.id]?.appointments || []
      };
      
      const result = await sendMemberEmail(memberData, organizationName);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.processed++;
        }
      } else {
        results.errors++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Organización procesada: ${results.processed} enviados, ${results.skipped} omitidos, ${results.errors} errores`);
    return { success: true, ...results };

  } catch (error) {
    console.error(`❌ Error al procesar organización ${organizationName}:`, error);
    return { success: false, error, processed: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Función principal que procesa todas las organizaciones
 */
async function sendDailyNotifications() {
  const startTime = new Date();
  console.log(`\n🚀 Iniciando envío de notificaciones diarias - ${startTime.toLocaleString('es-ES')}`);
  console.log('='.repeat(80));

  // Inicializar clientes
  initializeClients();

  try {
    // Obtener organizaciones con sus configuraciones de email
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id, 
        name,
        email_config:email_notifications_config (
          is_enabled,
          send_time,
          timezone
        )
      `);

    if (error) {
      console.error('❌ Error al obtener organizaciones:', error);
      return;
    }

    if (!organizations || organizations.length === 0) {
      console.log('🏢 No se encontraron organizaciones');
      return;
    }

    // Filtrar solo organizaciones con notificaciones habilitadas
    const enabledOrganizations = organizations.filter(org => {
      const config = org.email_config;
      return config?.is_enabled !== false; // true por defecto si no hay config
    });

    console.log(`🏢 Encontradas ${organizations.length} organizaciones (${enabledOrganizations.length} con notificaciones habilitadas)`);

    const globalStats = {
      totalOrganizations: organizations.length,
      enabledOrganizations: enabledOrganizations.length,
      processedOrganizations: 0,
      totalEmailsSent: 0,
      totalEmailsSkipped: 0,
      totalErrors: 0
    };

    for (const org of enabledOrganizations) {
      const config = org.email_config;
      const timezone = config?.timezone || 'America/Bogota';
      
      console.log(`⚙️ Configuración para ${org.name}: Zona horaria ${timezone}`);
      
      const result = await processOrganizationNotifications(org.id, org.name);
      
      if (result.success) {
        globalStats.processedOrganizations++;
        globalStats.totalEmailsSent += result.processed;
        globalStats.totalEmailsSkipped += result.skipped;
        globalStats.totalErrors += result.errors;
      } else {
        globalStats.totalErrors++;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL DE NOTIFICACIONES');
    console.log('='.repeat(80));
    console.log(`⏱️  Duración total: ${duration} segundos`);
    console.log(`🏢 Organizaciones totales: ${globalStats.totalOrganizations}`);
    console.log(`✅ Organizaciones habilitadas: ${globalStats.enabledOrganizations}`);
    console.log(`🔄 Organizaciones procesadas: ${globalStats.processedOrganizations}`);
    console.log(`📧 Emails enviados: ${globalStats.totalEmailsSent}`);
    console.log(`⏭️  Emails omitidos: ${globalStats.totalEmailsSkipped}`);
    console.log(`❌ Errores: ${globalStats.totalErrors}`);
    console.log(`✅ Proceso completado: ${endTime.toLocaleString('es-ES')}`);

  } catch (error) {
    console.error('❌ Error crítico en el proceso:', error);
  }
}

/**
 * Función que verifica y envía notificaciones según la hora de cada organización
 */
async function checkAndSendNotifications() {
  console.log('\n🔔 Verificando organizaciones que requieren envío de notificaciones...');
  
  // Inicializar clientes
  initializeClients();

  try {
    // Obtener organizaciones con configuraciones habilitadas
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select(`
        id, 
        name,
        email_config:email_notifications_config!inner (
          is_enabled,
          send_time,
          timezone
        )
      `)
      .eq('email_config.is_enabled', true);

    if (error) {
      console.error('❌ Error al obtener organizaciones:', error);
      return;
    }

    if (!organizations || organizations.length === 0) {
      console.log('📭 No hay organizaciones con notificaciones habilitadas');
      return;
    }

    let organizationsToProcess = [];

    // Verificar cada organización si es hora de enviar
    for (const org of organizations) {
      const config = org.email_config;
      const timezone = config.timezone || 'America/Bogota';
      const sendTime = config.send_time || '18:00:00';
      
      // Obtener la hora actual en la zona horaria de la organización
      const now = new Date();
      const currentTimeInOrgTimezone = now.toLocaleString('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const [sendHour, sendMinute] = sendTime.split(':');
      const targetTime = `${sendHour}:${sendMinute}`;
      
      console.log(`🕐 ${org.name}: Hora actual ${currentTimeInOrgTimezone} (${timezone}), hora objetivo ${targetTime}`);
      
      if (currentTimeInOrgTimezone === targetTime) {
        organizationsToProcess.push(org);
        console.log(`✅ ${org.name}: Es hora de enviar notificaciones`);
      }
    }

    if (organizationsToProcess.length === 0) {
      console.log('⏰ No hay organizaciones que requieran envío en este momento');
      return;
    }

    console.log(`🚀 Procesando ${organizationsToProcess.length} organizaciones:`);
    
    const globalStats = {
      totalEmailsSent: 0,
      totalErrors: 0
    };

    // Procesar solo las organizaciones que necesitan envío
    for (const org of organizationsToProcess) {
      console.log(`\n📤 Enviando notificaciones para: ${org.name}`);
      const result = await processOrganizationNotifications(org.id, org.name);
      
      if (result.success) {
        globalStats.totalEmailsSent += result.processed;
      } else {
        globalStats.totalErrors++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Resumen del envío: ${globalStats.totalEmailsSent} emails enviados, ${globalStats.totalErrors} errores`);

  } catch (error) {
    console.error('❌ Error crítico en verificación de notificaciones:', error);
  }
}

/**
 * Configuración del cron job
 */
function setupCronJob() {
  console.log('⏰ Configurando cron job para verificar notificaciones cada minuto...');
  
  // Inicializar clientes
  initializeClients();
  
  // Verificar cada minuto si alguna organización necesita envío
  cron.schedule('* * * * *', () => {
    checkAndSendNotifications();
  }, {
    scheduled: true,
    timezone: "UTC" // Usar UTC para el cron, las zonas horarias se manejan internamente
  });

  // Opcional: Verificar cada 5 minutos para reducir carga (menos preciso)
  // cron.schedule('*/5 * * * *', () => {
  //   checkAndSendNotifications();
  // }, {
  //   scheduled: true,
  //   timezone: "UTC"
  // });

  console.log('✅ Cron job configurado exitosamente');
  console.log('📅 Se verificará CADA MINUTO si hay organizaciones que requieren envío');
  console.log('🌍 Cada organización respeta su zona horaria y hora configurada');
}

/**
 * Función para ejecutar inmediatamente (modo de prueba)
 */
function runImmediately() {
  console.log('🧪 Ejecutando en modo de prueba inmediata...');
  sendDailyNotifications();
}

// Punto de entrada principal
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
📧 Sistema de Notificaciones Automáticas por Email
================================================

Uso:
  node scripts/email-notifications.js [opciones]

Opciones:
  --now, -n     Ejecutar inmediatamente (modo de prueba)
  --cron, -c    Ejecutar en modo cron (programado diariamente)
  --help, -h    Mostrar esta ayuda

Ejemplos:
  node scripts/email-notifications.js --now     # Ejecutar ahora
  node scripts/email-notifications.js --cron    # Modo programado

Configuración requerida (.env):
  RESEND_API_KEY=tu_api_key_de_resend
  VITE_SUPABASE_URL=tu_url_de_supabase
  SUPABASE_SERVICE_ROLE_KEY=tu_service_key
  FROM_EMAIL=notificaciones@updates.skytidecrm.com (opcional)
  ORGANIZATION_NAME=Nombre de tu organización (opcional)
`);
} else if (args.includes('--now') || args.includes('-n')) {
  if (!validateConfig()) process.exit(1);
  runImmediately();
} else if (args.includes('--cron') || args.includes('-c')) {
  if (!validateConfig()) process.exit(1);
  setupCronJob();
  console.log('🔄 Proceso en ejecución. Presiona Ctrl+C para detener.');
}

export { sendDailyNotifications, setupCronJob }; 