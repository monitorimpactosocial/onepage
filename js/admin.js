/* admin.js · Panel de Administración */

const Admin = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">⚙️ Administración del Sistema</div>
          <div class="page-subtitle">Solo accesible para el usuario administrador</div>
        </div>
      </div>
      <div class="page-body">

        <div class="admin-tabs">
          <div class="admin-tab active" onclick="Admin.switchTab('usuarios', this)">👤 Usuarios</div>
          <div class="admin-tab" onclick="Admin.switchTab('periodo', this)">📅 Período</div>
          <div class="admin-tab" onclick="Admin.switchTab('areas', this)">🗂️ Áreas</div>
          <div class="admin-tab" onclick="Admin.switchTab('recordatorio', this)">📧 Recordatorios</div>
          <div class="admin-tab" onclick="Admin.switchTab('datos', this)">💾 Datos</div>
          <div class="admin-tab" onclick="Admin.switchTab('config365', this)">🔗 Microsoft 365</div>
        </div>

        <!-- USUARIOS -->
        <div class="admin-panel active" id="panel_usuarios">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Usuarios del sistema</span>
              <button class="btn btn-primary btn-sm" onclick="Admin.showAddUser()">+ Agregar usuario</button>
            </div>
            <div class="card-body" style="padding:0;">
              <table class="data-table" style="width:100%">
                <thead>
                  <tr>
                    <th>Usuario</th><th>Nombre</th><th>Área</th><th>Email</th><th>Rol</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(USERS).map(([key, u]) => `
                    <tr>
                      <td><code>${key}</code></td>
                      <td>${u.name}</td>
                      <td>${u.area ? (AREAS[u.area]?.name || u.area) : '—'}</td>
                      <td><a href="mailto:${u.email}" style="color:var(--info)">${u.email}</a></td>
                      <td><span class="badge ${u.role==='admin'?'badge-info':'badge-ok'}">${u.role}</span></td>
                      <td>
                        <div class="actions">
                          <button class="btn btn-secondary btn-sm" onclick="Admin.editUser('${key}')">✏️</button>
                          ${key !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="Admin.deleteUser('${key}')">🗑️</button>` : ''}
                        </div>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Edit modal area -->
          <div id="userFormArea" style="margin-top:20px;"></div>
        </div>

        <!-- PERÍODO -->
        <div class="admin-panel" id="panel_periodo">
          <div class="card">
            <div class="card-header"><span class="card-title">Configurar período activo</span></div>
            <div class="card-body">
              <div class="alert alert-info">
                <span class="alert-icon">ℹ️</span>
                El período activo determina qué mes deben reportar todas las áreas.
                Normalmente se configura al inicio de cada mes para el mes anterior.
              </div>
              <div class="field-row" style="max-width:400px;">
                <div class="field-group">
                  <label>Año</label>
                  <select id="adminAnio" class="form-control">
                    ${[2024,2025,2026,2027].map(y => `<option ${y===getPeriodoActivo().anio?'selected':''}>${y}</option>`).join('')}
                  </select>
                </div>
                <div class="field-group">
                  <label>Mes</label>
                  <select id="adminMes" class="form-control">
                    ${MESES.map((m,i) => `<option value="${i}" ${i===getPeriodoActivo().mes?'selected':''}>${m}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div style="margin-top:20px;">
                <button class="btn btn-primary" onclick="Admin.savePeriodo()">💾 Guardar período</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ÁREAS -->
        <div class="admin-panel" id="panel_areas">
          <div class="card">
            <div class="card-header"><span class="card-title">Configuración de áreas</span></div>
            <div class="card-body">
              <div class="alert alert-warn">
                <span class="alert-icon">⚠️</span>
                Para modificar la estructura de indicadores de un área, editar el archivo <code>js/forms.js</code>
                y la configuración de <code>AREAS</code> en <code>js/config.js</code>.
                La siguiente tabla muestra el estado actual.
              </div>
              <table class="data-table" style="width:100%;margin-top:16px;">
                <thead>
                  <tr><th>Icono</th><th>Área</th><th>Responsable</th><th>Punto focal</th><th>Email</th><th>Hoja Excel</th></tr>
                </thead>
                <tbody>
                  ${Object.values(AREAS).map(a => `
                    <tr>
                      <td style="font-size:20px;text-align:center;">${a.icon}</td>
                      <td><strong>${a.name}</strong></td>
                      <td>${a.responsable}</td>
                      <td>${a.punto_focal}</td>
                      <td><a href="mailto:${a.email}" style="color:var(--info);font-size:12px;">${a.email}</a></td>
                      <td><code style="font-size:11px;">${a.excelSheet}</code></td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RECORDATORIO -->
        <div class="admin-panel" id="panel_recordatorio">
          <div class="card">
            <div class="card-header"><span class="card-title">Correos de recordatorio (día 25 de cada mes)</span></div>
            <div class="card-body">
              <div class="alert alert-info">
                <span class="alert-icon">ℹ️</span>
                El sistema verifica automáticamente si hoy es día 25 al iniciar sesión como administrador.
                También podés enviar el recordatorio manualmente desde aquí.
              </div>

              <div class="form-section" style="margin-top:16px;">
                <div class="form-section-header">Configurar plantilla del correo</div>
                <div class="form-section-body">
                  <div class="field-group">
                    <label>Asunto</label>
                    <input type="text" id="emailSubject" class="form-control"
                      value="📊 Recordatorio: Carga de datos mensuales PARACEL – ${formatPeriodo(getPeriodoActivo())}" />
                  </div>
                  <div class="field-group">
                    <label>Cuerpo del mensaje (HTML)</label>
                    <textarea id="emailBody" class="form-control" style="min-height:200px;">${getDefaultEmailBody()}</textarea>
                  </div>
                </div>
              </div>

              <div style="margin-top:16px; display:flex; gap:12px; align-items:center;">
                <button class="btn btn-primary" onclick="Reminders.sendNow()">📧 Enviar ahora a todos los responsables</button>
                <button class="btn btn-secondary" onclick="Reminders.preview()">👁️ Vista previa</button>
              </div>

              <div style="margin-top:24px;">
                <h4 style="font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:12px;">Destinatarios</h4>
                <table class="data-table">
                  <thead><tr><th>Área</th><th>Responsable</th><th>Email</th><th>Incluir</th></tr></thead>
                  <tbody>
                    ${Object.values(AREAS).map(a => `
                      <tr>
                        <td>${a.icon} ${a.name}</td>
                        <td>${a.punto_focal}</td>
                        <td>${a.email}</td>
                        <td><input type="checkbox" checked name="email_include_${a.id}" /></td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- DATOS -->
        <div class="admin-panel" id="panel_datos">
          <div class="card">
            <div class="card-header"><span class="card-title">Exportar / Importar datos</span></div>
            <div class="card-body">
              <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
                <button class="btn btn-primary" onclick="Admin.exportAllJSON()">📥 Exportar todo como JSON</button>
                <button class="btn btn-secondary" onclick="Admin.importJSON()">📤 Importar desde JSON</button>
                <button class="btn btn-danger" onclick="Admin.clearData()">🗑️ Limpiar datos del período actual</button>
              </div>
              <div id="dataPreview" style="background:var(--cream);border-radius:var(--radius);padding:16px;font-size:12px;font-family:monospace;max-height:300px;overflow-y:auto;"></div>
            </div>
          </div>
        </div>

        <!-- MICROSOFT 365 CONFIG -->
        <div class="admin-panel" id="panel_config365">
          <div class="card">
            <div class="card-header"><span class="card-title">Configuración Microsoft 365 / Graph API</span></div>
            <div class="card-body">
              <div class="alert alert-warn">
                <span class="alert-icon">⚠️</span>
                Estos valores deben configurarse en el archivo <code>js/config.js</code> antes del despliegue.
                No se guardan en el navegador por seguridad.
              </div>
              <div class="form-section" style="margin-top:16px;">
                <div class="form-section-body">
                  <div class="field-group">
                    <label>Client ID (Azure App Registration)</label>
                    <input class="form-control" id="cfg_clientId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value="${GRAPH_CONFIG.clientId !== 'TU_CLIENT_ID_AQUI' ? GRAPH_CONFIG.clientId : ''}" />
                  </div>
                  <div class="field-group">
                    <label>Tenant ID</label>
                    <input class="form-control" id="cfg_tenantId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value="${GRAPH_CONFIG.tenantId !== 'TU_TENANT_ID_AQUI' ? GRAPH_CONFIG.tenantId : ''}" />
                  </div>
                  <div class="field-group">
                    <label>Excel File ID (desde la URL de OneDrive)</label>
                    <input class="form-control" id="cfg_fileId" placeholder="Pegar el ID del archivo Excel en OneDrive" value="${GRAPH_CONFIG.excelFileId !== 'TU_FILE_ID_AQUI' ? GRAPH_CONFIG.excelFileId : ''}" />
                    <span class="field-hint">Abrí el Excel en OneDrive → URL → copiar el segmento "items/XXXXXXX"</span>
                  </div>
                </div>
              </div>
              <div style="margin-top:16px;">
                <button class="btn btn-primary" onclick="Admin.testGraphConnection()">🔌 Probar conexión</button>
              </div>
              <div id="graphTestResult" style="margin-top:12px;"></div>

              <div class="form-section" style="margin-top:24px;">
                <div class="form-section-header">📋 Instrucciones de configuración</div>
                <div class="form-section-body">
                  <ol style="font-size:13px;line-height:2;color:var(--ink);padding-left:16px;">
                    <li>Ir a <strong>portal.azure.com</strong> → Azure Active Directory → Registros de aplicaciones → Nueva registro</li>
                    <li>Nombre: "PARACEL SRM" · Tipo de cuenta: "Solo esta organización"</li>
                    <li>URI de redirección: Plataforma "SPA" → <code>${window.location.origin}</code></li>
                    <li>Permisos API: Microsoft Graph → Permisos delegados → <code>Files.ReadWrite</code>, <code>Mail.Send</code>, <code>User.Read</code></li>
                    <li>Otorgar consentimiento de administrador</li>
                    <li>Copiar "Id. de aplicación" → Client ID · Copiar "Id. de directorio" → Tenant ID</li>
                    <li>Subir el archivo Excel de PARACEL a OneDrive · Copiar su ID desde la URL</li>
                    <li>Actualizar <code>js/config.js</code> con los valores obtenidos</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>`;
  }

  function switchTab(name, el) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('panel_' + name)?.classList.add('active');
  }

  function savePeriodo() {
    const anio = parseInt(document.getElementById('adminAnio').value);
    const mes  = parseInt(document.getElementById('adminMes').value);
    setPeriodoActivo(anio, mes);
    document.getElementById('sidebarPeriod').textContent = formatPeriodo({ anio, mes });
    App.showToast(`Período actualizado: ${formatPeriodo({ anio, mes })}`, 'success');
  }

  function exportAllJSON() {
    const data = Graph.getAllLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paracel-datos-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    App.showToast('Exportación completada', 'success');
  }

  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
          App.showToast('Datos importados correctamente', 'success');
          document.getElementById('dataPreview').textContent = JSON.stringify(data, null, 2).slice(0, 2000) + '...';
        } catch { App.showToast('Error al parsear el JSON', 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearData() {
    if (!confirm('¿Seguro que desea limpiar los datos del período actual? Esta acción no se puede deshacer.')) return;
    const pKey = periodoKey(getPeriodoActivo());
    let deleted = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.includes(pKey)) { localStorage.removeItem(k); deleted++; }
    }
    App.showToast(`${deleted} registros eliminados`, 'warn');
  }

  function showAddUser() {
    document.getElementById('userFormArea').innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">Agregar / editar usuario</span></div>
        <div class="card-body">
          <p class="alert alert-warn" style="margin-bottom:16px;">
            <span class="alert-icon">⚠️</span>
            Los usuarios se definen en <code>js/config.js</code>. Editá ese archivo directamente para agregar usuarios de forma permanente.
            Los cambios hechos aquí son solo para esta sesión.
          </p>
          <div class="field-row">
            <div class="field-group">
              <label>Clave de usuario</label>
              <input class="form-control" id="newUserKey" placeholder="ej: logistica2" />
            </div>
            <div class="field-group">
              <label>Nombre completo</label>
              <input class="form-control" id="newUserName" />
            </div>
            <div class="field-group">
              <label>Contraseña</label>
              <input class="form-control" type="text" id="newUserPass" placeholder="mínimo 6 caracteres" />
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label>Email</label>
              <input class="form-control" type="email" id="newUserEmail" />
            </div>
            <div class="field-group">
              <label>Área asignada</label>
              <select class="form-control" id="newUserArea">
                <option value="">Sin área (solo lectura)</option>
                ${Object.values(AREAS).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="margin-top:16px;display:flex;gap:10px;">
            <button class="btn btn-primary" onclick="Admin.saveNewUser()">Guardar</button>
            <button class="btn btn-secondary" onclick="document.getElementById('userFormArea').innerHTML=''">Cancelar</button>
          </div>
        </div>
      </div>`;
  }

  function saveNewUser() {
    const key   = document.getElementById('newUserKey').value.trim().toLowerCase();
    const name  = document.getElementById('newUserName').value.trim();
    const pass  = document.getElementById('newUserPass').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const area  = document.getElementById('newUserArea').value;
    if (!key || !name || !pass) { App.showToast('Completar todos los campos', 'error'); return; }
    USERS[key] = { password: pass, name, role: 'user', area: area || null, email, avatar: name.slice(0,2).toUpperCase() };
    App.navigate('admin');
    App.showToast(`Usuario "${key}" agregado (solo en esta sesión). Añadirlo a config.js para que sea permanente.`, 'warn');
  }

  function editUser(key) {
    App.showToast('Para editar usuarios permanentemente, modificar js/config.js', 'warn');
  }

  function deleteUser(key) {
    if (!confirm(`¿Eliminar usuario "${key}"?`)) return;
    delete USERS[key];
    App.navigate('admin');
    App.showToast(`Usuario "${key}" eliminado de la sesión`, 'warn');
  }

  async function testGraphConnection() {
    const result = document.getElementById('graphTestResult');
    result.innerHTML = '<div style="display:flex;gap:8px;align-items:center;"><div class="spinner" style="width:20px;height:20px;"></div> Verificando conexión...</div>';
    const token = await Graph.getToken();
    if (token) {
      result.innerHTML = '<div class="alert alert-success"><span class="alert-icon">✅</span> Conectado a Microsoft Graph API correctamente.</div>';
    } else {
      result.innerHTML = '<div class="alert alert-error"><span class="alert-icon">❌</span> Sin conexión. Verificar Client ID, Tenant ID y que el usuario haya autorizado la app en Azure AD.</div>';
    }
  }

  function getDefaultEmailBody() {
    const periodo = getPeriodoActivo();
    const url = window.location.href;
    return `<p>Estimado/a responsable,</p>
<p>Le recordamos que el <strong>cierre del mes de ${MESES[periodo.mes === 0 ? 11 : periodo.mes - 1]} ${periodo.anio}</strong> requiere la carga de datos en el Sistema de Reportes Mensuales de PARACEL.</p>
<p>Por favor, ingrese al sistema antes del <strong>último día hábil del mes</strong> y complete los indicadores de su área:</p>
<p style="text-align:center;margin:24px 0;">
  <a href="${url}" style="background:#1a3a2a;color:#8bc34a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
    📊 Acceder al Sistema
  </a>
</p>
<p>Si tiene consultas, comuníquese con el administrador del sistema.</p>
<p>Saludos,<br/><strong>Equipo PARACEL S.A.</strong></p>`;
  }

  return { render, switchTab, savePeriodo, exportAllJSON, importJSON, clearData, showAddUser, saveNewUser, editUser, deleteUser, testGraphConnection };
})();
