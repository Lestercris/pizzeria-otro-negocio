// ==========================================
// GESTIÓN DE PEDIDOS
// ==========================================

async function cargarPedidos() {
  const contenedor = document.querySelector('#seccion-pedidos > div');
  const scrollActual = contenedor ? contenedor.scrollTop : 0;
  const scrollVentana = window.scrollY;

  try { 
    const data = await fetchSupabase('/rest/v1/pedidos?select=*&order=fecha.desc'); 
    pedidosGlobal = data || []; 
    
    if (!window.actualizacionSilenciosa) {
        paginaPedidosActual = 1; 
        mostrarAlerta('Pedidos actualizados.');
    }
    renderizarPedidosAdmin(); 
    
    if (contenedor) contenedor.scrollTop = scrollActual;
    window.scrollTo(0, scrollVentana);
    
  } catch (error) { 
    mostrarAlerta('Error al cargar pedidos: ' + error.message, 'error'); 
  }
}

function actualizarPedidosManual() {
    window.actualizacionSilenciosa = false; 
    cargarPedidos();
}

function renderizarPedidosAdmin() {
  const tbody = document.getElementById('tabla-pedidos-body');
  if (!pedidosGlobal.length) { 
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pedidos.</td></tr>'; 
    document.getElementById('paginacion-pedidos').style.display = 'none'; 
    return; 
  }
  
  const inicio = (paginaPedidosActual - 1) * registrosPorPagina;
  const pedidosPagina = pedidosGlobal.slice(inicio, inicio + registrosPorPagina);

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
      
      <!-- 🔥 CELDA DEL DETALLE CON FORMATO INTELIGENTE -->
      <td class="celda-detalle" style="padding:12px; max-width:300px; font-size:0.8rem;">
        <span class="texto-detalle">
          ${(() => {
            let items = [];
            try {
              if (typeof p.detalle === 'string' && p.detalle.startsWith('[')) {
                items = JSON.parse(p.detalle);
              } else {
                const texto = p.detalle || '';
                let partes = texto.split(/(?=\d+x )/); 
                if (partes.length === 1) partes = texto.split(', '); 
                items = partes.filter(i => i.trim() !== '');
              }
            } catch (e) {
              items = (p.detalle || '').split(', ');
            }
            return items.map((item, idx) => `<div style="margin-bottom: 4px;">${idx + 1}. ${esc(item.trim())}</div>`).join('');
          })()}
        </span>
        <button class="btn-ver-detalle" onclick="verDetallePedido('${esc(p.order_id)}')">
          👁️ Ver detalle
        </button>
      </td>
      
      <td style="padding:12px; font-weight:bold; color:#27ae60;">${moneda(precioNum(p.total))}</td>
      <td style="padding:12px;"><span style="padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold; ${estadoClase}">${esc(p.estado)}</span></td>
      
      <td style="padding:12px; vertical-align: top; width: 140px;">
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <select onchange="cambiarEstadoPedido('${esc(p.order_id)}', this.value)" style="padding: 6px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.85rem; width: 100%;">
            <option value="Pendiente" ${p.estado==='Pendiente'?'selected':''}>Pendiente</option>
            <option value="Pagado" ${p.estado==='Pagado'?'selected':''}>Pagado</option>
            <option value="En preparación" ${p.estado==='En preparación'?'selected':''}>En preparación</option>
            <option value="Listo" ${p.estado==='Listo'?'selected':''}>Listo</option>
            <option value="En reparto" ${p.estado==='En reparto'?'selected':''}>En reparto</option>
            <option value="Entregado" ${p.estado==='Entregado'?'selected':''}>Entregado</option>
            <option value="Cancelado" ${p.estado==='Cancelado'?'selected':''}>Cancelado</option>
          </select>
          
          <button onclick="mostrarTicketModal('${esc(p.order_id)}')" style="padding: 6px; border: none; border-radius: 6px; background: #3498db; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; width: 100%;">
            🖨️ Ticket
          </button>
          <button onclick="eliminarPedido('${esc(p.order_id)}')" style="padding: 6px; border: none; border-radius: 6px; background: #e74c3c; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; width: 100%;">
            🗑️ Borrar
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const totalPaginas = Math.ceil(pedidosGlobal.length / registrosPorPagina);
  document.getElementById('paginacion-pedidos').style.display = 'flex';
  document.getElementById('info-pagina-pedidos').textContent = `Página ${paginaPedidosActual} de ${totalPaginas || 1}`;
}

function cambiarPaginaPedidos(direccion) {
  const totalPaginas = Math.ceil(pedidosGlobal.length / registrosPorPagina);
  const nuevaPagina = paginaPedidosActual + direccion;
  if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
    paginaPedidosActual = nuevaPagina;
    renderizarPedidosAdmin();
    document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
  }
}

function cambiarRegistrosPorPagina(valor) {
  registrosPorPagina = parseInt(valor);
  paginaPedidosActual = 1; 
  renderizarPedidosAdmin();
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
    cargarPedidos(); 
  } catch (error) {
    mostrarAlerta('Error al actualizar: ' + error.message, 'error');
  }
}

// ==========================================
// MODAL DE DETALLE (PARA MÓVILES)
// ==========================================
function verDetallePedido(orderId) {
  const pedido = pedidosGlobal.find(p => p.order_id === orderId);
  if (!pedido) return;

  const detalleContent = document.getElementById('detalle-pedido-content');
  
  let itemsArray = [];
  try {
    if (typeof pedido.detalle === 'string' && pedido.detalle.startsWith('[')) {
      itemsArray = JSON.parse(pedido.detalle);
    } else {
      const texto = pedido.detalle || '';
      let partes = texto.split(/(?=\d+x )/);
      if (partes.length === 1) partes = texto.split(', ');
      itemsArray = partes.filter(i => i.trim() !== '');
    }
  } catch (e) {
    itemsArray = (pedido.detalle || '').split(', ');
  }

  const items = itemsArray.length > 0 ? itemsArray.map((item, index) => {
    return `<div style="padding: 10px; background: #f8f9fa; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #3498db; font-size: 0.95rem;">
      <strong>${index + 1}.</strong> ${esc(item.trim())}
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
