
# Promet Onboarding (MVP)

Stack simple: **HTML estático** + **Google Apps Script + Google Sheets**.

## Estructura
- `index.html` → selector de **Rol** y **Módulo**.
- `participante.html` → satisfacción por módulo (1–7). **RUT + hotel obligatorios**.
- `formador.html` → registra clase y **expande asistencia** (por participante).
- `champion-aseo.html` → Tutorías D1..D5 con **Diagnóstico → Evaluación (nota 1–7)**.
- `prueba.html` → **Prueba D5** (elegible si asistió a D1–D3).
- `dashboard.html` → esqueleto para KPIs.
- `assets/styles.css` → variables CSS de paleta Promet (reemplazar hex).
- `assets/app.js` → utilidades, validaciones y llamadas API.
- `backend/Code.gs` → pega en Apps Script, deploy como **Web App**.

## Tokens por rol (URL/QR)
- Participante: `PART2025`
- Formador: `FORM2025!`
- Champion: `CHAMP2025!`

**Ejemplos:**
- `participante.html?mod=D1&k=PART2025`
- `formador.html?mod=D1&k=FORM2025!`
- `champion-aseo.html?mod=D2&k=CHAMP2025!`
- `prueba.html?mod=D5&k=PART2025`

## RUT
Formato **obligatorio**: `14122472-7` (sin puntos, con guion y dígito K/0–9). Validación en front y backend.

## Hotel (obligatorio)
Opciones: Calama, Colbún, Coya, Engie, Fidelia, Mejillones.

## Pasos de instalación
1) Crea un **Google Sheet** vacío.
2) Abre **Extensions → Apps Script**, crea proyecto y pega **`backend/Code.gs`**.
3) Ejecuta `initSheets()` **una vez** para crear pestañas y cabeceras.
4) **Deploy → Web app → Anyone with the link → Copy URL**.
5) En `assets/app.js`, reemplaza `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` por la URL (termina en `/exec`).
6) Abre `index.html` localmente o publica con GitHub Pages. Usa las URLs con `?k=...` según rol.

## Banco de preguntas (D5)
Rellena la pestaña `Banco_Preguntas` con columnas:  
`id_pregunta, dia, modulo, enunciado, alt_a, alt_b, alt_c, alt_d, respuesta_correcta, puntaje`

## Notas
- La **prueba** sólo permite envío si `Asistencia` contiene registros para **D1, D2 y D3** del mismo `rut` + `hotel`.
- El Champion no puede registrar **Evaluación** si no existe **Diagnóstico** previo para ese **rut+hotel+día**.
- Formador: si ingresas RUT de participantes, se enlaza la asistencia con la prueba y evaluaciones.
