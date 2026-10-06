import { CALCULATORS } from './calculators.js';

const calculatorDefs = {
  wetWall: {
    label: 'Pared húmeda',
    hint: 'Ladrillos + mortero',
    fields: [
      num('length', 'Largo de pared', 5, 'm'),
      num('height', 'Alto de pared', 2.6, 'm'),
      num('openingsArea', 'Aberturas totales', 0, 'm²'),
      select('blockType', 'Tipo de ladrillo', 'brickCeramic18', [
        ['brickCeramic8', 'Cerámico hueco 8 cm'], ['brickCeramic12', 'Cerámico hueco 12 cm'], ['brickCeramic18', 'Cerámico hueco 18 cm']
      ]),
      num('wastePercent', 'Desperdicio', 7, '%'),
      checkbox('includePlaster', 'Incluir revoque en ambas caras', false)
    ]
  },
  drywall: {
    label: 'Pared seca',
    hint: 'Placas + perfiles',
    fields: [
      num('length', 'Largo de pared', 5, 'm'),
      num('height', 'Alto de pared', 2.6, 'm'),
      num('openingsArea', 'Aberturas totales', 0, 'm²'),
      select('studSpacing', 'Separación de montantes', 0.4, [[0.4, '40 cm'], [0.48, '48 cm'], [0.6, '60 cm']]),
      num('wastePercent', 'Desperdicio', 10, '%'),
      checkbox('includeInsulation', 'Incluir aislación interior', true)
    ]
  },
  steelFrame: {
    label: 'Steel Frame',
    hint: 'PGC/PGU + placas',
    fields: [
      num('length', 'Largo de pared', 8, 'm'),
      num('height', 'Alto de pared', 2.6, 'm'),
      num('openingsArea', 'Aberturas totales', 0, 'm²'),
      num('openingCount', 'Cantidad de aberturas', 0, 'u'),
      num('openingWidthTotal', 'Ancho total de aberturas', 0, 'm'),
      select('studSpacing', 'Separación de montantes', 0.4, [[0.4, '40 cm'], [0.48, '48 cm'], [0.6, '60 cm']]),
      select('panelPreferred', 'Ancho de panel preferido', 3, [[2, '2,00 m'], [2.5, '2,50 m'], [3, '3,00 m'], [3.5, '3,50 m'], [4, '4,00 m']]),
      num('profileLength', 'Largo comercial de perfiles', 6, 'm'),
      num('wastePercent', 'Reserva / desperdicio', 7, '%'),
      checkbox('includeOsb', 'Incluir OSB exterior + membrana', true),
      checkbox('includeDrywall', 'Incluir placa de yeso interior', true),
      checkbox('includeInsulation', 'Incluir aislación interior', true)
    ]
  },
  ceiling: {
    label: 'Cielorraso',
    hint: 'Placas + perfilería',
    fields: [
      num('length', 'Largo', 4, 'm'),
      num('width', 'Ancho', 5, 'm'),
      select('profileSpacing', 'Separación de perfiles', 0.4, [[0.4, '40 cm'], [0.48, '48 cm']]),
      num('wastePercent', 'Desperdicio', 10, '%')
    ]
  },
  fence: {
    label: 'Cerco',
    hint: 'Tejido + postes',
    fields: [
      num('length', 'Longitud total', 40, 'm'),
      num('gateWidth', 'Ancho de portón/entrada', 4, 'm'),
      num('postSpacing', 'Separación entre postes', 2.5, 'm'),
      num('wastePercent', 'Desperdicio', 5, '%')
    ]
  },
  counterfloor: {
    label: 'Contrapiso',
    hint: 'Cemento + áridos',
    fields: [
      num('length', 'Largo', 5, 'm'),
      num('width', 'Ancho', 4, 'm'),
      num('thicknessCm', 'Espesor', 8, 'cm'),
      num('wastePercent', 'Desperdicio', 8, '%')
    ]
  },
  pool: {
    label: 'Pileta',
    hint: 'Mampostería + revestimiento',
    fields: [
      num('length', 'Largo interior', 8, 'm'),
      num('width', 'Ancho interior', 4, 'm'),
      num('minDepth', 'Profundidad mínima', 1.2, 'm'),
      num('maxDepth', 'Profundidad máxima', 1.8, 'm'),
      num('workMargin', 'Margen de excavación', 0.5, 'm'),
      num('wastePercent', 'Desperdicio', 10, '%')
    ]
  }
};

function num(name, label, value, suffix) { return { type: 'number', name, label, value, suffix }; }
function select(name, label, value, options) { return { type: 'select', name, label, value, options }; }
function checkbox(name, label, value) { return { type: 'checkbox', name, label, value }; }

const $ = (selector) => document.querySelector(selector);
const els = {
  nav: $('#calculatorNav'), form: $('#calculatorForm'), title: $('#calculatorTitle'), projectName: $('#projectName'),
  metrics: $('#metrics'), body: $('#materialsBody'), assumptions: $('#assumptions'), total: $('#grandTotal'),
  save: $('#saveProjectBtn'), saved: $('#savedProjects'), fresh: $('#newProjectBtn'), export: $('#exportBtn'), print: $('#printBtn')
};

let currentType = 'wetWall';
let currentResult = null;
let prices = JSON.parse(localStorage.getItem('corralones:prices') || '{}');

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

function renderNav() {
  els.nav.innerHTML = Object.entries(calculatorDefs).map(([key, def]) => `
    <button class="nav-btn ${key === currentType ? 'active' : ''}" data-type="${key}" type="button">
      ${def.label}<small>${def.hint}</small>
    </button>`).join('');
  els.nav.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => selectCalculator(btn.dataset.type)));
}

function renderForm(values = {}) {
  const def = calculatorDefs[currentType];
  els.title.textContent = def.label;
  els.form.innerHTML = def.fields.map(field => {
    const val = values[field.name] ?? field.value;
    if (field.type === 'checkbox') {
      return `<div class="checkbox-field full"><input id="${field.name}" name="${field.name}" type="checkbox" ${val ? 'checked' : ''}><label for="${field.name}">${field.label}</label></div>`;
    }
    if (field.type === 'select') {
      return `<label class="field"><span>${field.label}</span><select name="${field.name}">${field.options.map(([v,l]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
    }
    return `<label class="field"><span>${field.label} (${field.suffix})</span><input name="${field.name}" type="number" step="any" min="0" value="${val}"></label>`;
  }).join('');
  els.form.addEventListener('input', calculate);
  calculate();
}

function formValues() {
  const data = {};
  for (const field of calculatorDefs[currentType].fields) {
    const el = els.form.elements.namedItem(field.name);
    if (!el) throw new Error(`No se encontró el campo "${field.name}" en el formulario.`);
    if (field.type === 'checkbox') data[field.name] = el.checked;
    else if (field.type === 'select') data[field.name] = isNaN(Number(el.value)) ? el.value : Number(el.value);
    else data[field.name] = Number(el.value);
  }
  return data;
}

function calculate() {
  currentResult = CALCULATORS[currentType](formValues());
  renderResult();
}

function renderResult() {
  els.metrics.innerHTML = currentResult.metrics.map(([label, value, unit]) => `
    <div class="metric"><span>${label}</span><strong>${qtyFmt.format(value)} ${unit}</strong></div>`).join('');

  els.body.innerHTML = currentResult.items.map(row => {
    const unitPrice = Number(prices[row.id] || 0);
    return `<tr>
      <td><span class="material-name">${row.label}</span><span class="material-id">${row.id}</span></td>
      <td class="number">${qtyFmt.format(row.qty)}</td>
      <td>${row.unit}</td>
      <td class="number"><input class="price-input" data-material="${row.id}" type="number" min="0" step="any" value="${unitPrice}"></td>
      <td class="number subtotal" data-subtotal="${row.id}">${money.format(row.qty * unitPrice)}</td>
    </tr>`;
  }).join('');

  els.body.querySelectorAll('.price-input').forEach(input => input.addEventListener('input', () => {
    prices[input.dataset.material] = Number(input.value || 0);
    localStorage.setItem('corralones:prices', JSON.stringify(prices));
    updateTotals();
  }));

  els.assumptions.innerHTML = `<strong>Supuestos de cálculo</strong><ul>${currentResult.assumptions.map(x => `<li>${x}</li>`).join('')}</ul>`;
  updateTotals();
}

function updateTotals() {
  let total = 0;
  currentResult.items.forEach(row => {
    const p = Number(prices[row.id] || 0);
    const subtotal = row.qty * p;
    total += subtotal;
    const cell = document.querySelector(`[data-subtotal="${row.id}"]`);
    if (cell) cell.textContent = money.format(subtotal);
  });
  els.total.textContent = money.format(total);
}

function selectCalculator(type, values = null) {
  currentType = type;
  renderNav();
  renderForm(values || {});
}

function projects() { return JSON.parse(localStorage.getItem('corralones:projects') || '[]'); }
function setProjects(value) { localStorage.setItem('corralones:projects', JSON.stringify(value)); }

function refreshSavedProjects() {
  const list = projects();
  els.saved.innerHTML = '<option value="">— Seleccionar —</option>' + list.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function saveProject() {
  const name = els.projectName.value.trim() || 'Proyecto sin nombre';
  const list = projects();
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  list.unshift({ id, name, type: currentType, values: formValues(), savedAt: new Date().toISOString() });
  setProjects(list.slice(0, 25));
  refreshSavedProjects();
  els.saved.value = id;
  els.save.textContent = 'Guardado ✓';
  setTimeout(() => els.save.textContent = 'Guardar proyecto', 1200);
}

function loadProject(id) {
  if (!id) return;
  const project = projects().find(p => p.id === id);
  if (!project) return;
  els.projectName.value = project.name;
  selectCalculator(project.type, project.values);
}

function newProject() {
  els.projectName.value = 'Proyecto sin nombre';
  els.saved.value = '';
  selectCalculator('wetWall');
}

function exportCsv() {
  const rows = [['Proyecto', els.projectName.value], ['Cálculo', currentResult.title], [], ['Material', 'Cantidad', 'Unidad', 'Precio unitario', 'Subtotal']];
  currentResult.items.forEach(row => {
    const p = Number(prices[row.id] || 0);
    rows.push([row.label, row.qty, row.unit, p, row.qty * p]);
  });
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(els.projectName.value || 'cotizacion').replace(/[^a-z0-9-_]+/gi, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

els.save.addEventListener('click', saveProject);
els.saved.addEventListener('change', e => loadProject(e.target.value));
els.fresh.addEventListener('click', newProject);
els.export.addEventListener('click', exportCsv);
els.print.addEventListener('click', () => window.print());

renderNav();
renderForm();
refreshSavedProjects();
