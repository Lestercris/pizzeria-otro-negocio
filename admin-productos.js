// ==========================================
// GESTIÓN DE PRODUCTOS
// ==========================================

async function cargarProductos() { 
  try { 
    const data = await fetchSupabase('/rest/v1/productos?select=*&order=id.desc'); 
    productosGlobal = data || []; 
    renderizarProductos(); 
  } catch (error) { 
    mostrarAlerta('Error: ' + error.message, 'error'); 
  } 
}

function renderizarProductos() {
  const cont = document.getElementById('lista-productos');
  if (!productosGlobal.length) { 
    cont.innerHTML = '<p style="color:#999">No hay productos.</p>'; 
    return; 
  }
  cont.innerHTML = productosGlobal.map(p => `
    <div class="card">
      <img src="${p.imagen_url || ''}">
      <div class="card-body">
        <h3>${esc(p.nombre)}</h3>
        <div class="price">${moneda(precioNum(p.precio))}</div>
        <div class="card-actions">
          <button class="btn-edit" onclick="editarProducto('${p.id}')" style="background:#3498db;">✏️ Editar</button>
          <button class="btn-delete" onclick="eliminarProducto('${p.id}')" style="background:#e74c3c;">🗑️ Borrar</button>
        </div>
      </div>
    </div>
  `).join('');
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
  const file = input.files[0]; 
  if (!file) return; 
  
  try { 
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `prod_${Date.now()}.${ext}`;
    
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/imagenes/${fileName}`, { 
      method: 'POST', 
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': 'Bearer ' + token, 
        'Content-Type': file.type, 
        'x-upsert': 'true' 
      }, 
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

// ==========================================
// GESTIÓN DEL SLIDER
// ==========================================

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
  if (!slidesGlobal.length) { 
    cont.innerHTML = '<p style="color:#999">No hay imágenes.</p>'; 
    return; 
  }
  cont.innerHTML = slidesGlobal.map(s => `
    <div class="card">
      <img src="${s.imagen_url}">
      <div class="card-body">
        <h3>${esc(s.titulo || 'Sin título')}</h3>
        <div class="card-actions">
          <button class="btn-delete" onclick="eliminarSlide('${s.id}')" style="width:100%; background:#e74c3c;">🗑️ Borrar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function abrirModalSlide() {
  document.getElementById('slide-titulo').value = ''; 
  document.getElementById('slide-subtitulo').value = ''; 
  document.getElementById('slide-imagen').value = '';
  document.getElementById('preview-slide').style.display = 'none';
  document.getElementById('modal-slider').style.display = 'flex';
}

async function guardarSlide() {
  const titulo = document.getElementById('slide-titulo').value.trim(); 
  const subtitulo = document.getElementById('slide-subtitulo').value.trim(); 
  const imagen_url = document.getElementById('slide-imagen').value.trim();
  
  if (!imagen_url) { 
    mostrarAlerta('Sube una imagen.', 'error'); 
    return; 
  }
  
  try { 
    await fetchSupabase('/rest/v1/slides', { 
      method: 'POST', 
      body: JSON.stringify({ titulo, subtitulo, imagen_url, activo: true, orden: slidesGlobal.length }) 
    }); 
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
  const file = input.files[0]; 
  if (!file) return;
  
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `slide_${Date.now()}.${ext}`;
    
    const session = AuthGuard.getSession();
    const token = session && session.token ? session.token : SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/imagenes/${fileName}`, {
      method: 'POST', 
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': 'Bearer ' + token, 
        'Content-Type': file.type, 
        'x-upsert': 'true' 
      }, 
      body: file
    });
    
    if (!res.ok) throw new Error('Error al subir');
    
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/imagenes/${fileName}`;
    document.getElementById('slide-imagen').value = publicUrl;
    document.getElementById('preview-slide').src = publicUrl; 
    document.getElementById('preview-slide').style.display = 'block';
    mostrarAlerta('Imagen subida.');
  } catch (error) { 
    mostrarAlerta('Error imagen: ' + error.message, 'error'); 
  }
}
