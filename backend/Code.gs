
/**
 * Promet Onboarding · Apps Script backend
 * Crea un Spreadsheet con las pestañas requeridas y pega esta codebase.
 * Deploy → New deployment → Web app → Access: Anyone with the link
 */

const SHEETS = {
  PERSONAS: 'Personas',
  REG_FORMADOR: 'Reg_Formador',
  REG_PART: 'Reg_Participante',
  ASISTENCIA: 'Asistencia',
  CHAMPION: 'Champion_Aseo',
  BANCO: 'Banco_Preguntas',
  PRUEBA_RES: 'Pruebas_Respuestas',
  PRUEBA_TOT: 'Pruebas_Resultados'
};

const TOKENS = {
  participante: 'PART2025',
  formador: 'FORM2025!',
  champion: 'CHAMP2025!'
};
const HOTELES = ['Calama','Colbún','Coya','Engie','Fidelia','Mejillones'];

function doGet(e){
  try{
    const route = (e.parameter.route || '').toLowerCase();
    if(route === 'quiz.questions'){
      const dia = e.parameter.dia || 'D5';
      return json(quizQuestions(dia));
    }
    return json({ok:true, ping:'pong'});
  }catch(err){
    return json({ok:false, error:String(err)}, 500);
  }
}

function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents);
    const route = (body.route || '').toLowerCase();
    switch(route){
      case 'participante.submit': assertToken(body.k,'participante'); return json(participanteSubmit(body.data));
      case 'formador.submit': assertToken(body.k,'formador'); return json(formadorSubmit(body.data));
      case 'champion.submit': assertToken(body.k,'champion'); return json(championSubmit(body.data));
      case 'quiz.submit': assertToken(body.k,'participante'); return json(quizSubmit(body.data));
      default: throw new Error('Ruta no soportada.');
    }
  }catch(err){
    return json({ok:false, error:String(err)}, 500);
  }
}

/* Helpers */
function json(obj, code){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function assertToken(k, rol){
  if(k !== TOKENS[rol]) throw new Error('Acceso denegado (token).');
}

function isValidRUT(rut){
  var re=/^[0-9]{7,8}-[0-9Kk]$/;
  if(!re.test(rut)) return false;
  var parts=rut.split('-'), num=parts[0], dv=parts[1].toUpperCase();
  var suma=0, m=2;
  for(var i=num.length-1;i>=0;i--){ suma += parseInt(num[i],10)*m; m=(m===7)?2:m+1; }
  var res=11-(suma%11);
  var dvCalc=(res===11)?'0':(res===10?'K':String(res));
  return dvCalc===dv;
}

function assertHotel(h){
  if(HOTELES.indexOf(h)===-1) throw new Error('Hotel inválido.');
}

function sh(name){
  const ss = SpreadsheetApp.getActive();
  const s = ss.getSheetByName(name);
  if(!s) throw new Error('Falta la pestaña: '+name);
  return s;
}

function headersIndex(vals){
  const idx={};
  vals[0].forEach((h,i)=>idx[h]=i);
  return idx;
}

function participanteSubmit(d){
  const {mod, nombre, cargo, rut, hotel, e1, e2, e3, lo_mejor, a_mejorar} = d;
  if(!isValidRUT(rut)) throw new Error('RUT inválido.');
  assertHotel(hotel);
  const s = sh(SHEETS.REG_PART);
  s.appendRow([new Date(), mod, hotel, rut, nombre, cargo, e1, e2, e3, lo_mejor, a_mejorar, getIp(), getUA()]);
  return {ok:true};
}

function formadorSubmit(d){
  const {mod, formador, fecha, hotel, rut_formador, participantes, comentarios} = d;
  if(rut_formador && !isValidRUT(rut_formador)) throw new Error('RUT formador inválido');
  assertHotel(hotel);
  sh(SHEETS.REG_FORMADOR).appendRow([new Date(), mod, fecha, hotel, formador, rut_formador||'', JSON.stringify(participantes||[]), comentarios||'', getIp(), getUA()]);
  // expandir asistencia
  const as = sh(SHEETS.ASISTENCIA);
  (participantes||[]).forEach(p=>{
    const rutp = p.rut||'';
    if(rutp && !isValidRUT(rutp)) throw new Error('RUT participante inválido en asistencia: '+rutp);
    as.appendRow([new Date(), mod, hotel, rutp, p.nombre||'', p.cargo||'', formador, fecha]);
  });
  return {ok:true};
}

function championSubmit(d){
  const {mod, champion, fecha, hotel, rut, nombre, cargo, fase, nota, comentarios} = d;
  if(!isValidRUT(rut)) throw new Error('RUT inválido');
  assertHotel(hotel);
  const s = sh(SHEETS.CHAMPION);
  const temaCols = ['t1','t2','t3','t4','t5'].map(k=>d[k]||'');
  // gobernanza Diagnóstico→Evaluación por (rut,mod)
  if(fase && fase.indexOf('Evaluación')===0){
    if(!existeDiagnostico(rut, hotel, mod)){
      throw new Error('Primero registra el Diagnóstico para este día antes de la Evaluación.');
    }
    if(!(nota && Number(nota)>=1 && Number(nota)<=7)){
      throw new Error('Nota 1–7 requerida en Evaluación.');
    }
  }else{
    if(nota) throw new Error('En Diagnóstico no se ingresa nota.');
  }
  s.appendRow([new Date(), mod, hotel, rut, nombre, cargo, champion, fecha, (fase||''), (nota||''), ...temaCols, comentarios||'', getIp(), getUA()]);
  return {ok:true};
}

function existeDiagnostico(rut, hotel, mod){
  const s = sh(SHEETS.CHAMPION);
  const vals = s.getDataRange().getValues();
  const idx = headersIndex(vals);
  for(let i=1;i<vals.length;i++){
    const v=vals[i];
    if(String(v[idx['rut']]).toUpperCase()===rut.toUpperCase() &&
       String(v[idx['hotel']])===hotel &&
       String(v[idx['mod']])===mod &&
       String(v[idx['fase']]).indexOf('Diagnóstico')===0){
      return true;
    }
  }
  return false;
}

/* Quiz */
function quizQuestions(dia){
  const s = sh(SHEETS.BANCO);
  const vals = s.getDataRange().getValues();
  const idx = headersIndex(vals);
  const out=[];
  for(let i=1;i<vals.length;i++){
    const v=vals[i];
    if(String(v[idx['dia']])===dia){
      out.push({
        id: String(v[idx['id_pregunta']]),
        enunciado: String(v[idx['enunciado']]),
        alt_a: String(v[idx['alt_a']]),
        alt_b: String(v[idx['alt_b']]),
        alt_c: String(v[idx['alt_c']]),
        alt_d: String(v[idx['alt_d']])
      });
    }
  }
  return {ok:true, questions: out};
}

function quizSubmit(d){
  const {rut, hotel, dia, answers} = d;
  if(!isValidRUT(rut)) throw new Error('RUT inválido');
  assertHotel(hotel);
  // Elegibilidad: asistencia D1, D2, D3
  if(!asistioPrimerosTres(rut, hotel)) throw new Error('Para rendir la prueba debes haber asistido a D1, D2 y D3.');
  // get correct answers
  const s = sh(SHEETS.BANCO);
  const vals = s.getDataRange().getValues(); const idx=headersIndex(vals);
  const correct=new Map();
  for(let i=1;i<vals.length;i++){
    const v=vals[i];
    if(String(v[idx['dia']])===dia){
      correct.set(String(v[idx['id_pregunta']]), String(v[idx['respuesta_correcta']]).toUpperCase());
    }
  }
  let score=0,total=0;
  const det = sh(SHEETS.PRUEBA_RES);
  answers.forEach(a=>{
    const corr = (correct.get(String(a.id))||'').toUpperCase();
    const ok = (String(a.ans||'').toUpperCase()===corr);
    if(corr){ total++; if(ok) score++; }
    det.appendRow([new Date(), rut, hotel, dia, String(a.id), String(a.ans||''), corr, ok?1:0]);
  });
  const percent = total? (score/total*100):0;
  sh(SHEETS.PRUEBA_TOT).appendRow([new Date(), rut, hotel, dia, score, total, percent]);
  return {ok:true, score, total, percent};
}

function asistioPrimerosTres(rut, hotel){
  const s = sh(SHEETS.ASISTENCIA);
  const vals = s.getDataRange().getValues();
  if(vals.length<2) return false;
  const idx=headersIndex(vals);
  const req = new Set(['D1','D2','D3']);
  for(let i=1;i<vals.length;i++){
    const v=vals[i];
    if(String(v[idx['rut_participante']]).toUpperCase()===rut.toUpperCase() &&
       String(v[idx['hotel']])===hotel &&
       req.has(String(v[idx['mod_id']]))){
      req.delete(String(v[idx['mod_id']]));
    }
    if(req.size===0) return true;
  }
  return false;
}

/* Utils */
function getIp(){ try{return Session.getActiveUserLocale()||'';}catch(e){return '';} }
function getUA(){ try{return UrlFetchApp.getRequest('')['headers']||'';}catch(e){return '';} }

/* One-time initializer to create headers (run once) */
function initSheets(){
  const ss = SpreadsheetApp.getActive();
  const ensure=(name, headers)=>{
    let s = ss.getSheetByName(name);
    if(!s) s = ss.insertSheet(name);
    if(s.getLastRow()===0) s.appendRow(headers);
  };
  ensure(SHEETS.PERSONAS, ['rut','nombre','cargo','hotel','cohorte','rol']);
  ensure(SHEETS.REG_FORMADOR, ['timestamp','mod','fecha','hotel','formador','rut_formador','participantes_json','comentarios','ip','ua']);
  ensure(SHEETS.REG_PART, ['timestamp','mod','hotel','rut','nombre','cargo','e_presentacion','e_claridad','e_lugar','lo_mejor','a_mejorar','ip','ua']);
  ensure(SHEETS.ASISTENCIA, ['timestamp','mod_id','hotel','rut_participante','nombre','cargo','formador','fecha']);
  ensure(SHEETS.CHAMPION, ['timestamp','mod','hotel','rut','nombre','cargo','champion','fecha','fase','nota','t1','t2','t3','t4','t5','comentarios','ip','ua']);
  ensure(SHEETS.BANCO, ['id_pregunta','dia','modulo','enunciado','alt_a','alt_b','alt_c','alt_d','respuesta_correcta','puntaje']);
  ensure(SHEETS.PRUEBA_RES, ['timestamp','rut','hotel','dia','id_pregunta','respuesta','correcta','ok']);
  ensure(SHEETS.PRUEBA_TOT, ['timestamp','rut','hotel','dia','puntaje','total','porcentaje']);
}
