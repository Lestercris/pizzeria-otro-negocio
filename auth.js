const AuthGuard = {
  saveSession: (email, rol, accessToken = null) => {
    const sessionData = {
      email: email,
      rol: rol,
      token: accessToken, // 🔥 Token de Supabase
      timestamp: new Date().getTime()
    };
    localStorage.setItem('pizzeria_session', JSON.stringify(sessionData));
  },

  getSession: () => {
    const session = localStorage.getItem('pizzeria_session');
    if (!session) return null;
    return JSON.parse(session);
  },

  logout: () => {
    localStorage.removeItem('pizzeria_session');
    localStorage.removeItem('cocina_nombre');
    window.location.reload();
  },

  protectPage: (requiredRoles = []) => {
    const session = AuthGuard.getSession();

    if (!session || !session.token) {
      window.location.href = 'admin.html';
      return false;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(session.rol)) {
      alert('No tienes permisos para acceder a esta sección.');
      window.location.href = 'admin.html';
      return false;
    }

    return true;
  }
};
