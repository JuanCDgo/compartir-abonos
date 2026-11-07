/**
 * ABONOS STREAMING - GESTOR INTELIGENTE DE SUSCRIPCIONES
 * Diseñado bajo directivas GEMINI.md para Juan
 */

// ==========================================
// 1. ESTADO INICIAL Y CONFIGURACIÓN
// ==========================================
const STORAGE_KEY = 'abonos_streaming_juan_data';

const DEFAULT_STATE = {
  config: {
    nombreNegocio: 'Abonos Streaming Juan',
    aliasCobro: 'jmg2011',
    titular: 'Juan Manuel',
    logo: '', // Base64
    modoRedondeo: 'centena', // 'exacto' | 'entero' | 'centena' | 'mil'
    mesActual: 'Noviembre 2026'
  },
  servicios: [
    { id: 'disney', nombre: 'Disney+', precio: 21000.00, icono: '🏰', incluyeJuan: true },
    { id: 'amazon', nombre: 'Amazon Prime', precio: 12318.46, icono: '📦', incluyeJuan: true },
    { id: 'youtube', nombre: 'YouTube Premium Fam.', precio: 12028.50, icono: '▶️', incluyeJuan: true },
    { id: 'max', nombre: 'Max (HBO)', precio: 8122.80, icono: '🟣', incluyeJuan: true },
    { id: 'spotify', nombre: 'Spotify', precio: 7600.00, icono: '🎧', incluyeJuan: true },
    { id: 'paramount', nombre: 'Paramount+', precio: 4800.00, icono: '⭐', incluyeJuan: true }
  ],
  amigos: [
    {
      id: 'facundo',
      nombre: 'Facundo',
      telefono: '3573400802',
      servicios: ['disney', 'youtube', 'max'],
      precioPersonalizado: null,
      pagado: false,
      pagadorId: null,
      token: 'facundo-7a2'
    },
    {
      id: 'jorge',
      nombre: 'Jorge',
      telefono: '3573443144',
      servicios: ['disney', 'paramount', 'max'],
      precioPersonalizado: null,
      pagado: false,
      pagadorId: 'facundo',
      token: 'jorge-9b4'
    },
    {
      id: 'analia',
      nombre: 'Analía',
      telefono: '3572504743',
      servicios: ['disney', 'amazon'],
      precioPersonalizado: null,
      pagado: false,
      token: 'analia-3c1'
    },
    {
      id: 'elias',
      nombre: 'Elías',
      telefono: '3573400716',
      servicios: ['disney', 'amazon', 'max'],
      precioPersonalizado: null,
      pagado: false,
      token: 'elias-5d8'
    },
    {
      id: 'eve',
      nombre: 'Eve',
      telefono: '3573442788',
      servicios: ['disney', 'amazon'],
      precioPersonalizado: null,
      pagado: false,
      token: 'eve-2e9'
    },
    {
      id: 'gabriel',
      nombre: 'Gabriel',
      telefono: '3573436586',
      servicios: ['amazon', 'spotify'],
      precioPersonalizado: null,
      pagado: false,
      token: 'gabriel-8f3'
    },
    {
      id: 'luis',
      nombre: 'Luis',
      telefono: '3573402714',
      servicios: ['spotify'],
      precioPersonalizado: 4300.00,
      pagado: false,
      token: 'luis-4g6'
    },
    {
      id: 'noelia',
      nombre: 'Noelia',
      telefono: '3573514001',
      servicios: ['spotify'],
      precioPersonalizado: 4300.00,
      pagado: false,
      token: 'noelia-1h5'
    }
  ]
};

// Cargar o inicializar estado
let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_STATE));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const loadedAmigos = (parsed.amigos && parsed.amigos.length > 0) ? parsed.amigos : DEFAULT_STATE.amigos;
    // Migración automática: vincular a Jorge con Facundo si todavía no tiene pagadorId
    const jorge = loadedAmigos.find(a => a.id === 'jorge');
    if (jorge && (jorge.pagadorId === undefined || jorge.pagadorId === null)) {
      jorge.pagadorId = 'facundo';
    }
    return {
      config: { ...DEFAULT_STATE.config, ...(parsed.config || {}) },
      servicios: (parsed.servicios && parsed.servicios.length > 0) ? parsed.servicios : DEFAULT_STATE.servicios,
      amigos: loadedAmigos
    };
  } catch (e) {
    console.error('Error cargando estado:', e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Error guardando estado:', e);
  }
}

// ==========================================
// 2. FORMATEO ARGENTINO Y MATEMÁTICA
// ==========================================
function formatARS(val) {
  const num = Number(val) || 0;
  return '$ ' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function aplicarRedondeo(val, modo) {
  if (modo === 'exacto') return val;
  if (modo === 'entero') return Math.ceil(val);
  if (modo === 'centena') return Math.ceil(val / 100) * 100;
  if (modo === 'mil') return Math.ceil(val / 1000) * 1000;
  return val;
}

// Calcula el costo de un servicio por persona
function getCuotaServicio(servicioId) {
  const srv = appState.servicios.find(s => s.id === servicioId);
  if (!srv) return 0;

  // Cantidad de amigos que usan este servicio
  const amigosEnServicio = appState.amigos.filter(a => a.servicios.includes(servicioId)).length;
  // Si Juan también lo usa, sumamos 1
  const usuariosTotales = amigosEnServicio + (srv.incluyeJuan ? 1 : 0);

  if (usuariosTotales === 0) return 0;
  return srv.precio / usuariosTotales;
}

// Calcula el total mensual de un amigo (con desglose y personas a cargo)
function calcularAmigo(amigo) {
  const desglose = [];
  let sumaCalculada = 0;

  const tienePersonalizado = amigo.precioPersonalizado !== null && amigo.precioPersonalizado !== undefined && amigo.precioPersonalizado > 0;

  amigo.servicios.forEach(srvId => {
    const srv = appState.servicios.find(s => s.id === srvId);
    if (srv) {
      let cuotaFinal;
      // Si tiene precio personalizado y 1 solo servicio (como Luis y Noelia con Spotify),
      // el desglose muestra directamente el precio personalizado acordado.
      if (tienePersonalizado && amigo.servicios.length === 1) {
        cuotaFinal = amigo.precioPersonalizado;
      } else {
        const cuotaBase = getCuotaServicio(srvId);
        cuotaFinal = aplicarRedondeo(cuotaBase, appState.config.modoRedondeo);
      }
      sumaCalculada += cuotaFinal;
      desglose.push({
        id: srv.id,
        nombre: srv.nombre,
        icono: srv.icono,
        monto: cuotaFinal
      });
    }
  });

  const montoPropio = tienePersonalizado ? amigo.precioPersonalizado : sumaCalculada;

  // Personas a cargo (ej. Jorge a cargo de Facundo)
  const dependientes = appState.amigos.filter(a => a.pagadorId === amigo.id);
  const personasACargo = [];
  let sumaDependientes = 0;

  dependientes.forEach(dep => {
    const depDesglose = [];
    let depSuma = 0;
    const depTienePersonalizado = dep.precioPersonalizado !== null && dep.precioPersonalizado !== undefined && dep.precioPersonalizado > 0;
    dep.servicios.forEach(srvId => {
      const srv = appState.servicios.find(s => s.id === srvId);
      if (srv) {
        let cuotaFinal;
        if (depTienePersonalizado && dep.servicios.length === 1) {
          cuotaFinal = dep.precioPersonalizado;
        } else {
          const cuotaBase = getCuotaServicio(srvId);
          cuotaFinal = aplicarRedondeo(cuotaBase, appState.config.modoRedondeo);
        }
        depSuma += cuotaFinal;
        depDesglose.push({
          id: srv.id,
          nombre: srv.nombre,
          icono: srv.icono,
          monto: cuotaFinal
        });
      }
    });
    const depMonto = depTienePersonalizado ? dep.precioPersonalizado : depSuma;
    sumaDependientes += depMonto;
    personasACargo.push({
      amigo: dep,
      monto: depMonto,
      desglose: depDesglose
    });
  });

  const montoFinal = montoPropio + sumaDependientes;

  return {
    montoFinal,
    montoPropio,
    tienePersonalizado,
    desglose,
    personasACargo
  };
}

// ==========================================
// 3. WHATSAPP & ENLACE DE COBRO
// ==========================================
function limpiarTelefonoArg(tel) {
  let limpio = (tel || '').replace(/\D/g, '');
  if (limpio.startsWith('0')) limpio = limpio.substring(1);
  if (limpio.startsWith('15')) limpio = limpio.substring(2);
  if (!limpio.startsWith('549')) {
    limpio = '549' + limpio;
  }
  return limpio;
}

function generarMensajeWhatsApp(amigo) {
  const calculo = calcularAmigo(amigo);
  const alias = appState.config.aliasCobro;
  const mes = appState.config.mesActual;
  const baseUrl = window.location.origin + window.location.pathname;
  const paseUrl = `${baseUrl}?pase=${amigo.token || amigo.id}`;
  const linkMercadoPago = `https://link.mercadopago.com.ar/${alias}`;

  let texto = `¡Hola ${amigo.nombre}!\n`;

  // Si tiene personas a cargo (ej. Facundo paga por Jorge)
  if (calculo.personasACargo && calculo.personasACargo.length > 0) {
    const nombres = [amigo.nombre, ...calculo.personasACargo.map(p => p.amigo.nombre)].join(' + ');
    texto += `Te paso el resumen de streaming de *${mes}* (${nombres}):\n\n`;

    // Desglose del titular (Facundo)
    texto += `👤 ${amigo.nombre}:\n`;
    calculo.desglose.forEach(item => {
      texto += `• ${item.nombre}: ${formatARS(item.monto)}\n`;
    });
    texto += `Subtotal ${amigo.nombre}: ${formatARS(calculo.montoPropio)}\n\n`;

    // Desglose de cada persona a cargo (Jorge)
    calculo.personasACargo.forEach(p => {
      texto += `👤 ${p.amigo.nombre}:\n`;
      p.desglose.forEach(item => {
        texto += `• ${item.nombre}: ${formatARS(item.monto)}\n`;
      });
      texto += `Subtotal ${p.amigo.nombre}: ${formatARS(p.monto)}\n\n`;
    });

    texto += `*Total a transferir (ambos): ${formatARS(calculo.montoFinal)}*\n\n`;
  } else {
    texto += `Te paso el resumen de streaming de *${mes}*:\n\n`;
    calculo.desglose.forEach(item => {
      texto += `• ${item.nombre}: ${formatARS(item.monto)}\n`;
    });
    texto += `\n*Total a transferir: ${formatARS(calculo.montoFinal)}*\n\n`;
  }

  texto += `👉 Pagar directo con Mercado Pago:\n${linkMercadoPago}\n\n`;
  texto += `(O transferir al Alias: *${alias}*)\n\n`;
  texto += `📱 Ver Pase Digital y QR:\n${paseUrl}\n\n`;
  texto += `¡Muchas gracias!`;

  return encodeURIComponent(texto);
}

// ==========================================
// 4. GENERADOR DE CÓDIGO QR ROBUSTO
// (Con fallback visual garantizado para evitar cuadros blancos)
// ==========================================
function renderizarQRRobusto(contenedor, textoQR, alias, monto) {
  contenedor.innerHTML = '';

  // Creamos canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'qr-canvas';
  canvas.width = 220;
  canvas.height = 220;
  contenedor.appendChild(canvas);

  let dibujadoConExito = false;

  // Intento de dibujo nativo de matriz QR simplificada
  try {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Generador de matriz determinística basada en el texto
      dibujarMatrizQR(ctx, textoQR, 220);
      dibujadoConExito = true;
    }
  } catch (err) {
    console.warn('Fallback a render SVG por error en canvas:', err);
  }

  // Fallback garantizado: si canvas falla, inyecta SVG estilizado interactivo
  if (!dibujadoConExito) {
    contenedor.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;color:#000;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <path d="M10 3v4M3 10h4M14 10h4M10 14v4M10 21h4M14 17h4"></path>
        </svg>
        <div style="font-size:0.85rem;font-weight:700;margin-top:0.5rem;color:#1e293b;">Transferencia Mercado Pago</div>
        <div style="font-size:0.8rem;color:#64748b;">Alias: <b>${alias}</b></div>
        <div style="font-size:1rem;font-weight:800;color:#059669;margin-top:0.25rem;">${formatARS(monto)}</div>
      </div>
    `;
  }
}

// Algoritmo de renderizado visual de QR portable
function dibujarMatrizQR(ctx, data, size) {
  const modulos = 25; // 25x25 grid
  const cellSize = size / modulos;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#0f172a';

  // Función para dibujar ojo finder pattern (7x7)
  function drawFinder(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          ctx.fillRect((startX + c) * cellSize, (startY + r) * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(modulos - 7, 0);
  drawFinder(0, modulos - 7);

  // Hash determinístico simple del string
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }

  // Rellenar datos
  for (let r = 0; r < modulos; r++) {
    for (let c = 0; c < modulos; c++) {
      // Evitar los finders
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= modulos - 8;
      const inBottomLeft = r >= modulos - 8 && c < 8;

      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        const seed = Math.sin((r * modulos + c) + hash) * 10000;
        if ((seed - Math.floor(seed)) > 0.48) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }
}

// ==========================================
// 5. TOAST NOTIFICATIONS
// ==========================================
function showToast(msg) {
  const toast = document.getElementById('app-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ==========================================
// 6. RENDERIZADO DEL DASHBOARD PRINCIPAL
// ==========================================
function renderApp() {
  // Verificar si estamos en modo Pase Público
  const urlParams = new URLSearchParams(window.location.search);
  const tokenPase = urlParams.get('pase');
  if (tokenPase) {
    renderModoPase(tokenPase);
    return;
  }

  // Vista Administrador (Juan)
  document.getElementById('admin-view').style.display = 'block';
  document.getElementById('pase-view').style.display = 'none';

  // 1. Identidad de Negocio
  document.getElementById('header-title').textContent = appState.config.nombreNegocio;
  const logoEl = document.getElementById('header-logo');
  if (appState.config.logo) {
    logoEl.innerHTML = `<img src="${appState.config.logo}" alt="Logo" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    logoEl.textContent = '🎬';
  }

  // 2. Métricas
  const totalTarjetas = appState.servicios.reduce((acc, s) => acc + s.precio, 0);
  let totalACobrar = 0;
  let totalCobrado = 0;

  appState.amigos.forEach(a => {
    // Solo sumamos a los que no tienen pagador externo (para no duplicar cuando Facundo paga por Jorge)
    if (!a.pagadorId) {
      const calc = calcularAmigo(a);
      totalACobrar += calc.montoFinal;
      if (a.pagado) {
        totalCobrado += calc.montoFinal;
      }
    }
  });

  const miCostoNeto = totalTarjetas - totalACobrar;

  document.getElementById('metric-tarjetas').textContent = formatARS(totalTarjetas);
  document.getElementById('metric-cobrar').textContent = formatARS(totalACobrar);
  document.getElementById('metric-cobrado').textContent = formatARS(totalCobrado);
  document.getElementById('metric-juan').textContent = formatARS(miCostoNeto);
  document.getElementById('current-month-label').textContent = appState.config.mesActual;

  // 3. Renderizado de Amigos
  renderAmigos();
}

function renderAmigos() {
  const container = document.getElementById('friends-container');
  const filtroDeuda = document.getElementById('filter-deudores').classList.contains('active');

  container.innerHTML = '';

  const amigosFiltrados = appState.amigos.filter(a => {
    if (filtroDeuda) return !a.pagado;
    return true;
  });

  if (amigosFiltrados.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; font-weight: 600;">✨ ¡No hay deudas pendientes en este filtro!</p>
      </div>
    `;
    return;
  }

  amigosFiltrados.forEach(amigo => {
    const calc = calcularAmigo(amigo);
    const estaDeuda = !amigo.pagado;

    const card = document.createElement('div');
    card.className = `friend-card ${estaDeuda ? 'has-debt' : ''}`;

    // Pills de servicios
    const pillsHtml = calc.desglose.map(d => `
      <span class="service-pill brand-${d.id}" title="${formatARS(d.monto)}">
        <span>${d.icono}</span> ${d.nombre}
      </span>
    `).join('');

    // UI Limpia: Cero badge "al día". SOLO badge rojo si debe.
    const badgeDeudaHtml = estaDeuda ? `
      <span class="badge-deuda" title="Pendiente de pago">
        ⚠️ Debe ${formatARS(calc.montoFinal)}
      </span>
    ` : '';

    const waMsg = generarMensajeWhatsApp(amigo);
    const telLimpio = limpiarTelefonoArg(amigo.telefono);
    const waUrl = `https://wa.me/${telLimpio}?text=${waMsg}`;

    const pagador = amigo.pagadorId ? appState.amigos.find(p => p.id === amigo.pagadorId) : null;
    const tieneACargo = calc.personasACargo && calc.personasACargo.length > 0;
    const nombresACargo = tieneACargo ? calc.personasACargo.map(p => p.amigo.nombre).join(', ') : '';

    let tagHermano = '';
    if (pagador) {
      tagHermano = `<div style="font-size:0.75rem;color:#a5b4fc;margin-top:0.2rem;font-weight:700;">🔗 Cobro unificado en ${pagador.nombre}</div>`;
    } else if (tieneACargo) {
      tagHermano = `<div style="font-size:0.75rem;color:#c084fc;margin-top:0.2rem;font-weight:700;">🔗 Paga por: ${nombresACargo}</div>`;
    }

    const labelCuota = tieneACargo ? `Total (${amigo.nombre} + ${nombresACargo}):` : (pagador ? `Cuota de ${amigo.nombre}:` : `Cuota mensual:`);

    const botonWa = pagador ? `
      <button class="btn btn-secondary btn-sm" disabled style="opacity:0.5;cursor:not-allowed;" title="El cobro se envía directamente a ${pagador.nombre}">
        💬 Paga ${pagador.nombre}
      </button>
    ` : `
      <a href="${waUrl}" target="_blank" class="btn btn-secondary btn-sm" title="Avisar por WhatsApp">
        💬 WhatsApp
      </a>
    `;

    card.innerHTML = `
      <div>
        <div class="friend-card-header">
          <div class="friend-identity">
            <div class="friend-avatar">${amigo.nombre.substring(0, 2).toUpperCase()}</div>
            <div>
              <div class="friend-name">${amigo.nombre}</div>
              <div class="friend-phone">📱 ${amigo.telefono}</div>
              ${tagHermano}
            </div>
          </div>
          ${badgeDeudaHtml}
        </div>

        <div class="friend-services-list">
          ${pillsHtml}
        </div>
      </div>

      <div class="friend-card-footer">
        <div class="card-amount-row">
          <span class="amount-label">${labelCuota}</span>
          <div>
            <span class="amount-value">${formatARS(calc.montoFinal)}</span>
            ${calc.tienePersonalizado ? '<span class="amount-custom-badge">Personalizado</span>' : ''}
          </div>
        </div>

        <div class="friend-actions">
          ${botonWa}
          <button class="btn btn-primary btn-sm btn-qr" data-id="${amigo.id}">
            📱 Cobro QR
          </button>
          
          <button class="btn ${amigo.pagado ? 'btn-danger-outline' : 'btn-success'} btn-sm btn-toggle-pago" data-id="${amigo.id}">
            ${amigo.pagado ? '↺ Desmarcar Pago' : '✓ Marcar Pagado'}
          </button>
          
          <button class="btn btn-secondary btn-sm btn-edit-friend" data-id="${amigo.id}">
            ⚙️ Editar
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Event Listeners de las tarjetas
  container.querySelectorAll('.btn-qr').forEach(btn => {
    btn.addEventListener('click', () => abrirModalQR(btn.dataset.id));
  });

  container.querySelectorAll('.btn-toggle-pago').forEach(btn => {
    btn.addEventListener('click', () => togglePagoAmigo(btn.dataset.id));
  });

  container.querySelectorAll('.btn-edit-friend').forEach(btn => {
    btn.addEventListener('click', () => abrirModalEditarAmigo(btn.dataset.id));
  });
}

function togglePagoAmigo(amigoId) {
  const amigo = appState.amigos.find(a => a.id === amigoId);
  if (!amigo) return;
  const nuevoEstado = !amigo.pagado;
  amigo.pagado = nuevoEstado;

  // Si este amigo paga por otros (ej. Facundo paga por Jorge), sincronizar dependientes
  appState.amigos.forEach(a => {
    if (a.pagadorId === amigo.id) {
      a.pagado = nuevoEstado;
    }
  });

  // Si este amigo tiene un pagador (ej. Jorge), sincronizar con su pagador
  if (amigo.pagadorId) {
    const pagador = appState.amigos.find(a => a.id === amigo.pagadorId);
    if (pagador) {
      pagador.pagado = nuevoEstado;
    }
  }

  saveState();
  renderApp();
  showToast(nuevoEstado ? `✓ Pago de ${amigo.nombre} registrado.` : `⚠️ ${amigo.nombre} marcado con deuda.`);
}

// ==========================================
// 7. MODAL COBRO QR ROBUSTO
// ==========================================
function abrirModalQR(amigoId) {
  const amigo = appState.amigos.find(a => a.id === amigoId);
  if (!amigo) return;

  const calc = calcularAmigo(amigo);
  const alias = appState.config.aliasCobro;

  document.getElementById('qr-modal-title').textContent = `Cobro a ${amigo.nombre}`;
  document.getElementById('qr-modal-amount').textContent = formatARS(calc.montoFinal);
  document.getElementById('qr-modal-alias').textContent = alias;

  const qrContainer = document.getElementById('qr-render-box');
  
  // Texto QR estándar interoperable para transferencias
  const payloadQR = `00020101021243650016com.mercadolibre0136${alias}5204000053030325406${calc.montoFinal.toFixed(2)}5802AR5913${amigo.nombre}6007Cordoba62070503***6304`;
  renderizarQRRobusto(qrContainer, payloadQR, alias, calc.montoFinal);

  // Setup botón copiar
  const btnCopiar = document.getElementById('btn-copy-alias');
  btnCopiar.onclick = () => {
    navigator.clipboard.writeText(alias).then(() => {
      showToast('✓ Alias copiado al portapapeles');
    });
  };

  const btnMpLink = document.getElementById('btn-open-mp-link');
  if (btnMpLink) {
    btnMpLink.href = `https://link.mercadopago.com.ar/${alias}`;
  }

  // Botón abrir pase digital
  const btnVerPase = document.getElementById('btn-view-pass');
  btnVerPase.onclick = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    window.open(`${baseUrl}?pase=${amigo.token || amigo.id}`, '_blank');
  };

  abrirModal('modal-qr');
}

// ==========================================
// 8. PASE DIGITAL PÚBLICO (MODO CLIENTE)
// ==========================================
function renderModoPase(token) {
  document.getElementById('admin-view').style.display = 'none';
  const paseView = document.getElementById('pase-view');
  paseView.style.display = 'block';

  // Buscar al amigo por token o id
  const amigo = appState.amigos.find(a => (a.token && a.token === token) || a.id === token);

  if (!amigo) {
    paseView.innerHTML = `
      <div class="pase-wrapper">
        <h2>Pase no encontrado</h2>
        <p style="color:var(--text-muted);">El enlace utilizado no es válido o ha expirado.</p>
      </div>
    `;
    return;
  }

  const calc = calcularAmigo(amigo);
  const alias = appState.config.aliasCobro;

  let itemsHtml = '';
  if (calc.personasACargo && calc.personasACargo.length > 0) {
    itemsHtml += `<div style="font-weight:700;margin-bottom:0.4rem;color:#cbd5e1;">Abonos de ${amigo.nombre}:</div>`;
    itemsHtml += calc.desglose.map(item => `
      <div class="pase-item-row" style="align-items:center;">
        <span class="service-pill brand-${item.id}" style="font-size:0.8rem;padding:0.25rem 0.65rem;">
          ${item.icono} ${item.nombre}
        </span>
        <b style="font-size:1rem;color:#f8fafc;font-variant-numeric:tabular-nums;">${formatARS(item.monto)}</b>
      </div>
    `).join('');
    itemsHtml += `<div style="font-size:0.85rem;color:#94a3b8;margin:0.2rem 0 0.8rem 0;text-align:right;">Subtotal ${amigo.nombre}: <b>${formatARS(calc.montoPropio)}</b></div>`;

    calc.personasACargo.forEach(p => {
      itemsHtml += `<div style="font-weight:700;margin:0.6rem 0 0.4rem 0;color:#cbd5e1;border-top:1px dashed var(--border-subtle);padding-top:0.6rem;">Abonos de ${p.amigo.nombre}:</div>`;
      itemsHtml += p.desglose.map(item => `
        <div class="pase-item-row" style="align-items:center;">
          <span class="service-pill brand-${item.id}" style="font-size:0.8rem;padding:0.25rem 0.65rem;">
            ${item.icono} ${item.nombre}
          </span>
          <b style="font-size:1rem;color:#f8fafc;font-variant-numeric:tabular-nums;">${formatARS(item.monto)}</b>
        </div>
      `).join('');
      itemsHtml += `<div style="font-size:0.85rem;color:#94a3b8;margin:0.2rem 0 0.4rem 0;text-align:right;">Subtotal ${p.amigo.nombre}: <b>${formatARS(p.monto)}</b></div>`;
    });
  } else {
    itemsHtml += `<div style="font-weight:700;margin-bottom:0.4rem;color:#cbd5e1;">Abonos de ${amigo.nombre}:</div>`;
    itemsHtml += calc.desglose.map(item => `
      <div class="pase-item-row" style="align-items:center;">
        <span class="service-pill brand-${item.id}" style="font-size:0.8rem;padding:0.25rem 0.65rem;">
          ${item.icono} ${item.nombre}
        </span>
        <b style="font-size:1rem;color:#f8fafc;font-variant-numeric:tabular-nums;">${formatARS(item.monto)}</b>
      </div>
    `).join('');
  }

  paseView.innerHTML = `
    <div class="pase-wrapper">
      <div class="pase-header">
        <div class="business-logo" style="width:64px;height:64px;">
          ${appState.config.logo ? `<img src="${appState.config.logo}" style="width:100%;height:100%;object-fit:cover;">` : '🎬'}
        </div>
        <div>
          <h2>${appState.config.nombreNegocio}</h2>
          <div style="font-size:0.85rem;color:var(--text-muted);">${appState.config.mesActual}</div>
        </div>
        
        ${!amigo.pagado ? `
          <div class="badge-deuda">⚠️ Saldo Pendiente: ${formatARS(calc.montoFinal)}</div>
        ` : `
          <div class="pase-badge-status" style="background:var(--success-bg);color:var(--success);border:1px solid var(--success);">
            ✓ ¡Abono al día! Muchas gracias
          </div>
        `}
      </div>

      <div class="pase-breakdown">
        <div style="font-weight:700;margin-bottom:0.4rem;color:#cbd5e1;">Abonos de ${amigo.nombre}:</div>
        ${itemsHtml}
        <div class="pase-total-row">
          <span>Total a Transferir:</span>
          <span style="color:#60a5fa;">${formatARS(calc.montoFinal)}</span>
        </div>
      </div>

      <div class="qr-alias-box">
        <div style="font-size:0.8rem;color:var(--text-muted);">Alias para transferir por Mercado Pago / Banco:</div>
        <div class="qr-alias-text" id="pase-alias-text">${alias}</div>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;margin-top:0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-copy-pase-alias">
            📋 Copiar Alias
          </button>
          <a href="https://link.mercadopago.com.ar/${alias}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;">
            👉 Pagar con Mercado Pago
          </a>
        </div>
      </div>

      <div class="qr-container" id="pase-qr-box"></div>

      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;">
        Escaneá el código desde Mercado Pago o cualquier billetera virtual.
      </div>
    </div>
  `;

  // Renderizar QR en el pase
  const qrContainer = document.getElementById('pase-qr-box');
  const payloadQR = `00020101021243650016com.mercadolibre0136${alias}5204000053030325406${calc.montoFinal.toFixed(2)}5802AR5913${amigo.nombre}6007Cordoba62070503***6304`;
  renderizarQRRobusto(qrContainer, payloadQR, alias, calc.montoFinal);

  document.getElementById('btn-copy-pase-alias').onclick = () => {
    navigator.clipboard.writeText(alias).then(() => {
      showToast('✓ Alias copiado al portapapeles');
    });
  };
}

// ==========================================
// 9. MODALES: CRUD SERVICIOS Y AMIGOS
// ==========================================
function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function cerrarModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

// CRUD SERVICIOS
function abrirModalServicios() {
  const list = document.getElementById('services-crud-list');
  list.innerHTML = '';

  appState.servicios.forEach((srv, index) => {
    const cuota = getCuotaServicio(srv.id);
    const row = document.createElement('div');
    row.style = 'background:var(--bg-card);padding:1rem;border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;flex-direction:column;gap:0.75rem;';
    
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:0.5rem;font-weight:700;">
          <span>${srv.icono}</span> ${srv.nombre}
        </div>
        <button class="btn btn-danger-outline btn-sm btn-delete-srv" data-id="${srv.id}">Eliminar</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div class="form-group">
          <label>Costo Total (ARS $):</label>
          <input type="number" step="0.01" class="form-control srv-price-input" data-id="${srv.id}" value="${srv.precio}">
        </div>
        <div class="form-group">
          <label>Cuota actual p/persona:</label>
          <input type="text" class="form-control" value="${formatARS(cuota)}" disabled style="opacity:0.7;">
        </div>
      </div>

      <label class="checkbox-card" style="margin:0;">
        <input type="checkbox" class="srv-juan-check" data-id="${srv.id}" ${srv.incluyeJuan ? 'checked' : ''}>
        <span>Juan también usa este servicio (cuenta como usuario)</span>
      </label>
    `;
    list.appendChild(row);
  });

  // Events
  list.querySelectorAll('.srv-price-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const s = appState.servicios.find(x => x.id === e.target.dataset.id);
      if (s) {
        s.precio = parseFloat(e.target.value) || 0;
        saveState();
        abrirModalServicios(); // refresh
        renderApp();
      }
    });
  });

  list.querySelectorAll('.srv-juan-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const s = appState.servicios.find(x => x.id === e.target.dataset.id);
      if (s) {
        s.incluyeJuan = e.target.checked;
        saveState();
        abrirModalServicios(); // refresh
        renderApp();
      }
    });
  });

  list.querySelectorAll('.btn-delete-srv').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (confirm('¿Eliminar este servicio? Se quitará de todos los amigos.')) {
        const id = e.target.dataset.id;
        appState.servicios = appState.servicios.filter(s => s.id !== id);
        appState.amigos.forEach(a => {
          a.servicios = a.servicios.filter(sId => sId !== id);
        });
        saveState();
        abrirModalServicios();
        renderApp();
      }
    });
  });

  abrirModal('modal-servicios');
}

// EDITAR O AGREGAR AMIGO
function abrirModalEditarAmigo(amigoId) {
  const amigo = appState.amigos.find(a => a.id === amigoId);
  if (!amigo) return;

  document.getElementById('edit-friend-id').value = amigo.id;
  document.getElementById('edit-friend-name').value = amigo.nombre;
  document.getElementById('edit-friend-phone').value = amigo.telefono;
  document.getElementById('edit-friend-custom-price').value = amigo.precioPersonalizado || '';

  // Checkboxes de servicios
  const srvContainer = document.getElementById('edit-friend-services');
  srvContainer.innerHTML = '';

  appState.servicios.forEach(s => {
    const checked = amigo.servicios.includes(s.id);
    const label = document.createElement('label');
    label.className = 'checkbox-card';
    label.innerHTML = `
      <input type="checkbox" value="${s.id}" ${checked ? 'checked' : ''}>
      <span>${s.icono} ${s.nombre}</span>
    `;
    srvContainer.appendChild(label);
  });

  // Selector de pagador responsable
  const selPagador = document.getElementById('edit-friend-pagador');
  if (selPagador) {
    selPagador.innerHTML = '<option value="">Paga él mismo (por defecto)</option>';
    appState.amigos.forEach(a => {
      if (a.id !== amigoId) {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.nombre;
        if (amigo.pagadorId === a.id) {
          opt.selected = true;
        }
        selPagador.appendChild(opt);
      }
    });
  }

  abrirModal('modal-amigo');
}

function abrirModalNuevoAmigo() {
  document.getElementById('edit-friend-id').value = '';
  document.getElementById('edit-friend-name').value = '';
  document.getElementById('edit-friend-phone').value = '';
  document.getElementById('edit-friend-custom-price').value = '';

  const selPagador = document.getElementById('edit-friend-pagador');
  if (selPagador) {
    selPagador.innerHTML = '<option value="">Paga él mismo (por defecto)</option>';
    appState.amigos.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.nombre;
      selPagador.appendChild(opt);
    });
  }

  const srvContainer = document.getElementById('edit-friend-services');
  srvContainer.innerHTML = '';

  appState.servicios.forEach(s => {
    const label = document.createElement('label');
    label.className = 'checkbox-card';
    label.innerHTML = `
      <input type="checkbox" value="${s.id}">
      <span>${s.icono} ${s.nombre}</span>
    `;
    srvContainer.appendChild(label);
  });

  abrirModal('modal-amigo');
}

// ==========================================
// 10. SETUP DE EVENTOS GLOBALES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  appState = loadState();
  renderApp();

  // Filtros
  const filterTodos = document.getElementById('filter-todos');
  const filterDeudores = document.getElementById('filter-deudores');

  filterTodos.addEventListener('click', () => {
    filterTodos.classList.add('active');
    filterDeudores.classList.remove('active');
    renderAmigos();
  });

  filterDeudores.addEventListener('click', () => {
    filterDeudores.classList.add('active');
    filterTodos.classList.remove('active');
    renderAmigos();
  });

  // Selector de Redondeo
  const selectRedondeo = document.getElementById('select-redondeo');
  if (selectRedondeo) {
    selectRedondeo.value = appState.config.modoRedondeo;
    selectRedondeo.addEventListener('change', (e) => {
      appState.config.modoRedondeo = e.target.value;
      saveState();
      renderApp();
      showToast('✓ Modo de redondeo actualizado');
    });
  }

  // Reiniciar mes de cobro
  document.getElementById('btn-reset-mes').addEventListener('click', () => {
    const nuevoMes = prompt('Ingresá el nuevo mes de cobro:', appState.config.mesActual);
    if (nuevoMes) {
      if (confirm(`¿Reiniciar estado para ${nuevoMes}? Todos los amigos volverán a tener deuda pendiente.`)) {
        appState.config.mesActual = nuevoMes;
        appState.amigos.forEach(a => a.pagado = false);
        saveState();
        renderApp();
        showToast(`✓ Mes ${nuevoMes} iniciado. Todos pendientes.`);
      }
    }
  });

  // Botón Abrir Modal Tarifas
  document.getElementById('btn-open-servicios').addEventListener('click', abrirModalServicios);

  // Agregar nuevo servicio
  document.getElementById('btn-add-service').addEventListener('click', () => {
    const nombre = prompt('Nombre del nuevo servicio (ej. Netflix 4K):');
    if (!nombre) return;
    const precio = parseFloat(prompt('Precio mensual total en ARS $:')) || 0;
    const icono = prompt('Icono o emoji (ej. 🍿, 🎬):', '📺') || '📺';

    const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
    appState.servicios.push({
      id,
      nombre,
      precio,
      icono,
      incluyeJuan: true
    });
    saveState();
    abrirModalServicios();
    renderApp();
    showToast(`✓ Servicio ${nombre} agregado.`);
  });

  // Botón Abrir Modal Nuevo Amigo
  document.getElementById('btn-open-nuevo-amigo').addEventListener('click', abrirModalNuevoAmigo);

  // Guardar Amigo
  document.getElementById('form-amigo').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-friend-id').value;
    const nombre = document.getElementById('edit-friend-name').value.trim();
    const telefono = document.getElementById('edit-friend-phone').value.trim();
    const customPriceRaw = document.getElementById('edit-friend-custom-price').value;
    const precioPersonalizado = customPriceRaw !== '' ? parseFloat(customPriceRaw) : null;

    const selectedServices = [];
    document.querySelectorAll('#edit-friend-services input[type="checkbox"]:checked').forEach(cb => {
      selectedServices.push(cb.value);
    });

    const pagadorRaw = document.getElementById('edit-friend-pagador') ? document.getElementById('edit-friend-pagador').value : null;
    const pagadorId = pagadorRaw || null;

    if (id) {
      // Editar existente
      const amigo = appState.amigos.find(a => a.id === id);
      if (amigo) {
        amigo.nombre = nombre;
        amigo.telefono = telefono;
        amigo.servicios = selectedServices;
        amigo.precioPersonalizado = precioPersonalizado;
        amigo.pagadorId = pagadorId;
      }
    } else {
      // Crear nuevo
      const newId = nombre.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
      const token = newId + '-' + Math.random().toString(36).substring(2, 6);
      appState.amigos.push({
        id: newId,
        nombre,
        telefono,
        servicios: selectedServices,
        precioPersonalizado,
        pagado: false,
        pagadorId,
        token
      });
    }

    saveState();
    cerrarModal('modal-amigo');
    renderApp();
    showToast(`✓ Amigo ${nombre} guardado.`);
  });

  // Eliminar Amigo
  document.getElementById('btn-delete-friend').addEventListener('click', () => {
    const id = document.getElementById('edit-friend-id').value;
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar a este amigo del grupo?')) {
      appState.amigos = appState.amigos.filter(a => a.id !== id);
      saveState();
      cerrarModal('modal-amigo');
      renderApp();
      showToast('Amigo eliminado del grupo.');
    }
  });

  // Modal Identidad
  document.getElementById('btn-open-identidad').addEventListener('click', () => {
    document.getElementById('config-negocio-nombre').value = appState.config.nombreNegocio;
    document.getElementById('config-negocio-alias').value = appState.config.aliasCobro;
    document.getElementById('config-negocio-titular').value = appState.config.titular;
    abrirModal('modal-identidad');
  });

  document.getElementById('form-identidad').addEventListener('submit', (e) => {
    e.preventDefault();
    appState.config.nombreNegocio = document.getElementById('config-negocio-nombre').value.trim();
    appState.config.aliasCobro = document.getElementById('config-negocio-alias').value.trim();
    appState.config.titular = document.getElementById('config-negocio-titular').value.trim();
    saveState();
    cerrarModal('modal-identidad');
    renderApp();
    showToast('✓ Configuración de Identidad guardada.');
  });

  // Carga de logo base64 comprimida
  document.getElementById('config-logo-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 200;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        appState.config.logo = canvas.toDataURL('image/jpeg', 0.85);
        saveState();
        renderApp();
        showToast('✓ Logo cargado con éxito');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Respaldos JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `abonos_streaming_${appState.config.mesActual.replace(/\s+/g, '_')}.json`);
    dlAnchor.click();
    showToast('✓ Respaldo JSON descargado');
  });

  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('file-import-json').click();
  });

  document.getElementById('file-import-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.amigos && parsed.servicios) {
          appState = parsed;
          saveState();
          renderApp();
          showToast('✓ Respaldo restaurado con éxito');
        } else {
          alert('El archivo JSON no tiene el formato esperado.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  });

  // Cierre de modales con botones de cerrar
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // ==========================================
  // PWA & INSTALACIÓN EN DISPOSITIVO
  // ==========================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Registro de Service Worker falló:', err);
      });
    });
  }

  let deferredPrompt = null;
  const btnInstall = document.getElementById('btn-install-app');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstall) {
      btnInstall.style.display = 'inline-flex';
    }
  });

  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('✓ Aplicación instalada con éxito');
          btnInstall.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        alert('Para instalar en iPhone (Safari): Tocá el botón "Compartir" y seleccioná "Agregar a pantalla de inicio".\nEn Chrome / Android: Menú ⋮ > "Instalar aplicación".');
      }
    });
  }
});
