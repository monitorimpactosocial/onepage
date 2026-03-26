/* graph.js · Modificado para Google Apps Script */

const Graph = (() => {

  // ── Guardar datos en Google Sheets vía Apps Script ───────
  async function saveToExcel(sheetName, rowData, periodKey) {
    if (!GAS_CONFIG.url || GAS_CONFIG.url === 'AQUI_IRA_LA_URL_DE_APPS_SCRIPT') {
      saveLocalFallback(sheetName, rowData, periodKey);
      return { success: true, mode: 'local', error: 'URL de Apps Script no configurada' };
    }

    try {
      const payload = {
        action: 'saveData',
        sheetName: sheetName,
        rowData: rowData,
        periodKey: periodKey
      };

      const res = await fetch(GAS_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Para evitar el PREFLIGHT estricto de CORS si fuesen JSON headers
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Error desconocido en GAS');
      
      saveLocalFallback(sheetName, rowData, periodKey);
      return { success: true, mode: 'cloud' };
    } catch (err) {
      console.error('GAS API error:', err);
      saveLocalFallback(sheetName, rowData, periodKey);
      return { success: true, mode: 'local', error: err.message };
    }
  }

  // ── Enviar correo vía Google Apps Script ────────────────
  async function sendEmail({ to, subject, body, fromName }) {
    if (!GAS_CONFIG.url || GAS_CONFIG.url === 'AQUI_IRA_LA_URL_DE_APPS_SCRIPT') {
      return { success: false, reason: 'no_url' };
    }

    try {
      const payload = {
        action: 'sendEmail',
        to: Array.isArray(to) ? to.join(',') : to,
        subject: subject,
        body: body,
        fromName: fromName
      };

      const res = await fetch(GAS_CONFIG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      return result.success ? { success: true } : { success: false, error: result.error };
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
