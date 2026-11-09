// ==========================================
// NÚCLEO DEL PANEL DE ADMINISTRACIÓN
// ==========================================

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

// 🔥 VARIABLES GLOBALES
let productosGlobal = [], slidesGlobal = [], pedidosGlobal = [], usuariosGlobal = [], paginaPedidosActual = 1;
let intervaloAutoRefresco = null;
let registrosPorPagina = 10; 

function esc(txt) { return String(txt == null ? '' : txt).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function moneda(n) { return '€' + (Number(n) || 0).toFixed(2); }
function precioNum(valor) { if (typeof valor === 'number') return isFinite(valor) ? valor : 0; let s = String(valor == null ? '' : valor).replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.indexOf(',') > -1 && s.indexOf('.') > -1) { s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); } else { s = s.replace(',', '.'); } const n = parseFloat(s); return isNaN(n) ? 0 : n; }

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
    localStorage.removeItem('pizzeria_session');
    localStorage.removeItem('cocina_nombre');

    const response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', { 
      method: 'POST', 
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email, password: pass }) 
    });
    
    if (!response.ok) throw new Error('Credenciales incorrectas');
    
    const authData = await response.json(); 
    const accessToken = authData.access_token;
    
    const perfiles = await fetchSupabase(`/rest/v1/perfiles?email=eq.${email}`);
    let nombreMostrar = email, rolReal = 'empleado';
    
    if (perfiles && perfiles.length > 0) { 
      rolReal = perfiles[0].rol || 'empleado'; 
      nombreMostrar = perfiles[0].nombre || email; 
    }

    const esSesionCaducable = (rolReal !== 'cocina');
    AuthGuard.saveSession(email, rolReal, accessToken, esSesionCaducable);

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
    
    setTimeout(() => {
        cargarProductos(); 
        cargarConfiguracion(); 
        cargarPedidos(); 
        cargarSlides(); 
        cargarResenas(); 
        cargarUsuarios();
    }, 500);
    
  } catch (error) { 
    document.getElementById('login-msg').textContent = error.message; 
    document.getElementById('login-msg').style.display = 'block'; 
    btn.textContent = 'Entrar al Panel'; 
  }
}

function logout() { AuthGuard.logout(); }

function mostrarSeccion(id, event) { 
  ['productos', 'pedidos', 'slider', 'configuracion', 'usuarios', 'resenas'].forEach(sec => { document.getElementById(`seccion-${sec}`).style.display = sec === id ? 'block' : 'none'; }); 
  document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active')); 
  if(event) event.target.classList.add('active'); 
  if (intervaloAutoRefresco) clearInterval(intervaloAutoRefresco);
  if(id === 'pedidos') { 
    window.actualizacionSilenciosa = false;
    cargarPedidos(); 
    intervaloAutoRefresco = setInterval(() => { window.actualizacionSilenciosa = true; cargarPedidos(); }, 15000); 
  } 
  if(id === 'resenas') cargarResenas(); 
  if(id === 'slider') cargarSlides(); 
  if(id === 'usuarios') cargarUsuarios(); 
  document.getElementById('sidebar').classList.remove('open');
}

// ==========================================
// INICIALIZACIÓN DE LA APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AuthGuard !== 'undefined') {
      if (!AuthGuard.protectPage(['admin', 'cocina'])) {
          document.getElementById('login-screen').style.display = 'flex';
          return;
      }
  }

  const session = AuthGuard.getSession();
  if (session) {
    if (session.rol === 'cocina') {
      window.location.replace('cocina.html');
      return;
    }

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('sidebar').classList.remove('hidden-panel');
    document.getElementById('main-panel').classList.remove('hidden-panel');
    
    document.getElementById('user-display-name').textContent = session.email;
    document.getElementById('user-display-role').textContent = session.rol;
    
    if (session.rol === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    const stripeCheck = document.getElementById('cfg-stripe');
    const stripeContainer = document.getElementById('stripe-keys-container');
    if (stripeCheck && stripeContainer) {
      stripeCheck.addEventListener('change', () => {
        stripeContainer.style.display = stripeCheck.checked ? 'block' : 'none';
        document.getElementById('stripe-status-text').textContent = stripeCheck.checked ? 'Activado' : 'Desactivado';
      });
    }

    setTimeout(() => {
      cargarProductos(); 
      cargarConfiguracion(); 
      cargarPedidos(); 
      cargarSlides(); 
      cargarResenas(); 
      cargarUsuarios();
    }, 500);
  }
});
