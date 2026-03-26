/* dashboard.js · Tablero estadístico interactivo */

const Dashboard = (() => {

  function render(container) {
    const periodo = getPeriodoActivo();
    const pKey = periodoKey(periodo);
    const status = Graph.getCompletionStatus(pKey);
    const completedCount = Object.values(status).filter(v => v === 'ok').length;
    const totalAreas = Object.keys(AREAS).length;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <div class="page-title">📊 Tablero Ejecutivo</div>
          <div class="page-subtitle">Período: ${formatPeriodo(periodo)} · Actualizado: ${new Date().toLocaleDateString('es-PY')}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <select class="form-control" id="dashPeriodMes" style="width:130px">
            ${MESES.map((m,i) => `<option value="${i}" ${i===periodo.mes?'selected':''}>${m}</option>`).join('')}
          </select>
          <select class="form-control" id="dashPeriodAnio" style="width:90px">
            ${[2024,2025,2026,2027].map(y => `<option ${y===periodo.anio?'selected':''}>${y}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" onclick="Dashboard.changePeriod()">Aplicar</button>
          <button class="btn btn-primary btn-sm" onclick="window.print()">📄 PDF</button>
        </div>
      </div>
      <div class="page-body">

        <!-- KPIs -->
        <div class="dashboard-grid">
          <div class="kpi-card">
            <div class="kpi-label">Áreas reportadas</div>
            <div class="kpi-value" style="color:${completedCount===totalAreas?'var(--success)':'var(--warn)'}">
              ${completedCount}<span style="font-size:18px;color:var(--muted)">/${totalAreas}</span>
            </div>
            <div class="kpi-sub">${completedCount===totalAreas?'✓ Completo':'Pendientes: '+(totalAreas-completedCount)}</div>
          </div>
          <div class="kpi-card info" id="kpiSSL">
            <div class="kpi-label">Tasa accidentes Industrial</div>
            <div class="kpi-value" id="kpiTasaInd">—</div>
            <div class="kpi-sub">Objetivo: ≤ 5.5 × 10⁶ h</div>
          </div>
          <div class="kpi-card info" id="kpiSSLF">
            <div class="kpi-label">Tasa accidentes Forestal</div>
            <div class="kpi-value" id="kpiTasaFor">—</div>
            <div class="kpi-sub">Objetivo: ≤ 5.5 × 10⁶ h</div>
          </div>
          <div class="kpi-card warn" id="kpiPlant">
            <div class="kpi-label">Plantaciones acumuladas</div>
            <div class="kpi-value" id="kpiPlantVal">—</div>
            <div class="kpi-sub">Objetivo 2026: 15.000 ha</div>
          </div>
          <div class="kpi-card" id="kpiSeguidores">
            <div class="kpi-label">Seguidores redes sociales</div>
            <div class="kpi-value" id="kpiSegVal">—</div>
            <div class="kpi-sub">Objetivo 2026: 100.000</div>
          </div>
          <div class="kpi-card" id="kpiSLA">
            <div class="kpi-label">SLA Compras</div>
            <div class="kpi-value" id="kpiSLAVal">—</div>
            <div class="kpi-sub">Objetivo: 100%</div>
          </div>
        </div>

        <!-- Completion matrix -->
        <div class="card" style="margin-bottom:24px;">
          <div class="card-header">
            <span class="card-title">Estado de completitud por área</span>
          </div>
          <div class="card-body" style="overflow-x:auto;">
            <div class="areas-grid">
              ${Object.values(AREAS).map(area => {
                const st = status[area.id];
                return `<div class="area-card" onclick="App.navigate('form_${area.id}')" style="cursor:pointer;">
                  <div class="area-icon">${area.icon}</div>
                  <div class="area-info">
                    <div class="area-name">${area.name}</div>
                    <div class="area-resp">${area.punto_focal}</div>
                    <div class="area-status">
                      <span class="badge ${st==='ok'?'badge-ok':'badge-missing'}">
                        ${st==='ok'?'✓ Completado':'⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Charts grid -->
        <div class="charts-grid">

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">🛡️ Horas trabajadas sin accidente</span>
            </div>
            <div class="chart-body"><canvas id="chartHoras"></canvas></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">🌲 Plantaciones 2026 (ha acumuladas)</span>
            </div>
            <div class="chart-body"><canvas id="chartPlant"></canvas></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">👥 Dotación por género y área</span>
            </div>
            <div class="chart-body"><canvas id="chartGenero"></canvas></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">📢 QCS – Quejas y Consultas</span>
            </div>
            <div class="chart-body"><canvas id="chartQCS"></canvas></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">💰 Ejecución Presupuestaria OPEX+CAPEX</span>
            </div>
            <div class="chart-body"><canvas id="chartFinanzas"></canvas></div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-title">🌍 Distribución territorial de personal</span>
            </div>
            <div class="chart-body"><canvas id="chartDepto"></canvas></div>
          </div>

        </div>

        <!-- Objetivos progress bars -->
        <div class="card" style="margin-bottom:24px;">
          <div class="card-header"><span class="card-title">🎯 Avance hacia objetivos 2026</span></div>
          <div class="card-body" id="objetivosProgress">
            ${renderObjetivosProgress(pKey)}
          </div>
        </div>

      </div>`;

    // Load Chart.js dynamically if not present
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.onload = () => buildCharts(pKey);
      document.head.appendChild(script);
    } else {
      buildCharts(pKey);
    }

    loadKPIs(pKey);
  }

  function loadKPIs(pKey) {
    // Industrial SSL
    const indData = Graph.loadLocal('Industrial_SSL', pKey);
    if (indData) {
      const tasa = parseFloat(indData.acc_asr_acum_rate) || 0;
      document.getElementById('kpiTasaInd').textContent = tasa.toFixed(2);
      const card = document.getElementById('kpiSSL');
      if (card) card.className = `kpi-card ${tasa > 5.5 ? 'danger' : 'info'}`;
    }

    // Forestal SSL
    const forData = Graph.loadLocal('Forestal_SSL', pKey);
    if (forData) {
      const tasa = parseFloat(forData.acc_asr_acum_rate) || 0;
      document.getElementById('kpiTasaFor').textContent = tasa.toFixed(2);
    }

    // Plantaciones
    const plantData = Graph.loadLocal('Forestal_Oper', pKey);
    if (plantData) {
      const val = parseFloat(plantData.plantacion_acum) || 0;
      document.getElementById('kpiPlantVal').textContent = val.toLocaleString('es-PY') + ' ha';
      const pct = (val / 15000 * 100).toFixed(1);
      document.getElementById('kpiPlant').querySelector('.kpi-sub').textContent = `${pct}% del objetivo`;
    }

    // Seguidores
    const comData = Graph.loadLocal('Comunicacion_y_Sust_Social', pKey);
    if (comData) {
      const val = parseInt(comData.redes_total) || 0;
      document.getElementById('kpiSegVal').textContent = val.toLocaleString('es-PY');
    }

    // SLA Compras
    const cmpData = Graph.loadLocal('Compras', pKey);
    if (cmpData) {
      const val = parseFloat(cmpData.sla_pct) || 0;
      document.getElementById('kpiSLAVal').textContent = val + '%';
    }
  }

  function renderObjetivosProgress(pKey) {
    const items = [
      { label: 'Plantaciones forestales', key: 'plantacion_acum', sheet: 'Forestal_Oper', objetivo: 15000, unidad: 'ha' },
      { label: 'Área habilitada', key: 'habilitacion_acum', sheet: 'Forestal_Oper', objetivo: 15000, unidad: 'ha' },
      { label: 'Área preparada', key: 'area_preparada_acum', sheet: 'Forestal_Oper', objetivo: 15000, unidad: 'ha' },
      { label: 'SLA Compras', key: 'sla_pct', sheet: 'Compras', objetivo: 100, unidad: '%' },
      { label: 'Seguidores redes', key: 'redes_total', sheet: 'Comunicacion_y_Sust_Social', objetivo: 100000, unidad: 'n' },
    ];

    return items.map(item => {
      const data = Graph.loadLocal(item.sheet, pKey);
      const val = data ? (parseFloat(data[item.key]) || 0) : 0;
      const pct = Math.min((val / item.objetivo * 100), 100);
      const colorClass = pct >= 80 ? '' : pct >= 50 ? 'warn' : 'danger';
      return `
        <div class="stat-bar-row">
          <span class="stat-bar-label">${item.label}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill ${colorClass}" style="width:${pct}%"></div>
          </div>
          <span class="stat-bar-pct">${pct.toFixed(0)}%</span>
        </div>`;
    }).join('');
  }

  function buildCharts(pKey) {
    // Palette
    const green = '#4a8c5c', lime = '#8bc34a', forest = '#1a3a2a';
    const warn = '#e67e22', info = '#2980b9', danger = '#c0392b';
    const muted = '#c8bfaa';

    const defaults = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    };

    // Collect monthly SSL data for horas chart
    const mesesLabels = MESES.slice(0, 12);
    const horasInd = mesesLabels.map((_, i) => {
      const k = `${getPeriodoActivo().anio}-${String(i+1).padStart(2,'0')}`;
      const d = Graph.loadLocal('Industrial_SSL', k);
      return d ? (parseInt(d.horas_mes) || 0) : 0;
    });
    const horasFor = mesesLabels.map((_, i) => {
      const k = `${getPeriodoActivo().anio}-${String(i+1).padStart(2,'0')}`;
      const d = Graph.loadLocal('Forestal_SSL', k);
      return d ? (parseInt(d.horas_mes) || 0) : 0;
    });

    buildChart('chartHoras', 'bar', {
      labels: mesesLabels,
      datasets: [
        { label: 'Industrial', data: horasInd, backgroundColor: info + 'cc', borderRadius: 4 },
        { label: 'Forestal', data: horasFor, backgroundColor: green + 'cc', borderRadius: 4 },
      ],
    }, { ...defaults, plugins: { legend: { display: true, position: 'top' } }, scales: { y: { beginAtZero: true } } });

    // Plantaciones acum line chart
    const plantAcum = mesesLabels.map((_, i) => {
      const k = `${getPeriodoActivo().anio}-${String(i+1).padStart(2,'0')}`;
      const d = Graph.loadLocal('Forestal_Oper', k);
      return d ? (parseFloat(d.plantacion_acum) || 0) : null;
    });

    buildChart('chartPlant', 'line', {
      labels: mesesLabels,
      datasets: [
        {
          label: 'Ha acumuladas', data: plantAcum,
          borderColor: lime, backgroundColor: lime + '22',
          pointBackgroundColor: lime, tension: .3, fill: true,
        },
        {
          label: 'Objetivo mensual', data: Array(12).fill(null).map((_,i) => (15000/12*(i+1)).toFixed(0)),
          borderColor: muted, borderDash: [5,5], pointRadius: 0,
        },
      ],
    }, { ...defaults, plugins: { legend: { display: true, position: 'top' } }, scales: { y: { beginAtZero: true } } });

    // Género donut
    const thData = Graph.loadLocal('TalentoHumano_A', pKey) || {};
    const mujTotal = parseInt(thData.nomina_total_muj) || 165;
    const homTotal = parseInt(thData.nomina_total_hom) || 909;
    buildChart('chartGenero', 'doughnut', {
      labels: ['Mujeres', 'Hombres'],
      datasets: [{ data: [mujTotal, homTotal], backgroundColor: [lime, forest], borderWidth: 0, hoverOffset: 8 }],
    }, { ...defaults, plugins: { legend: { display: true, position: 'right' } } });

    // QCS bar
    const qcsData = Graph.loadLocal('Comunicacion_y_Sust_Social', pKey) || {};
    buildChart('chartQCS', 'bar', {
      labels: ['Quejas', 'Consultas', 'Sugerencias'],
      datasets: [{
        data: [parseInt(qcsData.qcs_quejas)||80, parseInt(qcsData.qcs_consultas)||4, parseInt(qcsData.qcs_sugerencias)||76],
        backgroundColor: [danger+'cc', info+'cc', lime+'cc'],
        borderRadius: 6,
      }],
    }, { ...defaults, scales: { y: { beginAtZero: true } } });

    // Finanzas gauge-like bar
    const finData = Graph.loadLocal('Finanzas', pKey) || {};
    const budget = parseInt(finData.budget_opex_capex) || 7371476;
    const actual = parseInt(finData.actual_opex_capex) || 0;
    buildChart('chartFinanzas', 'bar', {
      labels: ['Budget 2026', 'Actual'],
      datasets: [{
        data: [budget, actual],
        backgroundColor: [info + 'aa', actual > budget ? danger + 'cc' : green + 'cc'],
        borderRadius: 6,
      }],
    }, {
      ...defaults,
      scales: { y: { beginAtZero: true, ticks: { callback: v => '$'+v.toLocaleString('es-PY') } } },
      plugins: { ...defaults.plugins, tooltip: { callbacks: { label: ctx => '$' + ctx.raw.toLocaleString('es-PY') + ' USD' } } },
    });

    // Distribución departamentos horizontal bar (top 6)
    const deptos = ['Concepción','Asunción','Central','San Pedro','Alto Paraná','Amambay'];
    const deptVals = [746, 37, 65, 52, 24, 33]; // from DATA_EXPORT, feb/2026
    buildChart('chartDepto', 'bar', {
      labels: deptos,
      datasets: [{ data: deptVals, backgroundColor: green + 'cc', borderRadius: 4 }],
    }, {
      ...defaults,
      indexAxis: 'y',
      scales: { x: { beginAtZero: true } },
    });
  }

  function buildChart(id, type, data, options) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    // Destroy previous if exists
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    new Chart(canvas, { type, data, options });
  }

  function changePeriod() {
    const mes = parseInt(document.getElementById('dashPeriodMes').value);
    const anio = parseInt(document.getElementById('dashPeriodAnio').value);
    setPeriodoActivo(anio, mes);
    document.getElementById('sidebarPeriod').textContent = formatPeriodo({ anio, mes });
    App.navigate('dashboard');
  }

  return { render, changePeriod };
})();
