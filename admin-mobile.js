/* =========================================
   ESTILOS RESPONSIVE GLOBALES - ADMIN
   ========================================= */

.menu-toggle-btn {
  display: none;
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 10000;
  background: #2c3e50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

@media (max-width: 850px) {
  /* --- 1. MENÚ LATERAL --- */
  .menu-toggle-btn { display: block; }
  
  .sidebar {
    position: fixed;
    left: -300px; 
    top: 0;
    height: 100vh;
    z-index: 9999;
    transition: left 0.3s ease;
    box-shadow: 4px 0 15px rgba(0,0,0,0.5);
    overflow-y: auto;
  }
  
  .sidebar.open { left: 0; }

  .main-content {
    padding: 15px;
    padding-top: 70px; 
    width: 100%;
    overflow-x: hidden;
  }

  /* --- 2. FORMULARIOS Y CONFIGURACIÓN --- */
  div[style*="display: grid"] {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  input, select, textarea { font-size: 16px !important; }

  /* --- 3. TABLAS (Pedidos y Usuarios) --- */
  .tabla-pedidos, .tabla-pedidos thead, .tabla-pedidos tbody, .tabla-pedidos th, .tabla-pedidos td, .tabla-pedidos tr { display: block; }
  .tabla-pedidos thead tr { position: absolute; top: -9999px; left: -9999px; }
  .tabla-pedidos tr { margin-bottom: 15px; border: 1px solid #eee; border-radius: 12px; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; }
  
  /* Celdas de la tabla */
  .tabla-pedidos td { 
    border: none; 
    border-bottom: 1px solid #eee; 
    position: relative; 
    text-align: left; 
    padding: 35px 15px 15px 15px !important; 
    font-size: 0.9rem; 
    min-height: 45px; 
    line-height: 1.4;
  }
  
  /* Celda de Detalle del pedido (La que se apiñaba) */
  .tabla-pedidos td:nth-of-type(3) { 
    padding-top: 40px !important; 
    line-height: 1.5;
    font-size: 0.85rem;
  }
  
  .tabla-pedidos td:last-child { 
    border-bottom: none; 
    text-align: center; 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
    padding-top: 15px !important;
  }
  
  /* Etiqueta posicionada arriba a la izquierda */
  .tabla-pedidos td:before { 
    position: absolute; 
    top: 10px; 
    left: 15px; 
    width: 100%; 
    white-space: nowrap; 
    text-align: left; 
    font-weight: 600; 
    color: #7f8c8d; 
    font-size: 0.75rem; 
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .tabla-pedidos td:nth-of-type(1):before { content: "Ticket"; }
  .tabla-pedidos td:nth-of-type(2):before { content: "Cliente"; }
  .tabla-pedidos td:nth-of-type(3):before { content: "Detalle del pedido"; }
  .tabla-pedidos td:nth-of-type(4):before { content: "Total"; }
  .tabla-pedidos td:nth-of-type(5):before { content: "Estado"; }
  
  #tabla-usuarios-body td:nth-of-type(1):before { content: "Nombre"; }
  #tabla-usuarios-body td:nth-of-type(2):before { content: "Email"; }
  #tabla-usuarios-body td:nth-of-type(3):before { content: "Rol"; }
  
  /* --- 4. TARJETAS DE PRODUCTOS Y SLIDER --- */
  .grid-productos, .grid-slider {
    grid-template-columns: 1fr !important;
    gap: 15px !important;
  }

  /* --- 5. MODALES --- */
  .modal-content {
    width: 95% !important;
    max-height: 95vh !important;
    padding: 20px !important;
  }
}
