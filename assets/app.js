/* Promet Onboarding · utilidades front */

(function(global){
  const CONFIG = {
    API_URL: (global.PROMET && global.PROMET.CONFIG && global.PROMET.CONFIG.API_URL) || "", // override en HTML
    HOTELES: ["Calama","Colbún","Coya","Engie","Fidelia","Mejillones"],
    TOKENS: { participante:"PART2025", formador:"FORM2025!", champion:"CHAMP2025!" },
    MOD_TITLES: {
      D1:"Inducción General",
      D2:"Inducción Hotel",
      D3:"Cultura de Servicio y Seguridad",
      D4:"Funciones y Competencias rol Aux. Aseo / Mucama",
      D5:"Prueba de Contenidos"
    },
    // Temas por día para Champion (Aux. Aseo / Mucama)
    CHAMP_TOPICS: {
      D1: [
        "Presentación del hotel y recorrido general",
        "Presentación del equipo (supervisor, mantención, recepción, bodega)",
        "Explicación de horarios, zonas de trabajo y puntos de reunión",
        "Revisión y entrega de EPP y uniforme",
        "Reglas básicas de seguridad y convivencia"
      ],
      D2: [
        "Apertura segura de habitación",
        "Preparación del carro de limpieza",
        "Orden lógico de trabajo (habitación→baño)",
        "Uso de productos y seguridad química",
        "Cierre de habitación limpia (control visual final)"
      ],
      D3: [
        "Uso de guantes y químicos",
        "Reposición de amenities",
        "Reposición de frigobar (si aplica)",
        "Control de stock y comunicación con bodega",
        "Limpieza del baño (lavamanos, WC, ducha, espejos, pisos)"
      ],
      D4: [
        "Diferencias: huésped nuevo vs salida",
        "Protocolo de revisión en Check Out (olvidos, reportes)",
        "Preparación para Check In",
        "Comunicación con recepción y supervisor (estado habitación)",
        "Revisión de tiempos estándar y trato al huésped"
      ]
    }
  };

  function renderHoteles(selectEl){
    if(!selectEl) return;
    selectEl.innerHTML = `<option value="">Selecciona hotel</option>` +
      CONFIG.HOTELES.map(h=>`<option>${h}</option>`).join("");
  }

  function validarRUT(rut){
    // 14122472-7, sin puntos
    return /^[0-9]{7,8}-[0-9Kk]$/.test(String(rut||"").trim());
  }

  // API fetch (evita preflight CORS → text/plain)
  async function apiPost(route, payload){
    const url = (global.PROMET && global.PROMET.CONFIG && global.PROMET.CONFIG.API_URL) || CONFIG.API_URL;
    if(!url) throw new Error("API_URL no definida. (override HTML o app.js)");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ route, ...payload })
    });
    if(!res.ok) throw new Error(await res.text() || ('HTTP '+res.status));
    return res.json();
  }

  // DOM helpers (escala 1..7)
  function renderScale7(name, host){
    if(!host) return;
    host.innerHTML = [1,2,3,4,5,6,7].map(n =>
      `<label><input type="radio" name="${name}" value="${n}" required><span class="dot">${n}</span></label>`
    ).join("");
  }

  // Expose
  global.PROMET = global.PROMET || {};
  global.PROMET.CONFIG = Object.assign({}, CONFIG, global.PROMET.CONFIG||{});
  global.PROMET.renderHoteles = renderHoteles;
  global.PROMET.validarRUT = validarRUT;
  global.PROMET.apiPost = apiPost;
  global.PROMET.renderScale7 = renderScale7;

  console.log("[PROMET] app.js cargado. API_URL:", (global.PROMET.CONFIG.API_URL||"(override pendiente)"));
})(window);
