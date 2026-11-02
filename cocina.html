<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitor de Cocina - KDS</title>
  
  <!-- Seguridad y Estilos -->
  <script src="auth.js"></script>
  <link rel="stylesheet" href="cocina.css">
</head>
<body>

  <header>
    <div style="display: flex; align-items: center;">
      <h1>👨‍🍳 Monitor de Cocina</h1>
      <select id="select-cocinero" class="cocinero-select" onchange="cambiarCocinero()">
        <option value="">Cargando cocineros...</option>
      </select>
    </div>
    <div style="display: flex; align-items: center; gap: 15px;">
      <div class="connection-status" style="display: flex; align-items: center; gap: 8px;">
        <div class="dot" id="status-dot" style="width:10px; height:10px; border-radius:50%; background:#e74c3c;"></div>
        <span id="status-text">Esperando...</span>
      </div>
      <div class="clock" id="reloj">00:00:00</div>
      <button class="btn-salir" onclick="cerrarSesionCocina()">🚪 Salir</button>
    </div>
  </header>

  <div class="grid-pedidos" id="contenedor-pedidos">
    <div class="mensaje-inicial" id="mensaje-inicial">⬆️ Selecciona tu nombre en la parte superior para cargar los pedidos ⬆️</div>
  </div>
  
  <div class="empty-state" id="empty-state" style="display: none;">
    <h2>¡Todo al día! 🍕</h2>
    <p>No hay pedidos pendientes en este momento.</p>
  </div>

  <div class="modal-overlay" id="modal-detalles" onclick="cerrarModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2 id="modal-ticket">Ticket</h2>
        <button class="btn-cerrar" onclick="document.getElementById('modal-detalles').style.display='none'">×</button>
      </div>
      <div class="modal-body">
        <div class="detalle-grupo">
          <h3>🛒 PRODUCTOS A PREPARAR</h3>
          <ul class="detalle-lista" id="modal-productos"></ul>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          <div class="detalle-grupo">
            <h3>⏰ HORA</h3>
            <p id="modal-hora"></p>
          </div>
          <div class="detalle-grupo">
            <h3>📦 TIPO</h3>
            <p id="modal-tipo" style="font-weight: bold; color: #f1c40f;"></p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const SUPABASE_URL = 'https://afarkzyxssgcpmnquqdp.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYXJrenl4c3NnY3BtbnF1cWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzI2NTUsImV4cCI6MjEwODcwODY1NX0.J7gSycaeum0bUzx9tss5OM4WfPUt5BswqxnSEI0RgiY';

    let pedidosGlobal = [];
    let miNombre = localStorage.getItem('cocina_nombre') || '';
    let intervaloCarga = null;

    // 🔥 SOLUCIÓN AL PARPADEO: Todo se ejecuta cuando el DOM está listo
    document.addEventListener('DOMContentLoaded', async () => {
      
      // 1. Verificamos la sesión de forma segura
      if (typeof AuthGuard === 'undefined') {
        console.error("AuthGuard no está definido. Redirigiendo...");
        window.location.href = 'admin.html';
        return;
      }

      const session = AuthGuard.getSession();
      if (!session || !session.token || (session.rol !== 'admin' && session.rol !== 'cocina')) {
        // Si no hay sesión, mandamos al login (UNA SOLA VEZ)
        window.location.href = 'admin.html';
        return;
      }

      // 2. Si la sesión es válida, arrancamos la app
      await cargarCocinerosDesdeBD();
      const select = document.getElementById('select-cocinero');
      
      if (miNombre) {
        const existe = Array.from(select.options).some(opt => opt.value === miNombre);
        if (existe) {
          select.value = miNombre;
          iniciarCarga();
        } else {
          select.value = "";
          localStorage.removeItem('cocina_nombre');
          miNombre = "";
        }
      }

      // 3. Iniciamos el reloj
      setInterval(() => { document.getElementById('reloj').textContent = new Date().toLocaleTimeString('es-ES'); }, 1000);
    });

    async function cargarCocinerosDesdeBD() {
      const select = document.getElementById('select-cocinero');
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?select=nombre,rol&rol=eq.cocina&order=nombre.asc`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        if (!res.ok) throw new Error('Error al leer perfiles');
        const perfiles = await res.json();
        let html = '<option value="">-- Selecciona tu nombre --</option>';
        perfiles.forEach(p => { if (p.nombre && p.nombre.trim() !== '') html += `<option value="${p.nombre}">${p.nombre}</option>`; });
        select.innerHTML = html;
      } catch (error) {
        select.innerHTML = `<option value="">Error de conexión</option>`;
      }
    }

    function cerrarSesionCocina() {
      localStorage.removeItem('cocina_nombre');
      AuthGuard.logout(); 
    }

    function cambiarCocinero() {
      const select = document.getElementById('select-cocinero');
      const nuevoNombre = select.value;
      if (!nuevoNombre) {
        miNombre = "";
        localStorage.removeItem('cocina_nombre');
        if (intervaloCarga) clearInterval(intervaloCarga);
        document.getElementById('contenedor-pedidos').innerHTML = '<div class="mensaje-inicial">⬆️ Selecciona tu nombre en la parte superior para cargar los pedidos ⬆️</div>';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('status-dot').style.backgroundColor = '#e74c3c';
        document.getElementById('status-text').textContent = 'Esperando...';
        return;
      }
      miNombre = nuevoNombre;
      localStorage.setItem('cocina_nombre', miNombre);
      iniciarCarga();
    }

    function iniciarCarga() {
      const mensaje = document.getElementById('mensaje-inicial');
      if (mensaje) mensaje.remove();
      obtenerPedidos();
      if (intervaloCarga) clearInterval(intervaloCarga);
      intervaloCarga = setInterval(obtenerPedidos, 10000);
    }

    async function obtenerPedidos() {
      if (!miNombre) return;
      try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/pedidos?select=*&estado=in.(Pagado,Pendiente,En preparación)&order=fecha.asc', {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
        });
        if (!response.ok) throw new Error('Error de red');
        const pedidos = await response.json();
        document.getElementById('status-dot').style.backgroundColor = '#27ae60';
        document.getElementById('status-text').textContent = 'Conectado';
        pedidosGlobal = pedidos.filter(p => !p.cocinero || p.cocinero === miNombre);
        renderizarPedidos(pedidosGlobal);
      } catch (error) {
        document.getElementById('status-dot').style.backgroundColor = '#e74c3c';
        document.getElementById('status-text').textContent = 'Desconectado';
      }
    }

    function esc(txt) { return String(txt == null ? '' : txt).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    function renderizarPedidos(pedidos) {
      const contenedor = document.getElementById('contenedor-pedidos');
      const emptyState = document.getElementById('empty-state');
      if (pedidos.length === 0) { contenedor.innerHTML = ''; emptyState.style.display = 'flex'; return; }
      emptyState.style.display = 'none';
      
      contenedor.innerHTML = pedidos.map(p => {
        const esMio = p.cocinero === miNombre;
        const esDeOtro = p.cocinero && p.cocinero !== miNombre;
        let claseBorde = esMio ? 'en-preparacion' : (esDeOtro ? 'ocupado' : '');
        const hora = p.fecha ? new Date(p.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}) : '--:--';
        const items = p.detalle ? p.detalle.split(',').map(item => `<li>🔸 ${esc(item.trim())}</li>`).join('') : '';

        let botonera = '';
        if (esDeOtro) {
          botonera = `<button class="btn-accion btn-bloqueado" style="flex:2;">Lo prepara ${esc(p.cocinero)}</button><button class="btn-accion" style="flex:1; background:#3498db;" onclick="imprimirComanda('${esc(p.order_id)}', event)">🖨️</button>`;
        } else if (esMio) {
          botonera = `<button class="btn-accion btn-terminar" style="flex:2;" onclick="cambiarEstado('${esc(p.order_id)}', 'Listo', event)">✅ TERMINADO</button><button class="btn-accion" style="flex:1; background:#3498db;" onclick="imprimirComanda('${esc(p.order_id)}', event)">🖨️</button>`;
        } else {
          botonera = `<button class="btn-accion btn-empezar" style="flex:2;" onclick="tomarPedido('${esc(p.order_id)}', event)">▶ PREPARAR</button><button class="btn-accion" style="flex:1; background:#3498db;" onclick="imprimirComanda('${esc(p.order_id)}', event)">🖨️</button>`;
        }

        return `
          <div class="tarjeta ${claseBorde}" onclick="abrirModal('${esc(p.order_id)}')">
            <div class="tarjeta-header">
              <div><h2>${esc(p.order_id)}</h2><div class="hora">Llegada: ${hora}</div></div>
              ${p.cocinero ? `<div style="font-size:0.8rem; background:#3498db; padding:2px 8px; border-radius:4px;">${esc(p.cocinero)}</div>` : ''}
            </div>
            <div class="tarjeta-body"><ul class="lista-detalles">${items}</ul></div>
            <div class="tarjeta-footer" onclick="event.stopPropagation()">${botonera}</div>
          </div>`;
      }).join('');
    }

    async function imprimirComanda(orderId, event) {
      if (event) event.stopPropagation();
      const pedido = pedidosGlobal.find(p => p.order_id === orderId);
      if (!pedido) return;
      const hora = pedido.fecha ? new Date(pedido.fecha).toLocaleString('es-ES') : '--:--';
      const items = pedido.detalle ? pedido.detalle.split(',').map(i => `<p style="margin: 4px 0; font-size: 14px;">${esc(i.trim())}</p>`).join('') : '';
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`<html><head><title>Comanda ${esc(orderId)}</title><style>body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; color: #000; } h2 { text-align: center; font-size: 16px; margin-bottom: 5px; } .hora { text-align: center; font-size: 12px; margin-bottom: 15px; } .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 10px; } .footer { text-align: center; font-size: 10px; margin-top: 20px; }</style></head><body><h2>COMANDA COCINA</h2><div class="hora">Ticket: <strong>${esc(orderId)}</strong></div><div class="hora">Hora: ${hora}</div><div class="items">${items}</div><div class="footer">--- FIN DE COMANDA ---</div></body></html>`);
      doc.close();
      setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => { document.body.removeChild(iframe); }, 1000); }, 500);
    }

    async function tomarPedido(orderId, event) {
      if (event) event.stopPropagation();
      if (!miNombre) return;
      pedidosGlobal = pedidosGlobal.map(p => p.order_id === orderId ? { ...p, estado: 'En preparación', cocinero: miNombre } : p);
      renderizarPedidos(pedidosGlobal);
      try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/pedidos?order_id=eq.' + encodeURIComponent(orderId), {
          method: 'PATCH', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ estado: 'En preparación', cocinero: miNombre })
        });
        if (!response.ok) throw new Error('Error al actualizar');
      } catch (error) { alert('Error al tomar el pedido. Revisa tu conexión.'); obtenerPedidos(); }
    }

    async function cambiarEstado(orderId, nuevoEstado, event) {
      if (event) event.stopPropagation();
      pedidosGlobal = pedidosGlobal.filter(p => p.order_id !== orderId);
      renderizarPedidos(pedidosGlobal);
      try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/pedidos?order_id=eq.' + encodeURIComponent(orderId), {
          method: 'PATCH', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        if (!response.ok) throw new Error('Error al actualizar');
      } catch (error) { alert('Error al guardar.'); obtenerPedidos(); }
    }

    function abrirModal(orderId) {
      const pedido = pedidosGlobal.find(p => p.order_id === orderId);
      if (!pedido) return;
      const hora = pedido.fecha ? new Date(pedido.fecha).toLocaleString('es-ES') : '--:--';
      document.getElementById('modal-ticket').textContent = esc(pedido.order_id);
      document.getElementById('modal-hora').textContent = hora;
      const esEnvio = pedido.direccion && pedido.direccion.trim() !== '' && pedido.direccion.toLowerCase() !== 'recogida en tienda';
      document.getElementById('modal-tipo').textContent = esEnvio ? 'PARA LLEVAR 🛵' : 'RECOGER EN TIENDA 🏪';
      const items = pedido.detalle ? pedido.detalle.split(',').map(item => `<li>${esc(item.trim())}</li>`).join('') : '<li>Sin detalle</li>';
      document.getElementById('modal-productos').innerHTML = items;
      document.getElementById('modal-detalles').style.display = 'flex';
    }

    function cerrarModal(event) { if (event.target.id === 'modal-detalles') document.getElementById('modal-detalles').style.display = 'none'; }
  </script>
</body>
</html>
