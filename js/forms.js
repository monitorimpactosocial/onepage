/* forms.js · Formularios de carga de datos por área */

const Forms = (() => {

  // ── Renderer principal ──────────────────────────────────
  function render(areaId, periodo, container) {
    const area = AREAS[areaId];
    if (!area) { container.innerHTML = '<p>Área no encontrada.</p>'; return; }

    const pKey = periodoKey(periodo);
    const saved = Graph.loadLocal(area.excelSheet, pKey) || {};

    const renderers = {
      ssl_industrial:     renderSSL,
      ssl_forestal:       renderSSL,
      forestal_oper:      renderForestalOper,
      forestal_fomento:   renderForestalFomento,
      industrial_oper:    renderIndustrialOper,
      talento_humano:     renderTalentoHumano,
      finanzas:           renderFinanzas,
      compras:            renderCompras,
      comunicacion_social:renderComunicacion,
      ambiental:          renderAmbiental,
      logistica:          renderLogistica,
    };

    const fn = renderers[areaId];
    if (!fn) { container.innerHTML = `<div class="alert alert-warn"><span class="alert-icon">⚠️</span>Formulario no disponible para esta área.</div>`; return; }
    fn(area, periodo, pKey, saved, container);
  }

  // ── Helpers UI ──────────────────────────────────────────
  function field(id, label, type = 'number', value = '', hint = '', unit = '') {
    const unitHtml = unit ? `<span class="unit-label">${unit}</span>` : '';
    const wrapClass = unit ? 'field-unit' : '';
    return `
      <div class="field-group">
        <label for="${id}">${label}</label>
        ${hint ? `<span class="field-hint">${hint}</span>` : ''}
        <div class="${wrapClass}">
          <input type="${type}" id="${id}" name="${id}" class="form-control"
            value="${value !== null && value !== undefined ? value : ''}" ${type === 'number' ? 'min="0" step="any"' : ''} />
          ${unitHtml}
        </div>
      </div>`;
  }

  function textarea(id, label, value = '', hint = '') {
    return `
      <div class="field-group">
        <label for="${id}">${label}</label>
        ${hint ? `<span class="field-hint">${hint}</span>` : ''}
        <textarea id="${id}" name="${id}" class="form-control">${value || ''}</textarea>
      </div>`;
  }

  function section(title, body) {
    return `<div class="form-section">
      <div class="form-section-header">${title}</div>
      <div class="form-section-body">${body}</div>
    </div>`;
  }

  function row(...fields) {
    return `<div class="field-row">${fields.join('')}</div>`;
  }

  function saveBtn(areaId) {
    return `<div class="form-actions">
      <span class="badge badge-pending" id="formStatus">Sin guardar</span>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-secondary" onclick="Forms.exportPDF('${areaId}')">📄 Exportar PDF</button>
        <button class="btn btn-primary" onclick="Forms.save('${areaId}')">💾 Guardar datos</button>
      </div>
    </div>`;
  }

  function formHeader(area, periodo) {
    return `<div class="page-header">
      <div>
        <div class="page-title">${area.icon} ${area.name}</div>
        <div class="page-subtitle">Período: ${formatPeriodo(periodo)} · Responsable: ${area.punto_focal} · ${area.email}</div>
      </div>
    </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  SSL INDUSTRIAL / FORESTAL
  // ══════════════════════════════════════════════════════════
  function renderSSL(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Horas y Accidentalidad', `
          ${row(
            field('horas_mes', 'Horas trabajadas en el mes', 'number', s.horas_mes, '', 'horas'),
            field('horas_acum', 'Horas trabajadas acumuladas (desde ene)', 'number', s.horas_acum, '', 'horas'),
          )}
          ${row(
            field('horas_sin_accidente', 'Horas sin accidentes (desde inicio)', 'number', s.horas_sin_accidente, 'Desde la fecha de inicio del conteo', 'horas'),
            field('fecha_inicio_conteo', 'Fecha inicio conteo sin accidente', 'date', s.fecha_inicio_conteo || '2021-06-01'),
          )}
          <div class="alert alert-info"><span class="alert-icon">ℹ️</span>
            Tasa ACR+ASR = (ACR + ASR) × 1.000.000 / Horas acumuladas del año. Se calcula automáticamente.
          </div>
        `)}

        ${section('B. Tipos de Accidentes (Cantidad)', `
          <table class="form-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Código</th>
                <th>Cantidad en el mes</th>
                <th>Acum. desde enero</th>
              </tr>
            </thead>
            <tbody>
              ${['FAT','ACR','ASR','SAA'].map(t => `
                <tr>
                  <td>${{FAT:'Fatalidad / Incapacidad',ACR:'Accidente con reposo',ASR:'Accidente sin reposo',SAA:'Simple Atención Ambulatoria'}[t]}</td>
                  <td><strong>${t}</strong></td>
                  <td><input type="number" min="0" name="acc_${t.toLowerCase()}_mes" value="${s['acc_'+t.toLowerCase()+'_mes'] || 0}" /></td>
                  <td><input type="number" min="0" name="acc_${t.toLowerCase()}_acum" value="${s['acc_'+t.toLowerCase()+'_acum'] || 0}" /></td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}

        ${section('C. Accidentes por Género, Edad y Origen', `
          <p style="font-size:13px;color:var(--muted);margin-bottom:14px;">
            Para cada tipo de accidente (FAT, ACR, ASR, SAA), registrar cantidad de mujeres y hombres,
            por rango etario (menores 30 / 30-50 / mayores 50) e indigenidad (indígena / no indígena).
          </p>
          ${row(
            field('acc_muj_indigena_acr', 'Mujeres indígenas ACR', 'number', s.acc_muj_indigena_acr || 0),
            field('acc_muj_no_indigena_acr', 'Mujeres no indígenas ACR', 'number', s.acc_muj_no_indigena_acr || 0),
            field('acc_hom_indigena_acr', 'Hombres indígenas ACR', 'number', s.acc_hom_indigena_acr || 0),
            field('acc_hom_no_indigena_acr', 'Hombres no indígenas ACR', 'number', s.acc_hom_no_indigena_acr || 0),
          )}
        `)}

        ${section('D. Enfermedades y Ausencias', `
          ${row(
            field('ausencias_enfermedad', 'Nº de ausencias por enfermedad', 'number', s.ausencias_enfermedad || 0),
          )}
          ${textarea('enfermedades_frecuentes', 'Enfermedades / afecciones más frecuentes', s.enfermedades_frecuentes,
            'Ej: Gastroenteritis, Faringitis aguda, Lumbalgia...')}
        `)}

        ${section('E. Auditorías a Proveedores', `
          <h4 style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">
            Condiciones de Salud y Seguridad
          </h4>
          ${row(
            field('audit_ssl_n', 'Nº de auditorías realizadas', 'number', s.audit_ssl_n || 0),
            field('audit_ssl_informes', 'Nº de informes presentados', 'number', s.audit_ssl_informes || 0),
            field('audit_ssl_prov', 'Nº de proveedores auditados', 'number', s.audit_ssl_prov || 0),
            field('audit_ssl_nc', 'Nº de no conformidades detectadas', 'number', s.audit_ssl_nc || 0),
          )}
          <h4 style="font-size:13px;font-weight:700;color:var(--muted);margin:16px 0 12px;text-transform:uppercase;letter-spacing:.05em;">
            Condiciones Laborales (horario, salario, IPS, etc.)
          </h4>
          ${row(
            field('audit_lab_n', 'Nº de auditorías realizadas', 'number', s.audit_lab_n || 0),
            field('audit_lab_informes', 'Nº de informes presentados', 'number', s.audit_lab_informes || 0),
            field('audit_lab_prov', 'Nº de proveedores auditados', 'number', s.audit_lab_prov || 0),
            field('audit_lab_nc', 'Nº de no conformidades', 'number', s.audit_lab_nc || 0),
          )}
        `)}

        ${section('F. Capacitaciones', `
          ${row(
            field('cap_n', 'Nº de capacitaciones realizadas', 'number', s.cap_n || 0),
            field('cap_personas', 'Nº de personas alcanzadas', 'number', s.cap_personas || 0),
          )}
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  OPERACIONES FORESTALES
  // ══════════════════════════════════════════════════════════
  function renderForestalOper(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Plantación', `
          ${row(
            field('plantacion_mes', 'Ejecución de hectáreas plantadas en el mes', 'number', s.plantacion_mes, '', 'ha'),
            field('plantacion_acum', 'Acumulado de ejecución de plantaciones', 'number', s.plantacion_acum, 'Calculado automáticamente', 'ha'),
          )}
          ${row(
            field('plantacion_meta_anual', 'Meta anual 2026', 'number', s.plantacion_meta_anual || 15000, '', 'ha'),
            field('plantacion_pct', '% de ejecución del mes', 'number', s.plantacion_pct, 'Calculado automáticamente', '%'),
          )}
          ${row(
            field('arboles_plantados_mes', 'Árboles plantados en el mes', 'number', s.arboles_plantados_mes || 0),
            field('arboles_acum_total', 'Total acumulado de árboles plantados', 'number', s.arboles_acum_total),
          )}
        `)}

        ${section('B. Habilitación y Área Preparada', `
          ${row(
            field('habilitacion_mes', 'Habilitación en el mes', 'number', s.habilitacion_mes || 0, '', 'ha'),
            field('habilitacion_acum', 'Habilitación acumulada', 'number', s.habilitacion_acum || 0, '', 'ha'),
          )}
          ${row(
            field('area_preparada_mes', 'Área preparada en el mes', 'number', s.area_preparada_mes || 0, '', 'ha'),
            field('area_preparada_acum', 'Área preparada acumulada', 'number', s.area_preparada_acum || 0, '', 'ha'),
          )}
          ${row(
            field('reforma_mes', 'Reforma en el mes', 'number', s.reforma_mes || 0, '', 'ha'),
            field('fertilizacion_pct', 'Conforme especificaciones fertilización base', 'number', s.fertilizacion_pct || 0, '', '%'),
          )}
        `)}

        ${section('C. Incendios', `
          ${row(
            field('inc_conservacion', 'Ha de conservación afectadas por incendios', 'number', s.inc_conservacion || 0, '', 'ha'),
            field('inc_plantadas', 'Ha forestales plantadas afectadas', 'number', s.inc_plantadas || 0, '', 'ha'),
            field('inc_otros_usos', 'Ha de otros usos afectadas', 'number', s.inc_otros_usos || 0, '', 'ha'),
          )}
          ${row(
            field('pct_area_conservacion', '% del área destinada a conservación', 'number', s.pct_area_conservacion || 47, '', '%'),
          )}
        `)}

        ${section('D. Fomento – Contratos y Ejecución', `
          <table class="form-table">
            <thead>
              <tr><th>Proveedor</th><th>Contratos (ha)</th><th>Plantadas acumuladas</th></tr>
            </thead>
            <tbody>
              ${['GVASA','GENEFOR','MADEPLANT','F.AZUL/F.ARANDU','PLANSUR','R5','SILCO','GNF','ROZA','GREEN TEC','DIEGO GARCIA','LUIS VILLALBA'].map(p => `
                <tr>
                  <td>${p}</td>
                  <td><input type="number" min="0" name="fomento_${p.replace(/[^a-z0-9]/gi,'_')}_contratos" value="${s['fomento_'+p.replace(/[^a-z0-9]/gi,'_')+'_contratos'] || ''}" /></td>
                  <td><input type="number" min="0" name="fomento_${p.replace(/[^a-z0-9]/gi,'_')}_plantadas" value="${s['fomento_'+p.replace(/[^a-z0-9]/gi,'_')+'_plantadas'] || ''}" /></td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  FORESTAL PROPIAS Y FOMENTO (vista simplificada)
  // ══════════════════════════════════════════════════════════
  function renderForestalFomento(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">
        ${section('Plantaciones Propias', `
          ${row(
            field('propias_mes', 'Ejecución de hectáreas en el mes', 'number', s.propias_mes, '', 'ha'),
            field('propias_acum', 'Acumulado', 'number', s.propias_acum, '', 'ha'),
          )}
        `)}
        ${section('Plantaciones Fomento', `
          ${row(
            field('fomento_mes', 'Ejecución en el mes', 'number', s.fomento_mes, '', 'ha'),
            field('fomento_acum', 'Acumulado', 'number', s.fomento_acum, '', 'ha'),
          )}
        `)}
        ${section('Negociaciones y Contratos Cerrados', `
          ${row(
            field('planificado_2026', 'Planificado 2026 Plantación', 'number', s.planificado_2026, '', 'ha'),
            field('contratos_cerrados', 'Contratos cerrados acumulados', 'number', s.contratos_cerrados, '', 'ha'),
            field('ejecucion_plantaciones', 'Ejecución de plantaciones', 'number', s.ejecucion_plantaciones, '', 'ha'),
            field('negociaciones_avanzadas', 'Negociaciones avanzadas', 'number', s.negociaciones_avanzadas, '', 'ha'),
          )}
        `)}
        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  OPERACIONES INDUSTRIALES
  // ══════════════════════════════════════════════════════════
  function renderIndustrialOper(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">
        ${section('Mantenimiento y Movimiento de Suelo', `
          ${row(
            field('mov_suelo_objetivo_pct', 'Mantenimiento en movimiento suelo – % objetivo', 'number', s.mov_suelo_objetivo_pct, 'Objetivo mensual en %', '%'),
            field('mov_suelo_ejecutado_pct', '% ejecutado', 'number', s.mov_suelo_ejecutado_pct, '', '%'),
          )}
          ${row(
            field('mov_suelo_m3_plan', 'Volumen planificado (m³)', 'number', s.mov_suelo_m3_plan, '', 'm³'),
            field('mov_suelo_m3_real', 'Volumen real ejecutado (m³)', 'number', s.mov_suelo_m3_real, '', 'm³'),
          )}
          ${textarea('obs_industrial', 'Observaciones / novedades del mes', s.obs_industrial)}
        `)}
        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  TALENTO HUMANO
  // ══════════════════════════════════════════════════════════
  function renderTalentoHumano(area, periodo, pKey, saved, container) {
    const s = saved;
    const areasPY = ['Talento Humano','Seguridad Corporativa','Salud y Seguridad','Sustentabilidad Social',
      'Comunicaciones','Compras','Finanzas','Tesorería','Contabilidad','Ambiental','Forestal','Logística','Tecnología','Ingeniería'];

    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Nómina Paracel por Área', `
          <table class="form-table">
            <thead>
              <tr><th>Área Paracel</th><th>Personas contratadas</th><th>Hombres</th><th>Mujeres</th><th>Menores 30</th><th>30-50</th><th>Mayores 50</th><th>Salidas</th><th>% Rotación</th></tr>
            </thead>
            <tbody>
              ${areasPY.map(a => {
                const k = a.toLowerCase().replace(/\s/g,'_');
                return `<tr>
                  <td>${a}</td>
                  <td><input type="number" min="0" name="th_${k}_total" value="${s['th_'+k+'_total'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_hom" value="${s['th_'+k+'_hom'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_muj" value="${s['th_'+k+'_muj'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_menor30" value="${s['th_'+k+'_menor30'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_30_50" value="${s['th_'+k+'_30_50'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_mayor50" value="${s['th_'+k+'_mayor50'] || ''}" /></td>
                  <td><input type="number" min="0" name="th_${k}_salidas" value="${s['th_'+k+'_salidas'] || ''}" /></td>
                  <td><input type="number" min="0" step="0.01" name="th_${k}_rotacion" value="${s['th_'+k+'_rotacion'] || ''}" /></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `)}

        ${section('B. Distribución por Departamento', `
          <table class="form-table">
            <thead>
              <tr><th>Departamento</th><th>Nómina Paracel</th><th>%</th></tr>
            </thead>
            <tbody>
              ${DEPARTAMENTOS_PY.map(d => `
                <tr>
                  <td>${d}</td>
                  <td><input type="number" min="0" name="dep_${d.toLowerCase().replace(/\s/g,'_')}_n" value="${s['dep_'+d.toLowerCase().replace(/\s/g,'_')+'_n'] || ''}" /></td>
                  <td><input type="number" min="0" step="0.001" name="dep_${d.toLowerCase().replace(/\s/g,'_')}_pct" value="${s['dep_'+d.toLowerCase().replace(/\s/g,'_')+'_pct'] || ''}" /></td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}

        ${section('C. Nacionalidad', `
          ${row(
            field('nomina_paraguay', 'Nómina Paraguay', 'number', s.nomina_paraguay || 0),
            field('nomina_otros_paises', 'Nómina otros países', 'number', s.nomina_otros_paises || 0),
            field('pct_paraguayos', '% de paraguayos', 'number', s.pct_paraguayos, '', '%'),
            field('pct_extranjeros', '% extranjeros', 'number', s.pct_extranjeros, '', '%'),
          )}
        `)}

        ${section('D. Inclusión de Mujeres', `
          ${row(
            field('muj_indigenas_contratadas', 'Mujeres indígenas contratadas', 'number', s.muj_indigenas_contratadas || 0),
            field('muj_no_indigenas_contratadas', 'Mujeres no indígenas contratadas', 'number', s.muj_no_indigenas_contratadas || 0),
            field('muj_trabajos_no_trad', 'Mujeres en trabajos no tradicionales', 'number', s.muj_trabajos_no_trad || 0),
            field('muj_liderazgo', 'Mujeres en cargos de liderazgo', 'number', s.muj_liderazgo || 0),
          )}
        `)}

        ${section('E. Fuente de Reclutamiento', `
          ${row(
            field('rec_web_paracel', 'Web Paracel', 'number', s.rec_web_paracel || 0),
            field('rec_email', 'Email', 'number', s.rec_email || 0),
            field('rec_otras', 'Otras fuentes', 'number', s.rec_otras || 0),
          )}
        `)}

        ${section('F. Bolsa de Empleo', `
          ${row(
            field('bolsa_registrados_mes', 'Personas registradas en el mes', 'number', s.bolsa_registrados_mes || 0),
            field('bolsa_total_registrados', 'Total acumulado registrados', 'number', s.bolsa_total_registrados || 0),
            field('bolsa_mujeres', 'Mujeres registradas', 'number', s.bolsa_mujeres || 0),
            field('bolsa_indigenas', 'Personas indígenas', 'number', s.bolsa_indigenas || 0),
          )}
          ${row(
            field('bolsa_busquedas', 'Búsquedas publicadas', 'number', s.bolsa_busquedas || 0),
            field('bolsa_aspirantes', 'Aspirantes presentados', 'number', s.bolsa_aspirantes || 0),
            field('bolsa_contratados', 'Aspirantes contratados', 'number', s.bolsa_contratados || 0),
          )}
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  FINANZAS
  // ══════════════════════════════════════════════════════════
  function renderFinanzas(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Ejecución Presupuestaria OPEX + CAPEX', `
          ${row(
            field('budget_opex_capex', 'Budget 2026 OPEX+CAPEX (YTD)', 'number', s.budget_opex_capex, 'Acumulado año a la fecha', 'USD'),
            field('actual_opex_capex', 'Actual 2026 OPEX+CAPEX (YTD)', 'number', s.actual_opex_capex, 'Acumulado año a la fecha', 'USD'),
          )}
          ${row(
            field('var_opex_capex_usd', 'Variación USD', 'number', s.var_opex_capex_usd, 'Actual – Budget', 'USD'),
            field('var_opex_capex_pct', 'Variación %', 'number', s.var_opex_capex_pct, '', '%'),
          )}
        `)}

        ${section('B. Estado de Procesos con Catastro', `
          <table class="form-table">
            <thead>
              <tr><th>Estado</th><th>Observación</th><th>Área (ha)</th><th>Valor aprox. (MUSD)</th></tr>
            </thead>
            <tbody>
              ${['Finalizado','En proceso','En revisión'].map(est => {
                const k = est.toLowerCase().replace(/\s/g,'_');
                return `<tr>
                  <td><strong>${est}</strong></td>
                  <td><input type="text" name="cat_${k}_obs" value="${s['cat_'+k+'_obs'] || ''}" style="width:100%;font-size:12px;" /></td>
                  <td><input type="number" min="0" step="any" name="cat_${k}_ha" value="${s['cat_'+k+'_ha'] || ''}" /></td>
                  <td><input type="number" min="0" step="any" name="cat_${k}_musd" value="${s['cat_'+k+'_musd'] || ''}" /></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  COMPRAS
  // ══════════════════════════════════════════════════════════
  function renderCompras(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Descuentos Obtenidos', `
          ${row(
            field('desc_forestal_usd', 'Forestal – Descuento USD', 'number', s.desc_forestal_usd, '', 'USD'),
            field('desc_forestal_pct', 'Forestal – %', 'number', s.desc_forestal_pct, '', '%'),
          )}
          ${row(
            field('desc_corporativo_usd', 'Corporativo – Descuento USD', 'number', s.desc_corporativo_usd, '', 'USD'),
            field('desc_corporativo_pct', 'Corporativo – %', 'number', s.desc_corporativo_pct, '', '%'),
          )}
          ${row(
            field('desc_general_usd', 'General – Descuento USD', 'number', s.desc_general_usd, '', 'USD'),
            field('desc_general_pct', 'General – %', 'number', s.desc_general_pct, '', '%'),
          )}
        `)}

        ${section('B. SLA de Compras', `
          ${row(
            field('ordenes_emitidas', 'Órdenes de compra emitidas', 'number', s.ordenes_emitidas || 0),
            field('sla_pct', 'SLA cumplido en 100% del total', 'number', s.sla_pct || 0, 'Objetivo: 100%', '%'),
          )}
        `)}

        ${section('C. Compras Exceptuadas', `
          ${row(
            field('exceptuadas_ef_pct', 'EF Acumulado %', 'number', s.exceptuadas_ef_pct, '', '%'),
            field('valor_total_compras', 'Valor total de compras', 'number', s.valor_total_compras, '', 'USD'),
          )}
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  COMUNICACIÓN SOCIAL
  // ══════════════════════════════════════════════════════════
  function renderComunicacion(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Quejas, Consultas y Sugerencias (QCS)', `
          ${row(
            field('qcs_quejas', 'Quejas recibidas en el mes', 'number', s.qcs_quejas || 0),
            field('qcs_consultas', 'Consultas recibidas', 'number', s.qcs_consultas || 0),
            field('qcs_sugerencias', 'Sugerencias recibidas', 'number', s.qcs_sugerencias || 0),
            field('qcs_total', 'Total contactos', 'number', s.qcs_total || 0),
          )}
          <table class="form-table">
            <thead>
              <tr><th>Asunto</th><th>Quejas</th><th>Consultas</th><th>Sugerencias</th></tr>
            </thead>
            <tbody>
              ${['Social','Proveedores','Empleo','Otros'].map(a => `
                <tr>
                  <td>${a}</td>
                  <td><input type="number" min="0" name="qcs_asunto_${a.toLowerCase()}_q" value="${s['qcs_asunto_'+a.toLowerCase()+'_q'] || ''}" /></td>
                  <td><input type="number" min="0" name="qcs_asunto_${a.toLowerCase()}_c" value="${s['qcs_asunto_'+a.toLowerCase()+'_c'] || ''}" /></td>
                  <td><input type="number" min="0" name="qcs_asunto_${a.toLowerCase()}_s" value="${s['qcs_asunto_'+a.toLowerCase()+'_s'] || ''}" /></td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}

        ${section('B. Redes Sociales', `
          ${row(
            field('redes_facebook', 'Seguidores Facebook', 'number', s.redes_facebook || 0),
            field('redes_instagram', 'Seguidores Instagram', 'number', s.redes_instagram || 0),
            field('redes_linkedin', 'Seguidores LinkedIn', 'number', s.redes_linkedin || 0),
            field('redes_total', 'Total seguidores', 'number', s.redes_total || 0, 'Objetivo 2026: 100.000'),
          )}
          ${row(
            field('web_visitas', 'Visitas al sitio web en el mes', 'number', s.web_visitas || 0),
          )}
        `)}

        ${section('C. Programa de Salud Comunitaria', `
          ${row(
            field('salud_asistencia_medica', 'Asistencia médica – personas alcanzadas', 'number', s.salud_asistencia_medica || 0),
            field('salud_inmunizaciones', 'Inmunizaciones (PAI)', 'number', s.salud_inmunizaciones || 0),
            field('salud_leche', 'Entrega leche fortificada (PANI)', 'number', s.salud_leche || 0),
            field('salud_cap_sexual', 'Capacitación salud sexual y reproductiva', 'number', s.salud_cap_sexual || 0),
          )}
        `)}

        ${section('D. Inversión Social e Infraestructura', `
          ${row(
            field('inv_agua', 'Familias con acceso a agua por primera vez', 'number', s.inv_agua || 0),
            field('inv_escuela', 'Familias con mejoramiento infraestructura escolar', 'number', s.inv_escuela || 0),
            field('inv_energia', 'Familias con acceso a energía eléctrica', 'number', s.inv_energia || 0),
          )}
        `)}

        ${section('E. Desarrollo Productivo', `
          ${row(
            field('prod_agricultura', 'Agricultura – Tn de alimentos cosechados', 'number', s.prod_agricultura || 0),
            field('prod_apicultura', 'Apicultura – litros de miel', 'number', s.prod_apicultura || 0),
            field('prod_avicultura', 'Avicultura – aves producidas', 'number', s.prod_avicultura || 0),
            field('prod_ganaderia', 'Ganadería – productores con pasturas/kit', 'number', s.prod_ganaderia || 0),
          )}
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  AMBIENTAL
  // ══════════════════════════════════════════════════════════
  function renderAmbiental(area, periodo, pKey, saved, container) {
    const s = saved;
    const contratistas = ['Forestadora del Este','Ranchales','Agroganadera Maria Eugenia','Tecnoforestal','Plansur','Lusitana','OAC Emprendimientos','Rancho Forestal'];

    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">

        ${section('A. Permisos MADES', `
          ${row(
            field('permisos_mades_obtenidos', 'Permisos MADES obtenidos', 'number', s.permisos_mades_obtenidos || 0, '', 'n'),
            field('permisos_en_tramite', 'Permisos en trámite', 'number', s.permisos_en_tramite || 0, '', 'n'),
          )}
        `)}

        ${section('B. Auditorías a Contratistas Forestales', `
          <table class="form-table">
            <thead>
              <tr><th>Empresa contratista</th><th>% cumplimiento</th><th>Nº inspecciones</th><th>Observaciones</th></tr>
            </thead>
            <tbody>
              ${contratistas.map(c => {
                const k = c.toLowerCase().replace(/[^a-z0-9]/g,'_');
                return `<tr>
                  <td>${c}</td>
                  <td><input type="number" min="0" max="1" step="0.01" name="amb_${k}_pct" value="${s['amb_'+k+'_pct'] || ''}" /></td>
                  <td><input type="number" min="0" name="amb_${k}_insp" value="${s['amb_'+k+'_insp'] || ''}" /></td>
                  <td><input type="text" name="amb_${k}_obs" value="${s['amb_'+k+'_obs'] || ''}" style="width:100%;font-size:12px;" /></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `)}

        ${section('C. Registro de Biodiversidad', `
          ${row(
            field('bio_aves', 'Aves registradas', 'number', s.bio_aves || 0),
            field('bio_anfibios', 'Anfibios', 'number', s.bio_anfibios || 0),
            field('bio_reptiles', 'Reptiles', 'number', s.bio_reptiles || 0),
            field('bio_mamiferos', 'Mamíferos', 'number', s.bio_mamiferos || 0),
          )}
          ${textarea('bio_obs', 'Observaciones sobre biodiversidad', s.bio_obs)}
        `)}

        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  LOGÍSTICA
  // ══════════════════════════════════════════════════════════
  function renderLogistica(area, periodo, pKey, saved, container) {
    const s = saved;
    container.innerHTML = `
      ${formHeader(area, periodo)}
      <div class="page-body form-wizard" id="form_${area.id}">
        <div class="alert alert-warn">
          <span class="alert-icon">⚠️</span>
          Este módulo está temporalmente fuera de la matriz de reportes. Completar de todas formas si hay datos disponibles.
        </div>
        ${section('Indicadores de Logística', `
          ${textarea('estado_permisos_mopc', 'Estado permisos MOPC (descripción)', s.estado_permisos_mopc)}
          ${row(
            field('km_servidumbre', 'Km de servidumbre acordados', 'number', s.km_servidumbre, '', 'km'),
            field('km_negociacion', 'Km en negociación', 'number', s.km_negociacion, '', 'km'),
          )}
          ${row(
            field('consumo_combustible', 'Consumo de combustible flota', 'number', s.consumo_combustible, '', 'L'),
          )}
        `)}
        ${saveBtn(area.id)}
      </div>`;
  }

  // ══════════════════════════════════════════════════════════
  //  SAVE / EXPORT
  // ══════════════════════════════════════════════════════════
  async function save(areaId) {
    const area = AREAS[areaId];
    const periodo = getPeriodoActivo();
    const pKey = periodoKey(periodo);

    const form = document.getElementById(`form_${areaId}`);
    if (!form) return;

    const data = { _area: areaId, _periodo: pKey, _savedBy: Auth.getSession()?.username };
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(inp => {
      if (inp.name) data[inp.name] = inp.value;
    });

    const result = await Graph.saveToExcel(area.excelSheet, data, pKey);
    Graph.saveLocalFallback(area.excelSheet, data, pKey);

    const statusEl = form.querySelector('#formStatus');
    if (statusEl) {
      statusEl.className = 'badge badge-ok';
      statusEl.textContent = result.mode === 'cloud' ? '✓ Guardado en la nube' : '✓ Guardado localmente';
    }

    App.showToast('Datos guardados correctamente', 'success');
  }

  function exportPDF(areaId) {
    window.print();
  }

  return { render, save, exportPDF };
})();
