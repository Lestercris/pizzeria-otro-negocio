const AuthGuard = {
  saveSession: (email, rol, accessToken = null) => {
    const sessionData = {
      email: email,
      rol: rol,
      token: accessToken, 
      timestamp: new Date().getTime()
    };
    localStorage.setItem('pizzeria_session', JSON.stringify(sessionData));
  },

  getSession: () => {
    const session = localStorage.getItem('pizzeria_session');
    if (!session) return null;
    try {
        return JSON.parse(session);
    } catch (e) {
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

    // 🔥 COMPROBACIÓN A PRUEBA DE FALLOS
    // Si no hay sesión, o no hay token, o el token no es una cadena válida...
    if (!session || !session.token || session.token === 'undefined') {
      return false; // Devolvemos false, sin redirigir
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(session.rol)) {
      return false;
    }

    return true;
  }
};
