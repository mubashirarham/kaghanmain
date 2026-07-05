// Client-side authentication & route guarding module
// Implements client-side checks for protected user/admin routes.

(function() {
    const dbInstance = window.CorporateDB || {};
    
    dbInstance.guardRoute = (requiredRole) => {
        const user = dbInstance.getCurrentUser ? dbInstance.getCurrentUser() : null;
        if (!user) {
            const currentPath = window.location.pathname;
            // Redirect to root-level login.html or parent-level login.html depending on current directory level
            window.location.href = currentPath.includes('/admin/') || currentPath.includes('/user/') ? '../login.html' : 'login.html';
            return false;
        }
        if (requiredRole && user.role !== requiredRole) {
            window.location.href = user.role === 'admin' ? '../admin/index.html' : '../user/index.html';
            return false;
        }
        return true;
    };

    // Ensure it's exposed globally on CorporateDB
    window.CorporateDB = dbInstance;
})();
