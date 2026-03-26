/* graph.js · Microsoft Graph API (Excel OneDrive + Outlook) */

const Graph = (() => {
  let _token = null;

  // ── MSAL / Token ─────────────────────────────────────────
  async function getToken() {
    // Se usa MSAL.js para autenticación OAuth2 con Microsoft
    // Para simplificar la demo, se guarda el token en memoria
    if (_token && _token.expiresAt > Date.now()) return _token.value;

    // En producción: usar MSAL acquireTokenSilent / acquireTokenPopup
    // Para demo sin MSAL configurado, retornar null y usar datos locales
    const stored = sessionStorage.getItem('ms_token');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        _token = parsed;
        return parsed.value;
      }
    }
    return null;
  }

  // ── Guardar datos en Excel vía Graph API ─────────────────
  async function saveToExcel(sheetName, rowData, periodKey) {
    const token = await getToken();
    if (!token) {
      // Guardar en localStorage como fallback
      saveLocalFallback(sheetName, rowData, periodKey);
      return { success: true, mode: 'local' };
    }

    const fileId = GRAPH_CONFIG.excelFileId;
    const drivePrefix = GRAPH_CONFIG.driveId
      ? `drives/${GRAPH_CONFIG.driveId}`
      : 'me/drive';

    try {
      // Primero: obtener el rango usado de la hoja
      const usedRangeRes = await fetch(
        `https://graph.microsoft.com/v1.0/${drivePrefix}/items/${fileId}/workbook/worksheets/${encodeURIComponent(sheetName)}/usedRange`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // Escribir en la primera fila vacía disponible
      // Para el SRM, buscamos la fila correspondiente al período y actualizamos
      const updateRes = await fetch(
        `https://graph.microsoft.com/v1.0/${drivePrefix}/items/${fileId}/workbook/worksheets/${encodeURIComponent(sheetName)}/range(address='A1')`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ values: [Object.values(rowData)] }),
        }
      );

      if (!updateRes.ok) throw new Error('Error al guardar en Excel');
      return { success: true, mode: 'cloud' };
    } catch (err) {
      console.error('Graph API error:', err);
      saveLocalFallback(sheetName, rowData, periodKey);
      return { success: true, mode: 'local', error: err.message };
    }
  }

  // ── Enviar correo vía Outlook / Graph ───────────────────
  async function sendEmail({ to, subject, body, fromName }) {
    const token = await getToken();
    if (!token) {
      console.warn('Sin token MS365 · El correo no fue enviado por API.');
      return { success: false, reason: 'no_token' };
    }

    const message = {
      message: {
        subject,
        body: { contentType: 'HTML', content: body },
        toRecipients: Array.isArray(to)
          ? to.map(email => ({ emailAddress: { address: email } }))
          : [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    };

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      });
      return res.ok ? { success: true } : { success: false, status: res.status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Fallback: LocalStorage ───────────────────────────────
  function saveLocalFallback(sheetName, data, periodKey) {
    const key = `paracel_data_${sheetName}_${periodKey}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    const merged = { ...existing, ...data, _savedAt: new Date().toISOString(), _periodKey: periodKey };
    localStorage.setItem(key, JSON.stringify(merged));
  }

  function loadLocal(sheetName, periodKey) {
    const key = `paracel_data_${sheetName}_${periodKey}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }

  function getAllLocalData() {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('paracel_data_')) {
        result[k] = JSON.parse(localStorage.getItem(k));
      }
    }
    return result;
  }

  function getCompletionStatus(periodKey) {
    const status = {};
    Object.values(AREAS).forEach(area => {
      const key = `paracel_data_${area.excelSheet}_${periodKey}`;
      const data = localStorage.getItem(key);
      status[area.id] = data ? 'ok' : 'missing';
    });
    return status;
  }

  return { saveToExcel, sendEmail, saveLocalFallback, loadLocal, getAllLocalData, getCompletionStatus };
})();
