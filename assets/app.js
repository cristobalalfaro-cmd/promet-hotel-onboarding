
/* Global config */
const CONFIG = {
  API_URL: "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE", // <--- pega tu URL de Apps Script /exec
  HOTELES: ["Calama","Colbún","Coya","Engie","Fidelia","Mejillones"],
  TOKENS: {
    participante: "PART2025",
    formador: "FORM2025!",
    champion: "CHAMP2025!"
  }
};

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function param(name){ return new URLSearchParams(location.search).get(name); }

/* RUT validation */
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

function renderHoteles(select){
  select.innerHTML = `<option value="">Selecciona hotel</option>` +
    CONFIG.HOTELES.map(h=>`<option value="${h}">${h}</option>`).join("");
}

/* Simple POST helper */
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

function requireToken(expected){
  const k = param('k') || '';
  if(!k || k !== CONFIG.TOKENS[expected]){
    alert('Acceso denegado: token inválido para este rol.');
    throw new Error('Bad token');
  }
  return k;
}

function toJSONParticipants(container){
  const rows = qsa('.participant-row', container).map(row=>{
    return {
      nombre: qs('input[name="p_nombre"]', row).value.trim(),
      cargo: qs('input[name="p_cargo"]', row).value.trim(),
      rut: qs('input[name="p_rut"]', row).value.trim()
    };
  }).filter(p=>p.nombre || p.cargo || p.rut);
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

/* Quiz fetch */
async function fetchQuiz(dia){
  const res = await fetch(`${CONFIG.API_URL}?route=quiz.questions&dia=${encodeURIComponent(dia)}`);
  if(!res.ok) throw new Error('No se pudieron cargar las preguntas');
  return res.json(); // {ok:true, questions:[{id,enunciado,alt_a,...}]}
}
