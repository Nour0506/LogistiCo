export function setupRouterGuards(router) {
    router.beforeEach((to, from, next) => {
      const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
      const requiredRole = to.meta.role
      
      // Récupération des données depuis localStorage
      const currentRole = localStorage.getItem('role')
      const isAuthenticated = !!localStorage.getItem('accessToken')
      
      // 1. Si la route ne nécessite pas d'authentification
      if (!requiresAuth) {
        return next()
      }
      
      // 2. Si non authentifié
      if (!isAuthenticated) {
        // Sauvegarde la route demandée pour redirection après login
        localStorage.setItem('redirectPath', to.fullPath)
        return next('/login')
      }
      
      // 3. Si authentifié mais mauvais rôle
      if (requiredRole && currentRole !== requiredRole) {
        // Redirection vers le dashboard par défaut selon le rôle
        switch (currentRole) {
          case 'admin':
            return next('/AdminDashboard')
          case 'entreprise':
            return next('/DashEntrepise')
          default:
            return next('/unauthorized')
        }
      }
      
      // 4. Tout est OK - accès autorisé
      next()
    })
  }