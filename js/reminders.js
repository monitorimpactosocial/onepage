/* reminders.js · Sistema de recordatorios el día 25 de cada mes */

const Reminders = (() => {

  const REMINDER_KEY = 'paracel_reminder_sent';

  // ── Verificar si hoy es día 25 y si ya se envió el recordatorio ──
  function checkAndTrigger() {
    if (!Auth.isAdmin()) return;

    const today = new Date();
    const day   = today.getDate();
    const month = today.getMonth();
    const year  = today.getFullYear();
    const sentKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    const sent = localStorage.getItem(REMINDER_KEY);

    if (day === 25 && sent !== sentKey) {
      // Mostrar notificación al admin
      setTimeout(() => {
        App.showToast('Hoy es día 25 · ¿Enviar recordatorio mensual?', 'warn');
        showReminderPrompt(sentKey);
      }, 2000);
    }
  }

  function showReminderPrompt(sentKey) {
    // Crear banner en la UI
    const banner = document.createElement('div');
    banner.id = 'reminderBanner';
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      background: #e67e22; color: white;
      padding: 12px 24px; display: flex; align-items: center; justify-content: space-between;
      font-size: 14px; font-family: var(--font-sans); font-weight: 600;
      box-shadow: 0 2px 12px rgba(0,0,0,.2);
    `;
    banner.innerHTML = `
      <span>📧 Hoy es día 25 – Es momento de enviar el recordatorio mensual a las áreas.</span>
      <div style="display:flex;gap:10px;">
        <button onclick="Reminders.sendNow()" style="background:white;color:#e67e22;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;font-weight:700;">
          Enviar ahora
        </button>
        <button onclick="document.getElementById('reminderBanner').remove()" style="background:rgba(255,255,255,.2);color:white;border:none;border-radius:6px;padding:7px 14px;cursor:pointer;">
          Posponer
        </button>
      </div>`;
    document.body.prepend(banner);
  }

  // ── Enviar recordatorio a todas las áreas ────────────────────────
  async function sendNow() {
    const subject = document.getElementById('emailSubject')?.value
      || `📊 Recordatorio – Carga de datos mensuales PARACEL`;
    const body = document.getElementById('emailBody')?.value
      || getDefaultBody();

    const today = new Date();
    const sentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Collect checked recipients
    const recipients = [];
    Object.values(AREAS).forEach(area => {
      const checkbox = document.querySelector(`input[name="email_include_${area.id}"]`);
      if (!checkbox || checkbox.checked) {
        recipients.push({ name: area.punto_focal, email: area.email, area: area.name });
      }
    });

    // Remove duplicates by email
    const unique = [...new Map(recipients.map(r => [r.email, r])).values()];

    App.showToast(`Enviando ${unique.length} correos...`, 'warn');

    let sent = 0;
    let failed = 0;

    for (const recipient of unique) {
      const personalBody = body
        .replace('{{NOMBRE}}', recipient.name)
        .replace('{{AREA}}', recipient.area);

      const result = await Graph.sendEmail({
        to: recipient.email,
        subject,
        body: personalBody,
      });

      if (result.success) sent++;
      else {
        failed++;
        console.warn(`No se pudo enviar a ${recipient.email}:`, result);
      }
    }

    // Mark as sent
    localStorage.setItem(REMINDER_KEY, sentKey);

    // Log
    const log = JSON.parse(localStorage.getItem('paracel_reminder_log') || '[]');
    log.push({
      date: today.toISOString(),
      sentTo: unique.map(r => r.email),
      period: sentKey,
      results: { sent, failed },
    });
    localStorage.setItem('paracel_reminder_log', JSON.stringify(log));

    // Remove banner if present
    document.getElementById('reminderBanner')?.remove();

    App.showToast(
      failed > 0
        ? `${sent} correos enviados · ${failed} fallaron (sin conexión a Graph API)`
        : `✓ ${sent} recordatorios enviados correctamente`,
      failed > 0 ? 'warn' : 'success'
    );
  }

  function preview() {
    const body = document.getElementById('emailBody')?.value || getDefaultBody();
    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Vista previa</title></head><body style="font-family:sans-serif;padding:32px;max-width:600px;margin:0 auto;">${body}</body></html>`);
    win.document.close();
  }

  function getDefaultBody() {
    const periodo = getPeriodoActivo();
    const url = window.location.href;
    return `<p>Estimado/a <strong>{{NOMBRE}}</strong>,</p>
<p>Le recordamos que el cierre del mes de <strong>${MESES[periodo.mes]}</strong> requiere la carga de datos del área <strong>{{AREA}}</strong> en el Sistema de Reportes Mensuales de PARACEL S.A.</p>
<p>Por favor complete los indicadores antes del último día hábil del mes.</p>
<p style="text-align:center;margin:28px 0;">
  <a href="${url}" style="background:#1a3a2a;color:#8bc34a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
    📊 Ingresar al Sistema de Reportes
  </a>
</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
<p style="font-size:12px;color:#999;">Este es un mensaje automático del Sistema de Reportes Mensuales de PARACEL S.A. Para consultas: admin@paracel.com.py</p>`;
  }

  return { checkAndTrigger, sendNow, preview };
})();
