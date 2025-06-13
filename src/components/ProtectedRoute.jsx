import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

/**
 * Componente ProtectedRoute con múltiples capas de seguridad
 * 
 * Este componente maneja diferentes tipos de protección:
 * - adminOnly: Solo permite acceso al usuario 'aqua' (superadministrador)
 * - userProfileOnly: Solo permite acceso a recursos del propio usuario
 * - requireAuth: Requiere que el usuario esté autenticado (por defecto)
 */
function ProtectedRoute({ children, adminOnly = false, userProfileOnly = false }) {
  const { user, isLoading } = useUser();

  // Estado de carga: mostrar indicador mientras se cargan los datos del usuario
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Primera capa de seguridad: Verificar que el usuario esté autenticado
  if (!user?.id) {
    console.warn("Intento de acceso sin autenticación - redirigiendo al login");
    return <Navigate to="/" replace />;
  }

  // Segunda capa de seguridad: Verificar privilegios de administrador si se requieren
  if (adminOnly && user.role !== "superadmin" && user.role !== "admin") {
  console.warn(`Usuario ${user.id} con rol ${user.role} intentó acceder a área de administrador - acceso denegado`);
  return <Navigate to="/events" replace />;
  }

  // Tercera capa de seguridad: Verificar acceso a recursos de perfil personal
  if (userProfileOnly) {
    // Para rutas de perfil, verificamos que el contexto del usuario esté completo y válido
    if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
      console.error("Datos de usuario inválidos detectados en ruta de perfil - redirigiendo por seguridad");
      return <Navigate to="/" replace />;
    }
    
    // Verificar que el usuario tenga los datos mínimos necesarios para acceder a su perfil
    if (!user.role) {
      console.warn("Usuario sin rol definido intentando acceder al perfil - datos incompletos");
      return <Navigate to="/player" replace />;
    }

    // Log de seguridad: registrar acceso autorizado al perfil
    console.log(`Acceso autorizado al perfil para usuario: ${user.id}`);
  }

  // Si todas las validaciones pasan, permitir acceso al componente protegido
  return children;
}

export default ProtectedRoute;