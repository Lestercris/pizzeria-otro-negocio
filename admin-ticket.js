// ==========================================
// SISTEMA DE PREVISUALIZACIÓN E IMPRESIÓN DE TICKETS
// ==========================================

let pedidoActualTicketId = null;

async function mostrarTicketModal(orderId) {
  const pedido = pedidosGlobal.find(p => p.order_id === orderId); 
  if (!pedido) return;
  
  pedidoActualTicketId = orderId;

  let config = {};
  try { 
    const cfgData = await fetchSupabase('/rest/v1/configuracion?select=*'); 
    cfgData.forEach(item => { config[item.clave] = item.valor; }); 
  } catch (e) {}

  const ticketHTML = `
    <div style="font-family: 'Courier New', Courier, monospace; width: 100%; max-width: 72mm; margin: 0 auto; color: #000; line-height: 1.2; font-size: 12px; background: white; padding: 15px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase;">${esc(config.empresa || config.nombre_negocio || 'MI NEGOCIO')}</h2>
        ${config.cif ? `<p style="margin: 2px 0;">CIF: ${esc(config.cif)}</p>` : ''}
        ${config.direccion ? `<p style="margin: 2px 0;">${esc(config.direccion)}</p>` : ''}
        ${config.telefono ? `<p style="margin: 2px 0;">Tel: ${esc(config.telefono)}</p>` : ''}
      </div>
      
      <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 10px;">
        <p style="margin: 2px 0;">Ticket: <strong>${esc(pedido.order_id)}</strong></p>
        <p style="margin: 2px 0;">Fecha: ${new Date(pedido.fecha || Date.now()).toLocaleString('es-ES')}</p>
        <p style="margin: 2px 0;">Cliente: ${esc(pedido.nombre_cliente)}</p>
        ${pedido.telefono ? `<p style="margin: 2px 0;">Tel: ${esc(pedido.telefono)}</p>` : ''}
        ${pedido.direccion ? `<p style="margin: 2px 0;">Dir: ${esc(pedido.direccion)}</p>` : ''}
      </div>
      
      <!-- 🔥 LISTA DE PRODUCTOS INTELIGENTE -->
      <div style="margin-bottom: 15px;">
        ${(() => {
          let items = [];
          try {
            // Intentamos leerlo como JSON (el formato nuevo)
            if (typeof pedido.detalle === 'string' && pedido.detalle.startsWith('[')) {
              items = JSON.parse(pedido.detalle);
            } else if (Array.isArray(pedido.detalle)) {
              items = pedido.detalle;
            } else {
              // Si es un pedido viejo (separado por comas), hacemos el split de siempre
              items = (pedido.detalle || '').split(',');
            }
          } catch (e) {
            items = (pedido.detalle || '').split(',');
          }
          
          return items.map((item, index) => `
            <div style="padding: 6px 0; border-bottom: 1px dashed #ccc; font-size: 13px; line-height: 1.4;">
              <strong>${index + 1}.</strong> ${esc(item.trim())}
            </div>
          `).join('');
        })()}
      </div>
      
      <div style="border-top: 1px dashed #000; padding-top: 6px; text-align: right; font-weight: bold; font-size: 14px;">
        TOTAL: ${moneda(precioNum(pedido.total))}
      </div>
      
      ${config.ticket_footer ? `<div style="text-align: center; font-size: 10px; margin-top: 15px;">${esc(config.ticket_footer)}</div>` : ''}
      
      <div style="text-align: center; margin-top: 15px;">
        <div id="qrcode-ticket-preview" style="display: flex; justify-content: center;"></div>
      </div>
    </div>`;

  document.getElementById('ticket-preview-content').innerHTML = ticketHTML;
  document.getElementById('modal-ticket-preview').style.display = 'flex';

  if (window.QRCode) {
    try {
      new QRCode(document.getElementById("qrcode-ticket-preview"), {
        text: pedido.order_id,
        width: 80,
        height: 80,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
    } catch (e) { console.error(e); }
  }
}

function cerrarModalTicket() {
  document.getElementById('modal-ticket-preview').style.display = 'none';
  document.getElementById('ticket-preview-content').innerHTML = '';
  pedidoActualTicketId = null;
}

async function imprimirDesdeModal() {
  if (!pedidoActualTicketId) return;
  
  const contenido = document.getElementById('ticket-preview-content').innerHTML;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Ticket</title>
        <style>
          body { margin: 0; padding: 0; }
          @page { size: auto; margin: 0mm; }
        </style>
      </head>
      <body>
        ${contenido}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  }, 500);
}
