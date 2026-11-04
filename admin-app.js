// ==========================================
// LÓGICA PRINCIPAL DEL PANEL DE ADMINISTRACIÓN
// ==========================================

// 🔥 FRENO DE MANO PARA MÓVILES (Evita el bucle de redirección)
if (typeof AuthGuard === 'undefined') {
  if (!sessionStorage.getItem('retry_auth')) {
    sessionStorage.setItem('retry_auth', 'true');
    window.location.reload();
  } else {
    sessionStorage.removeItem('retry_auth');
    console.error("Error crítico: auth.js no se pudo cargar.");
  }
}

const SUPABASE_URL = 'https://afarkzyxssgcpmnquqdp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYXJrenl4c3NnY3BtbnF1cWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzI2NTUsImV4cCI6MjEwODcwODY1NX0.J7gSycaeum0bUzx9tss5OM4WfPUt5BswqxnSEI0RgiY';

let productosGlobal = [], slidesGlobal = [], pedidosGlobal = [], usuariosGlobal = [], paginaPedidosActual = 1;
const pedidosPorPagina = 10;

function esc(txt) { return String(txt == null ? '' : txt).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function moneda(n) { return '€' + (Number(n) || 0).toFixed(2); }
function precioNum(valor) { if (typeof valor === 'number') return isFinite(valor) ? valor : 0; let s = String(valor == null ? '' : valor).replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.indexOf(',') > -1 && s.indexOf('.') > -1) { s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); } else { s = s.replace(',', '.'); } const n = parseFloat(s); return isNaN(n) ? 0 : n; }

// 🔥 FUNCIÓN CLAVE: Usa el token del usuario para que el RLS no bloquee las acciones
async function fetchSupabase(endpoint, options = {}) {
  const session = AuthGuard.getSession();
  const token = session && session.token ? session.token : SUPABASE_ANON_KEY;
  
  const headers = { 
    'apikey': SUPABASE_ANON_KEY, 
    'Authorization': 'Bearer ' + token, 
    'Content-Type': 'application/json', 
    'Prefer': 'return=representation', 
    ...options.headers 
  };
  const res = await fetch(SUPABASE_URL + endpoint, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Error'); }
  return res.json();
}

function mostrarAlerta(mensaje, tipo = 'success') {
  const box = document.getElementById('alert-box'); box.textContent = mensaje;
  box.style.background = tipo === 'success' ? '#d4edda' : '#f8d7da';
  box.style.color = tipo === 'success' ? '#155724' : '#721c24';
  box.style.display = 'block'; setTimeout(() => { box.style.display = 'none'; }, 4000);
}

function confirmarAccion(titulo, mensaje, callback) {
  const overlay = document.createElement('div');
  overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;';
  overlay.innerHTML = `<div style="background:white;padding:30px;border-radius:12px;max-width:400px;text-align:center;"><h2 style="color:var(--primary);margin-bottom:15px;">${titulo}</h2><p style="margin-bottom:25px;color:#555;">${mensaje}</p><div style="display:flex;gap:10px;justify-content:center;"><button style="background:#95a5a6;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;" id="btn-no">Cancelar</button><button style="background:#e74c3c;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;" id="btn-si">Aceptar</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#btn-no').onclick = () => overlay.remove();
  overlay.querySelector('#btn-si').onclick = () => { overlay.remove(); callback(); };
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const btn = document.querySelector('#login-screen button');
  btn.textContent = 'Verificando...';

  try {
    const response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', { 
      method: 'POST', 
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password: pass }) 
    });
    
    if (!response.ok) throw new Error('Credenciales incorrectas');
    
    // 🔥 CAPTURAMOS EL TOKEN REAL DE SUPABASE
    const authData = await response.json(); 
    const accessToken = authData.access_token;
    
    const perfiles = await fetchSupabase(`/rest/v1/perfiles?email=eq.${email}`);
    let nombreMostrar = email, rolReal = 'empleado';
    
    if (perfiles && perfiles.length > 0) { 
      rolReal = perfiles[0].rol || 'empleado'; 
      nombreMostrar = perfiles[0].nombre || email; 
    }
    
    if (email === 'isahyles123@gmail.com') { 
      rolReal = 'admin'; 
      nombreMostrar = nombreMostrar === email ? 'Súper Admin' : nombreMostrar; 
    }

    // 🔥 GUARDAMOS LA SESIÓN CON EL TOKEN REAL
    AuthGuard.saveSession(email, rolReal, accessToken);

    if (rolReal === 'cocina') { 
      window.location.href = 'cocina.html'; 
      return; 
    }
    
    document.getElementById('login-screen').style.display = 'none'; 
    document.getElementById('sidebar').classList.remove('hidden-panel'); 
    document.getElementById('main-panel').classList.remove('hidden-panel');
    document.getElementById('user-display-name').textContent = nombreMostrar; 
    document.getElementById('user-display-role').textContent = rolReal;
    
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = (rolReal === 'admin') ? 'block' : 'none');
    
    cargarProductos(); cargarConfiguracion(); cargarPedidos(); cargarSlides(); cargarResenas(); cargarUsuarios();
    
  } catch (error) { 
    document.getElementById('login-msg').textContent = error.message; 
    document.getElementById('login-msg').style.display = 'block'; 
    btn.textContent = 'Entrar al Panel'; 
  }
}

function logout() { 
  AuthGuard.logout();
}

function mostrarSeccion(id, event) { 
  ['productos', 'pedidos', 'slider', 'configuracion', 'usuarios', 'resenas'].forEach(sec => { document.getElementById(`seccion-${sec}`).style.display = sec === id ? 'block' : 'none'; }); 
  document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); 
  
  if(event) event.target.classList.add('active'); 
  if(id === 'resenas') cargarResenas(); if(id === 'pedidos') cargarPedidos(); if(id === 'slider') cargarSlides(); if(id === 'usuarios') cargarUsuarios(); 
  document.getElementById('sidebar').classList.remove('open');
}

// PRODUCTOS
async function cargarProductos() { try { const data = await fetchSupabase('/rest/v1/productos?select=*&order=id.desc'); productosGlobal = data || []; renderizarProductos(); } catch (error) { mostrarAlerta('Error: ' + error.message, 'error'); } }
function renderizarProductos() {
  const cont = document.getElementById('lista-productos');
  if (!productosGlobal.length) { cont.innerHTML = '<p style="color:#999">No hay productos.</p>'; return; }
  cont.innerHTML = productosGlobal.map(p => `<div class="card"><img src="${p.imagen_url || ''}"><div class="card-body"><h3>${esc(p.nombre)}</h3><div class="price">${moneda(precioNum(p.precio))}</div><div class="card-actions"><button class="btn-edit" onclick="editarProducto('${p.id}')" style="background:#3498db;">✏️ Editar</button><button class="btn-delete" onclick="eliminarProducto('${p.id}')" style="background:#e74c3c;">🗑️ Borrar</button></div></div></div>`).join('');
}
function eliminarProducto(id) { 
  confirmarAccion('Eliminar Producto', '¿Seguro que quieres borrar esta pizza?', async () => { 
    try { 
      await fetchSupabase(`/rest/v1/productos?id=eq.${id}`, { method: 'DELETE' }); 
      mostrarAlerta('Producto eliminado.'); 
      cargarProductos(); 
    } catch (error) { 
      mostrarAlerta('Error: ' + error.message, 'error'); 
    } 
  }); 
}
function abrirModalNuevo() { 
  document.getElementById('modal-title').textContent = 'Nuevo Producto'; 
  document.getElementById('prod-id-original').value = ''; 
  document.getElementById('prod-id').value = 'Automático'; 
  document.getElementById('prod-nombre').value = ''; 
  document.getElementById('prod-precio').value = ''; 
  document.getElementById('prod-categoria').value = 'Pizzas'; 
  document.getElementById('prod-desc').value = ''; 
  document.getElementById('prod-ingredientes').value = ''; 
  document.getElementById('prod-imagen').value = ''; 
  document.getElementById('prod-disponible').checked = true; 
  document.getElementById('preview-prod').style.display = 'none'; 
  document.getElementById('status-imagen').textContent = 'Sin imagen seleccionada';
  document.getElementById('status-imagen').style.color = '#888';
  document.getElementById('file-prod').value = ''; 
  document.getElementById('modal-producto').style.display = 'flex'; 
}

function editarProducto(id) {
  const p = productosGlobal.find(x => String(x.id) === String(id)); 
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Editar Producto'; 
  document.getElementById('prod-id-original').value = p.id; 
  document.getElementById('prod-id').value = p.id; 
  document.getElementById('prod-nombre').value = p.nombre || ''; 
  document.getElementById('prod-precio').value = p.precio || ''; 
  document.getElementById('prod-categoria').value = p.categoria || 'Pizzas'; 
  document.getElementById('prod-desc').value = p.descripcion || ''; 
  document.getElementById('prod-ingredientes').value = p.ingredientes || ''; 
  document.getElementById('prod-imagen').value = p.imagen_url || ''; 
  document.getElementById('prod-disponible').checked = (p.disponible === true || p.disponible === 'true'); 
  
  if (p.imagen_url) { 
    document.getElementById('preview-prod').src = p.imagen_url; 
    document.getElementById('preview-prod').style.display = 'block'; 
    document.getElementById('status-imagen').textContent = 'Imagen actual cargada';
    document.getElementById('status-imagen').style.color = '#27ae60';
  } else { 
    document.getElementById('preview-prod').style.display = 'none'; 
    document.getElementById('status-imagen').textContent = 'Sin imagen seleccionada';
    document.getElementById('status-imagen').style.color = '#888';
  }
  document.getElementById('file-prod').value = ''; 
  document.getElementById('modal-producto').style.display = 'flex';
}

async function guardarProducto() {
  const idOriginal = document.getElementById('prod-id-original').value; 
  const nombre = document.getElementById('prod-nombre').value.trim(); 
  const precio = precioNum(document.getElementById('prod-precio').value); 
  const categoria = document.getElementById('prod-categoria').value; 
  const descripcion = document.getElementById('prod-desc').value.trim(); 
  const ingredientes = document.getElementById('prod-ingredientes').value.trim(); 
  const imagen_url = document.getElementById('prod-imagen').value.trim(); 
  const disponible = document.getElementById('prod-disponible').checked; 

  if (!nombre || precio <= 0) { 
    mostrarAlerta('Nombre y precio obligatorios.', 'error'); 
    return; 
  }

  const payload = { nombre, precio, categoria, descripcion, ingredientes, imagen_url, disponible };

  try { 
    if (idOriginal) { 
      await fetchSupabase(`/rest/v1/productos?id=eq.${idOriginal}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      mostrarAlerta('Producto actualizado.'); 
    } else { 
      await fetchSupabase('/rest/v1/productos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      mostrarAlerta('Producto creado.'); 
    } 
    document.getElementById('modal-producto').style.display = 'none'; 
    cargarProductos(); 
  } catch (error) { 
    mostrarAlerta('Error al guardar: ' + error.message, 'error'); 
  }
}

async function subirImagenProducto(input) { 
  const file = input.files[0]; if (!file) return; 
  try { 
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `prod_${Date.now()}.${ext}`;
    
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/imagenes/${fileName}`, { 
      method: 'POST', 
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': file.type, 'x-upsert': 'true' }, 
      body: file 
    }); 
    if (!res.ok) throw new Error('Error al subir. Revisa las políticas de Storage.'); 
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/imagenes/${fileName}`;
    document.getElementById('prod-imagen').value = publicUrl; 
    document.getElementById('preview-prod').src = publicUrl; 
    document.getElementById('preview-prod').style.display = 'block'; 
    mostrarAlerta('Imagen subida con éxito.'); 
  } catch (error) { 
    mostrarAlerta('Error: ' + error.message, 'error'); 
  } 
}

// SLIDER
async function cargarSlides() { 
  try { 
    const data = await fetchSupabase('/rest/v1/slides?select=*&order=orden.asc'); 
    slidesGlobal = data || []; 
    renderizarSlides(); 
  } catch (error) { 
    mostrarAlerta('Error slider: ' + error.message, 'error'); 
  } 
}

function renderizarSlides() {
  const cont = document.getElementById('lista-slides');
  if (!slidesGlobal.length) { cont.innerHTML = '<p style="color:#999">No hay imágenes.</p>'; return; }
  cont.innerHTML = slidesGlobal.map(s => `<div class="card"><img src="${s.imagen_url}"><div class="card-body"><h3>${esc(s.titulo || 'Sin título')}</h3><div class="card-actions"><button class="btn-delete" onclick="eliminarSlide('${s.id}')" style="width:100%; background:#e74c3c;">🗑️ Borrar</button></div></div></div>`).join('');
}

function abrirModalSlide() {
  document.getElementById('slide-titulo').value = ''; document.getElementById('slide-subtitulo').value = ''; document.getElementById('slide-imagen').value = '';
  document.getElementById('preview-slide').style.display = 'none';
  document.getElementById('modal-slider').style.display = 'flex';
}

async function guardarSlide() {
  const titulo = document.getElementById('slide-titulo').value.trim(); const subtitulo = document.getElementById('slide-subtitulo').value.trim(); const imagen_url = document.getElementById('slide-imagen').value.trim();
  if (!imagen_url) { mostrarAlerta('Sube una imagen.', 'error'); return; }
  try { 
    await fetchSupabase('/rest/v1/slides', { method: 'POST', body: JSON.stringify({ titulo, subtitulo, imagen_url, activo: true, orden: slidesGlobal.length }) }); 
    document.getElementById('modal-slider').style.display = 'none'; 
    mostrarAlerta('Imagen añadida.'); 
    cargarSlides(); 
  } catch (error) { 
    mostrarAlerta('Error: ' + error.message, 'error'); 
  }
}

function eliminarSlide(id) { 
  confirmarAccion('Eliminar Imagen', '¿Quitar esta imagen?', async () => { 
    try { 
      await fetchSupabase(`/rest/v1/slides?id=eq.${id}`, { method: 'DELETE' }); 
      mostrarAlerta('Eliminada.'); 
      cargarSlides(); 
    } catch (error) { 
      mostrarAlerta('Error: ' + error.message, 'error'); 
    } 
  }); 
}

async function subirImagenSlide(input) {
  const file = input.files[0]; if (!file) return;
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `slide_${Date.now()}.${ext}`;
    
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/imagenes/${fileName}`, {
      method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + token, 'Content-Type': file.type, 'x-upsert': 'true' }, body: file
    });
    if (!res.ok) throw new Error('Error al subir');
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/imagenes/${fileName}`;
    document.getElementById('slide-imagen').value = publicUrl;
    document.getElementById('preview-slide').src = publicUrl; document.getElementById('preview-slide').style.display = 'block';
    mostrarAlerta('Imagen subida.');
  } catch (error) { mostrarAlerta('Error imagen: ' + error.message, 'error'); }
}

// PEDIDOS
async function cargarPedidos() {
  try { 
    const data = await fetchSupabase('/rest/v1/pedidos?select=*&order=fecha.desc'); 
    pedidosGlobal = data || []; 
    paginaPedidosActual = 1; 
    renderizarPedidosAdmin(); 
    mostrarAlerta('Pedidos actualizados.');
  } catch (error) { 
    mostrarAlerta('Error al cargar pedidos: ' + error.message, 'error'); 
  }
}

function renderizarPedidosAdmin() {
  const tbody = document.getElementById('tabla-pedidos-body');
  if (!pedidosGlobal.length) { 
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pedidos.</td></tr>'; 
    document.getElementById('paginacion-pedidos').style.display = 'none'; 
    return; 
  }
  
  const inicio = (paginaPedidosActual - 1) * pedidosPorPagina;
  const pedidosPagina = pedidosGlobal.slice(inicio, inicio + pedidosPorPagina);

  tbody.innerHTML = pedidosPagina.map(p => {
    const estadoClase = { 
      'Pendiente': 'background:#fff3cd; color:#856404', 
      'Pagado': 'background:#d4edda; color:#155724', 
      'En preparación': 'background:#cce5ff; color:#004085', 
      'Listo': 'background:#d1ecf1; color:#0c5460', 
      'En reparto': 'background:#e2e3e5; color:#383d41',
      'Entregado': 'background:#27ae60; color:#ffffff', 
      'Cancelado': 'background:#f8d7da; color:#721c24' 
    }[p.estado] || 'background:#fff3cd; color:#856404';

    return `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding:12px; font-weight:bold;">${esc(p.order_id)}</td>
      <td style="padding:12px;">${esc(p.nombre_cliente)}<br><small>${esc(p.telefono || '')}</small></td>
      
      <td class="celda-detalle" style="padding:12px; max-width:280px; font-size:0.8rem;">
        <span class="texto-detalle">${esc(p.detalle)}</span>
        <button class="btn-ver-detalle" onclick="verDetallePedido('${esc(p.order_id)}')">
          👁️ Ver detalle
        </button>
      </td>
      
      <td style="padding:12px; font-weight:bold; color:#27ae60;">${moneda(precioNum(p.total))}</td>
      <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; ${estadoClase}">${esc(p.estado)}</span></td>
      
      <td style="padding:12px;">
        <select onchange="cambiarEstadoPedido('${esc(p.order_id)}', this.value)" style="padding:5px; font-size:0.8rem; margin-bottom:5px; width:100%; border:1px solid #ddd; border-radius:4px;">
          <option value="Pendiente" ${p.estado==='Pendiente'?'selected':''}>Pendiente</option>
          <option value="Pagado" ${p.estado==='Pagado'?'selected':''}>Pagado</option>
          <option value="En preparación" ${p.estado==='En preparación'?'selected':''}>En preparación</option>
          <option value="Listo" ${p.estado==='Listo'?'selected':''}>Listo</option>
          <option value="En reparto" ${p.estado==='En reparto'?'selected':''}>En reparto</option>
          <option value="Entregado" ${p.estado==='Entregado'?'selected':''}>Entregado</option>
          <option value="Cancelado" ${p.estado==='Cancelado'?'selected':''}>Cancelado</option>
        </select>
        
        <button onclick="mostrarTicketModal('${esc(p.order_id)}')" style="width:100%; padding:6px; border:none; border-radius:5px; background:#3498db; color:white; cursor:pointer; font-size:0.8rem; margin-bottom:5px;">🖨️ Ticket</button>
        
        <button onclick="eliminarPedido('${esc(p.order_id)}')" style="width:100%; padding:6px; border:none; border-radius:5px; background:#e74c3c; color:white; cursor:pointer; font-size:0.8rem;">🗑️ Borrar</button>
      </td>
    </tr>`;
  }).join('');

  const totalPaginas = Math.ceil(pedidosGlobal.length / pedidosPorPagina);
  document.getElementById('paginacion-pedidos').style.display = 'flex';
  document.getElementById('info-pagina-pedidos').textContent = `Página ${paginaPedidosActual} de ${totalPaginas}`;
}

function cambiarPaginaPedidos(direccion) {
  const totalPaginas = Math.ceil(pedidosGlobal.length / pedidosPorPagina);
  const nuevaPagina = paginaPedidosActual + direccion;
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
    paginaPedidosActual = nuevaPagina;
    renderizarPedidosAdmin();
    document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
  }
}

function eliminarPedido(orderId) {
  confirmarAccion('Eliminar Pedido', '¿Seguro que quieres borrar este pedido?', async () => {
    try {
      await fetchSupabase(`/rest/v1/pedidos?order_id=eq.${orderId}`, { method: 'DELETE' });
      mostrarAlerta('Pedido eliminado.');
      cargarPedidos();
    } catch (error) {
      mostrarAlerta('Error al eliminar: ' + error.message, 'error');
    }
  });
}

async function cambiarEstadoPedido(orderId, nuevoEstado) {
  try {
    await fetchSupabase(`/rest/v1/pedidos?order_id=eq.${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: nuevoEstado })
    });
    mostrarAlerta('Estado actualizado.');
    cargarPedidos(); // Recargamos para que se vea el cambio reflejado
  } catch (error) {
    mostrarAlerta('Error al actualizar: ' + error.message, 'error');
  }
}

// FUNCIONES DEL MODAL DETALLE (MÓVIL)
function verDetallePedido(orderId) {
  const pedido = pedidosGlobal.find(p => p.order_id === orderId);
  if (!pedido) return;

  const detalleContent = document.getElementById('detalle-pedido-content');
  
  const items = pedido.detalle ? pedido.detalle.split(',').map(item => {
    return `<div style="padding: 10px; background: #f8f9fa; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #3498db; font-size: 0.95rem;">
      ${esc(item.trim())}
    </div>`;
  }).join('') : '<p>Sin detalle</p>';

  detalleContent.innerHTML = `
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ccc;">
      <p style="margin-bottom: 5px;"><strong>Ticket:</strong> ${esc(pedido.order_id)}</p>
      <p style="margin-bottom: 5px;"><strong>Cliente:</strong> ${esc(pedido.nombre_cliente)}</p>
      <p><strong>Total:</strong> <span style="color: #27ae60; font-weight: bold; font-size: 1.2rem;">${moneda(precioNum(pedido.total))}</span></p>
    </div>
    <div>
      <h3 style="font-size: 0.9rem; color: #7f8c8d; margin-bottom: 10px; text-transform: uppercase;">Productos:</h3>
      ${items}
    </div>
  `;

  document.getElementById('modal-detalle-pedido').style.display = 'flex';
}

function cerrarModalDetalle() {
  document.getElementById('modal-detalle-pedido').style.display = 'none';
}

// CONFIGURACIÓN
async function cargarConfiguracion() {
  try {
    const data = await fetchSupabase('/rest/v1/configuracion?select=*');
    const config = {}; 
    (data || []).forEach(item => { config[item.clave] = item.valor; });
    
    document.getElementById('cfg-nombre').value = config.nombre_negocio || ''; 
    document.getElementById('cfg-empresa').value = config.empresa || ''; 
    document.getElementById('cfg-cif').value = config.cif || ''; 
    document.getElementById('cfg-promo').value = config.promocion || ''; 
    document.getElementById('cfg-telefono').value = config.telefono || ''; 
    document.getElementById('cfg-whatsapp').value = config.whatsapp || ''; 
    document.getElementById('cfg-direccion').value = config.direccion || ''; 
    document.getElementById('cfg-horario').value = config.horario || ''; 
    document.getElementById('cfg-ticket-footer').value = config.ticket_footer || '';
    
    const stripeOn = config.stripe_habilitado === 'true'; 
    document.getElementById('cfg-stripe').checked = stripeOn; 
    document.getElementById('stripe-status-text').textContent = stripeOn ? 'Activado' : 'Desactivado';
    
    document.getElementById('cfg-stripe-public').value = config.stripe_public_key || '';
    document.getElementById('cfg-stripe-url').value = config.stripe_payment_url || '';
    
    const stripeContainer = document.getElementById('stripe-keys-container');
    if (stripeContainer) {
        stripeContainer.style.display = stripeOn ? 'block' : 'none';
    }

    if (config.nombre_negocio) document.getElementById('admin-header-title').textContent = '🍕 ' + config.nombre_negocio;
    
  } catch (error) { 
    console.error(error); 
  }
}

async function guardarConfiguracion() {
  const valores = { 
    nombre_negocio: document.getElementById('cfg-nombre').value.trim(), 
    empresa: document.getElementById('cfg-empresa').value.trim(), 
    cif: document.getElementById('cfg-cif').value.trim(), 
    promocion: document.getElementById('cfg-promo').value.trim(), 
    telefono: document.getElementById('cfg-telefono').value.trim(), 
    whatsapp: document.getElementById('cfg-whatsapp').value.trim(), 
    direccion: document.getElementById('cfg-direccion').value.trim(), 
    horario: document.getElementById('cfg-horario').value.trim(), 
    ticket_footer: document.getElementById('cfg-ticket-footer').value.trim(), 
    stripe_habilitado: document.getElementById('cfg-stripe').checked ? 'true' : 'false',
    stripe_public_key: document.getElementById('cfg-stripe-public').value.trim(),
    stripe_payment_url: document.getElementById('cfg-stripe-url').value.trim()
  };

  try { 
    const payload = Object.keys(valores).map(clave => ({ clave, valor: valores[clave] })); 
    await fetchSupabase('/rest/v1/configuracion', { 
      method: 'POST', 
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' }, 
      body: JSON.stringify(payload) 
    }); 
document.addEventListener('DOMContentLoaded', () => {
  
  if (typeof AuthGuard === 'undefined') {
      document.getElementById('login-screen').style.display = 'flex';
      return;
  }

  const session = AuthGuard.getSession();
  
  // 🔥 SI NO HAY SESIÓN, MOSTRAMOS LOGIN (Pero NO redirigimos a cocina)
  if (!session || !session.token) {
      document.getElementById('login-screen').style.display = 'flex';
      return;
  }

  // 🔥 SI HAY SESIÓN, OCULTAMOS LOGIN Y MOSTRAMOS EL PANEL (sea admin o cocina)
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('sidebar').classList.remove('hidden-panel');
  document.getElementById('main-panel').classList.remove('hidden-panel');
  
  document.getElementById('user-display-name').textContent = session.email;
  document.getElementById('user-display-role').textContent = session.rol;
  
  // Si es admin, mostramos los botones extra (Configuración, Usuarios)
  if (session.rol === 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
  }

  // Lógica del checkbox de Stripe
  const stripeCheck = document.getElementById('cfg-stripe');
  const stripeContainer = document.getElementById('stripe-keys-container');
  if (stripeCheck && stripeContainer) {
    stripeCheck.addEventListener('change', () => {
      stripeContainer.style.display = stripeCheck.checked ? 'block' : 'none';
      document.getElementById('stripe-status-text').textContent = stripeCheck.checked ? 'Activado' : 'Desactivado';
    });
  }

  // Cargamos los datos
  cargarProductos(); cargarConfiguracion(); cargarPedidos(); cargarSlides(); cargarResenas(); cargarUsuarios();
});
