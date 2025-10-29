
/**
 * Importador de preguntas para Banco_Preguntas
 * Agregar este archivo al mismo proyecto de Apps Script donde está Code.gs
 * Requiere que la hoja 'Banco_Preguntas' exista con cabeceras:
 * id_pregunta, dia, modulo, enunciado, alt_a, alt_b, alt_c, alt_d, respuesta_correcta, puntaje
 */

function onOpen(){
  SpreadsheetApp.getUi()
    .createMenu('Promet')
    .addItem('Importar preguntas (pegar texto)', 'openImportDialog')
    .addItem('Ejemplo de formato', 'showFormatExample')
    .addToUi();
}

function openImportDialog(){
  var html = HtmlService.createHtmlOutputFromFile('import_preguntas')
    .setTitle('Importar preguntas D5')
    .setWidth(520);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showFormatExample(){
  var example =
'P1) ¿Cuál es el procedimiento correcto para el cierre de una habitación?\\n'+
'A) Apagar luces y cerrar puerta\\n'+
'B) Verificar control visual final, retirar carro y cerrar puerta\\n'+
'C) Cambiar ropa de cama solamente\\n'+
'D) Revisar frigobar\\n'+
'Correcta: B\\n\\n'+
'P2) Seleccione el orden lógico del trabajo:\\n'+
'A) Baño → habitación\\n'+
'B) Habitación → baño\\n'+
'C) Cocina → baño\\n'+
'D) Recepción → habitación\\n'+
'Correcta: B\\n';
  SpreadsheetApp.getUi().alert('FORMATO DE EJEMPLO:\\n\\n'+example);
}

/**
 * Recibe un bloque de texto con preguntas en el siguiente formato:
 * P1) Enunciado... 
 * A) alternativa A
 * B) alternativa B
 * C) alternativa C
 * D) alternativa D
 * Correcta: B
 *
 * Las preguntas se separan por una o más líneas en blanco.
 * Todas se insertan con dia='D5' (puedes cambiarlo en la UI).
 */
function importQuestionsFromText(payload){
  var dia = payload.dia || 'D5';
  var modulo = payload.modulo || 'Prueba D5';
  var text = payload.text || '';
  var rows = parseQuestionBlock(text, dia, modulo);
  if(!rows.length) throw new Error('No se encontraron preguntas en el texto.');
  var sh = SpreadsheetApp.getActive().getSheetByName('Banco_Preguntas');
  var last = sh.getLastRow();
  sh.getRange(last+1, 1, rows.length, rows[0].length).setValues(rows);
  return {ok:true, inserted: rows.length};
}

function parseQuestionBlock(text, dia, modulo){
  var blocks = text.split(/\\n\\s*\\n+/); // por blancos
  var out = [];
  var idBase = new Date().getTime(); // id único base
  for (var bi=0; bi<blocks.length; bi++){
    var b = blocks[bi].trim();
    if(!b) continue;
    var lines = b.split(/\\n/).map(function(s){return s.trim();}).filter(String);
    // Primera línea: "P1) enunciado" o "1) enunciado"
    var enunciado = lines[0]||'';
    enunciado = enunciado.replace(/^P?\\s*\\d+\\)\\s*/i,'').trim();
    var A = takeLine(lines, /^A\\)/i);
    var B = takeLine(lines, /^B\\)/i);
    var C = takeLine(lines, /^C\\)/i);
    var D = takeLine(lines, /^D\\)/i);
    var corrLine = '';
    for (var li=0; li<lines.length; li++){ if(/^Correcta:/i.test(lines[li])){ corrLine = lines[li]; break; } }
    var correcta = (corrLine.split(':')[1]||'').trim().toUpperCase();
    if(!enunciado || !A || !B || !C || !D || !/^[ABCD]$/.test(correcta)){
      continue; // bloque inválido
    }
    var id = 'Q'+(idBase+bi);
    out.push([id, dia, modulo, enunciado, A, B, C, D, correcta, 1]);
  }
  return out;
}

function takeLine(lines, rx){
  for(var i=0;i<lines.length;i++){
    if(rx.test(lines[i])){
      return lines[i].replace(rx,'').trim();
    }
  }
  return '';
}

// Handler para la UI
function importQuestionsFromTextHandler(formObj){
  try{
    var res = importQuestionsFromText(formObj);
    return JSON.stringify({ok:true, inserted:res.inserted});
  }catch(err){
    return JSON.stringify({ok:false, error:String(err)});
  }
}
