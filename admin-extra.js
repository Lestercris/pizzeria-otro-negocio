// ==========================================
// CONFIGURACIÓN
// ==========================================
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
    document.getElementById('stripe-status-text').textContent = valores.stripe_habilitado === 'true' ? 'Activado' : 'Desactivado'; 
    mostrarAlerta('Configuración guardada correctamente.'); 
  } catch (error) { 
    mostrarAlerta('Error al guardar: ' + error.message, 'error'); 
  }
}

// ==========================================
// RESEÑAS
// ==========================================
async function cargarResenas() { 
  try { 
    const data = await fetchSupabase('/rest/v1/resenas?select=*&order=fecha.desc'); 
    renderizarResenasAdmin(data || []); 
  } catch (error) { 
    mostrarAlerta('Error reseñas: ' + error.message, 'error'); 
  } 
}

function renderizarResenasAdmin(resenas) {
  const cont = document.getElementById('lista-resenas-admin');
  if (!resenas.length) { cont.innerHTML = '<p style="color:#999">No hay reseñas.</p>'; return; }
  cont.innerHTML = resenas.map(r => `<div style="border-bottom:1px solid #eee;padding:15px 0;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><strong>${esc(r.nombre)}</strong><span style="color:#f1c40f;margin-left:10px;">${'★'.repeat(r.estrellas) + '☆'.repeat(5 - r.estrellas)}</span><small style="color:#999;margin-left:10px;">${new Date(r.fecha).toLocaleDateString('es-ES')}</small></div><div><span style="background:${r.aprobada ? '#d4edda' : '#fff3cd'}; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${r.aprobada ? 'Publicada' : 'Pendiente'}</span></div></div><p style="margin:8px 0;font-style:italic;">"${esc(r.comentario)}"</p><div style="display:flex;gap:8px;">${!r.aprobada ? `<button onclick="aprobarResena('${r.id}', true)" style="padding:6px 12px;border:none;border-radius:6px;background:#27ae60;color:white;cursor:pointer;">✅ Aprobar</button>` : `<button onclick="aprobarResena('${r.id}', false)" style="padding:6px 12px;border:none;border-radius:6px;background:#f39c12;color:white;cursor:pointer;">🚫 Ocultar</button>`}<button onclick="eliminarResena('${r.id}')" style="padding:6px 12px;border:none;border-radius:6px;background:#e74c3c;color:white;cursor:pointer;">🗑️ Eliminar</button></div></div>`).join('');
}

async function aprobarResena(id, aprobar) { 
  try { 
    await fetchSupabase(`/rest/v1/resenas?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ aprobada: aprobar }) }); 
    mostrarAlerta(aprobar ? 'Publicada.' : 'Ocultada.'); 
    cargarResenas(); 
  } catch (error) { 
    mostrarAlerta('Error: ' + error.message, 'error'); 
  } 
}

function eliminarResena(id) { 
  confirmarAccion('Eliminar Reseña', '¿Borrar esta reseña definitivamente?', async () => { 
    try { 
      await fetchSupabase(`/rest/v1/resenas?id=eq.${id}`, { method: 'DELETE' }); 
      mostrarAlerta('Eliminada.'); 
      cargarResenas(); 
    } catch (error) { 
      mostrarAlerta('Error: ' + error.message, 'error'); 
    } 
  }); 
}

// ==========================================
// USUARIOS
// ==========================================
async function cargarUsuarios() {
  try {
    const perfiles = await fetchSupabase('/rest/v1/perfiles?select=*');
    
    usuariosGlobal = perfiles.map(p => ({ 
        id: p.id, 
        email: p.email, 
        nombre: p.nombre || 'Sin nombre', 
        rol: p.rol || 'empleado',
        telefono: p.telefono || ''
    }));

    const tbody = document.getElementById('tabla-usuarios-body');
    if (!usuariosGlobal.length) { 
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px; color:#999;">No hay usuarios.</td></tr>'; 
      return; 
    }

    const miSesion = AuthGuard.getSession();
    const miEmail = miSesion ? miSesion.email : '';

    tbody.innerHTML = usuariosGlobal.map(u => `
      <tr style="border-bottom: 1px solid #f1f1f1; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
        <td style="padding:15px; font-weight:600; color:#2c3e50;">${u.nombre}</td>
        <td style="padding:15px; color:#666;">${u.email}</td>
        <td style="padding:15px;">
          <span style="background:#e3f2fd; color:#1976d2; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; letter-spacing:0.5px;">
            ${u.rol.toUpperCase()}
          </span>
        </td>
        <td style="padding:15px; text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button onclick="abrirModalEditarUsuario('${u.id}')" title="Editar Usuario" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: #e3f2fd; color: #1976d2; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#1976d2'; this.style.color='white';" onmouseout="this.style.background='#e3f2fd'; this.style.color='#1976d2';">✏️</button>
            
            <button onclick="abrirModalPassword('${u.id}')" title="Cambiar Contraseña" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: #fff3e0; color: #f57c00; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f57c00'; this.style.color='white';" onmouseout="this.style.background='#fff3e0'; this.style.color='#f57c00';">🔑</button>
            
            ${u.email !== miEmail ? `<button onclick="eliminarUsuario('${u.id}', '${u.email}')" title="Eliminar Usuario" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: #ffebee; color: #d32f2f; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#d32f2f'; this.style.color='white';" onmouseout="this.style.background='#ffebee'; this.style.color='#d32f2f';">🗑️</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) { 
    document.getElementById('tabla-usuarios-body').innerHTML = `<tr><td colspan="4" style="color:red; text-align:center; padding:15px;">Error: ${error.message}</td></tr>`; 
  }
}

async function guardarNuevaPassword() {
  const userId = document.getElementById('pass-user-id').value;
  const nuevaPass = document.getElementById('pass-nueva').value;

  if (!nuevaPass || nuevaPass.length < 6) {
    mostrarAlerta('La contraseña debe tener al menos 6 caracteres.', 'error');
    return;
  }

  try {
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-update-password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, newPassword: nuevaPass })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar');

    document.getElementById('modal-password').style.display = 'none';
    mostrarAlerta('Contraseña actualizada correctamente.');
  } catch (error) {
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

function abrirModalPassword(userId) {
  document.getElementById('pass-user-id').value = userId;
  document.getElementById('pass-nueva').value = '';
  document.getElementById('modal-password').style.display = 'flex';
}

function abrirModalEditarUsuario(userId) {
  const u = usuariosGlobal.find(x => x.id === userId);
  if (!u) return;
  document.getElementById('edit-user-id').value = u.id;
  document.getElementById('edit-user-name').value = u.nombre === 'Sin nombre' ? '' : u.nombre;
  document.getElementById('edit-user-phone').value = u.telefono || '';
  document.getElementById('edit-user-role').value = u.rol;
  document.getElementById('modal-editar-usuario').style.display = 'flex';
}

async function guardarEdicionUsuario() {
  const userId = document.getElementById('edit-user-id').value;
  const nombre = document.getElementById('edit-user-name').value.trim();
  const telefono = document.getElementById('edit-user-phone').value.trim();
  const rol = document.getElementById('edit-user-role').value;

  if (!nombre) {
    mostrarAlerta('El nombre es obligatorio.', 'error');
    return;
  }

  try {
    await fetchSupabase(`/rest/v1/perfiles?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ nombre, telefono, rol })
    });
    document.getElementById('modal-editar-usuario').style.display = 'none';
    mostrarAlerta('Datos del empleado actualizados.');
    cargarUsuarios();
  } catch (error) {
    mostrarAlerta('Error al editar: ' + error.message, 'error');
  }
}

function eliminarUsuario(userId, email) {
  confirmarAccion('Eliminar Usuario', `¿Seguro que quieres eliminar a ${email}?`, async () => {
    try {
      await fetchSupabase(`/rest/v1/perfiles?id=eq.${userId}`, { method: 'DELETE' });
      mostrarAlerta('Perfil de usuario eliminado.'); 
      cargarUsuarios();
    } catch (error) { 
      mostrarAlerta('Error: ' + error.message, 'error'); 
    }
  });
}

async function crearEmpleado() {
  const nombre = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const pass = document.getElementById('new-user-pass').value;
  const telefono = document.getElementById('new-user-phone').value.trim();
  const rol = document.getElementById('new-user-role').value;

  if (!nombre || !email || !pass) {
    mostrarAlerta('Nombre, email y contraseña son obligatorios.', 'error');
    return;
  }

  try {
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password: pass, nombre, telefono, rol })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear el usuario');

    mostrarAlerta('Usuario creado con éxito.');
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-pass').value = '';
    document.getElementById('new-user-phone').value = '';
    cargarUsuarios();
  } catch (error) {
    mostrarAlerta('Error: ' + error.message, 'error');
  }
}

// ==========================================
// BACKUP Y LIMPIEZA
// ==========================================
async function descargarBackup() { 
  try { 
    mostrarAlerta('Generando backup...', 'success'); 
    const tablas = ['productos', 'pedidos', 'slides', 'resenas', 'configuracion']; 
    let backupData = {}; 
    for (const tabla of tablas) { 
      backupData[tabla] = await fetchSupabase(`/rest/v1/${tabla}?select=*`); 
    } 
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = `backup_pizzeria_${new Date().toISOString().split('T')[0]}.json`; 
    a.click(); 
    URL.revokeObjectURL(url); 
  } catch (error) { 
    mostrarAlerta('Error: ' + error.message, 'error'); 
  } 
}

function restaurarBackup(input) { 
  const file = input.files[0]; if (!file) return; 
  confirmarAccion('Restaurar Backup', '¿Sobrescribir los datos actuales?', () => { 
    const reader = new FileReader(); 
    reader.onload = async (e) => { 
      try { 
        const data = JSON.parse(e.target.result); 
        for (const tabla in data) { 
          await fetchSupabase(`/rest/v1/${tabla}`, { method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify(data[tabla]) }); 
        } 
        mostrarAlerta('Backup restaurado.'); 
        cargarProductos(); cargarPedidos(); cargarSlides(); cargarResenas(); 
      } catch (error) { 
        mostrarAlerta('Error: ' + error.message, 'error'); 
      } 
    }; 
    reader.readAsText(file); 
  }); 
}

function limpiarBaseDeDatos() {
  confirmarAccion('¡CUIDADO!', 'Esto borrará TODOS los pedidos, productos, reseñas y el slider. Esta acción es irreversible.', async () => {
    try {
      mostrarAlerta('Borrando datos...', 'success');
      const tablas = ['pedidos', 'resenas', 'slides', 'productos'];
      
      for (const tabla of tablas) {
        await fetchSupabase(`/rest/v1/${tabla}?id=neq.0`, { method: 'DELETE' });
      }
      
      mostrarAlerta('Base de datos limpia correctamente.');
      cargarProductos(); cargarPedidos(); cargarSlides(); cargarResenas();
    } catch (error) {
      mostrarAlerta('Error al limpiar: ' + error.message, 'error');
    }
  });
}
