const AuthGuard = {
  // 🔥 Añadimos el parámetro "caducable" (por defecto true)
  saveSession: (email, rol, accessToken = null, caducable = true) => {
    const sessionData = {
      email: email,
      rol: rol,
      token: accessToken, 
      timestamp: new Date().getTime(),
      caducable: caducable // Guardamos si esta sesión debe caducar
    };
    localStorage.setItem('pizzeria_session', JSON.stringify(sessionData));
  },

  getSession: () => {
    const sessionStr = localStorage.getItem('pizzeria_session');
    if (!sessionStr) return null;
    
    try {
      const session = JSON.parse(sessionStr);
      
      // 🔥 Solo comprobamos el tiempo si la sesión es "caducable"
      if (session.caducable) {
        const ahora = new Date().getTime();
        const tiempoTranscurrido = ahora - (session.timestamp || 0);
        const limite = 50 * 60 * 1000; // 50 minutos

        if (tiempoTranscurrido > limite) {
          localStorage.removeItem('pizzeria_session');
          return null; 
        }
      }

      return session;
    } catch (e) {
      localStorage.removeItem('pizzeria_session');
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('pizzeria_session');
    localStorage.removeItem('cocina_nombre');
    window.location.reload();
  },

  protectPage: (requiredRoles = []) => {
    const session = AuthGuard.getSession();
    if (!session || !session.token) return false; 
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.rol)) return false;
    return true;
  }
};
