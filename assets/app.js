/* assets/app.js — Promet Onboarding */

// === Config global ===
const CONFIG = {
  // Pega aquí tu URL de Apps Script (termina en /exec)
  API_URL: "https://script.google.com/macros/s/AKfycbz-nlterj3rCyJn8ajkmZRAVxSZEnIUElM0oPyQ3JxdUwKYwbvqM4r8rSJlLiyUJfS0/exec",

  HOTELES: ["Calama","Colbún","Coya","Engie","Fidelia","Mejillones"],

  TOKENS: {
    participante: "PART2025",
    formador: "FORM2025!",
    champion: "CHAMP2025!"
  }
};

// === Utilidades DOM/URL ===
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function param(name){ return new URLSearchParams(location.search).get(name); }

// === RUT (14122472-7) ===
function validarRUT(str){
  const re=/^[0-9]{7,8}-[0-9Kk]$/;
  if(!re.test(str)) return false;
  const [num,dv]=str.split("-");
  let suma=0, m=2;
  for(let i=num.length-1;i>=0;i--){ suma+=parseInt(num[i],10)*m; m=(m===7)?2:m+1; }
  const res=11-(suma%11);
  const dvCalc=(res===11)?"0":(res===10?"K":String(res));
  return dvCalc.toUpperCase()===dv.toUpperCase();
}

// === Hoteles ===
function renderHoteles(selectEl){
  if(!selectEl) return;
  selectEl.innerHTML = `<option value="">Selecciona hotel</option>` +
    CONFIG.HOTELES.map(h=>`<option value="${h}">${h}</option>`).join("");
}

// === HTTP helper ===
async function apiPost(route, payload){
  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({route, ...payload})
  });
  if(!res.ok){
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json();
}

// === Token por rol (URL ?k=...) ===
function requireToken(expected){
  const k = param('k') || '';
  if(!k || k !== CONFIG.TOKENS[expected]){
    alert('Acceso denegado: token inválido para este rol.');
    throw new Error('Bad token');
  }
  return k;
}

// === Participantes en Formador ===
function toJSONParticipants(container){
  if(!container) return [];
  const rows = qsa('.participant-row', container).map(row=>({
    nombre: qs('input[name="p_nombre"]', row)?.value.trim() || "",
    cargo:  qs('input[name="p_cargo"]', row)?.value.trim() || "",
    rut:    qs('input[name="p_rut"]', row)?.value.trim() || ""
  })).filter(p=>p.nombre || p.cargo || p.rut);
  return rows;
}

function addParticipantRow(container){
  const row = document.createElement('div');
  row.className='participant-row row';
  row.innerHTML = `
    <div>
      <label>Nombre y Apellido</label>
      <input name="p_nombre" placeholder="Ej: Cristóbal Alfaro">
    </div>
    <div>
      <label>Cargo</label>
      <input name="p_cargo" placeholder="Ej: Auxiliar de Aseo">
    </div>
    <div>
      <label>RUT (14122472-7)</label>
      <input name="p_rut" placeholder="14122472-7">
    </div>
    <div style="display:flex;align-items:flex-end;gap:8px">
      <button type="button" class="btn btn-ghost remove">Quitar</button>
    </div>`;
  container.appendChild(row);
  qs('.remove', row).onclick=()=>row.remove();
}

// === Prueba (preguntas) ===
async function fetchQuiz(dia){
  const res = await fetch(`${CONFIG.API_URL}?route=quiz.questions&dia=${encodeURIComponent(dia)}`);
  if(!res.ok) throw new Error('No se pudieron cargar las preguntas');
  return res.json(); // {ok:true, questions:[{id,enunciado,alt_a,...}]}
}

// ===== Fallbacks útiles (por si hay caché o bloqueos) =====

// Rellena hoteles si el select quedó vacío (puedes llamar tras renderHoteles)
function ensureHoteles(selectEl){
  if(!selectEl) return;
  if (!selectEl.options.length || selectEl.options.length === 1) {
    selectEl.innerHTML = `
      <option value="">Selecciona hotel</option>
      <option>Calama</option>
      <option>Colbún</option>
      <option>Coya</option>
      <option>Engie</option>
      <option>Fidelia</option>
      <option>Mejillones</option>
    `;
  }
}

// Forzar lectura de última versión de JS desde HTML:
// <script defer src="assets/app.js?v=2"></script>
