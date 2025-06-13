import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import LoginPage from "./pages/LoginPage";
import EventsPage from "./pages/EventsPage";
import PlayerPage from "./pages/PlayerPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * App.jsx con EventsPage como página principal después del login
 * 
 * FLUJO DE NAVEGACIÓN:
 * 1. LoginPage (/) - Página de autenticación
 * 2. EventsPage (/events) - Página principal con eventos (después del login)
 * 3. PlayerPage (/player) - Solo accesible durante eventos activos
 * 4. ProfilePage (/profile) - Configuración de perfil del usuario
 * 5. AdminPanel (/admin) - Solo accesible por usuario "aqua"
 */
function App() {
  return (
    <UserProvider>
      <Router>
        {/* Aplicar modo oscuro permanente a toda la aplicación */}
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            {/* Ruta pública - Login */}
            <Route path="/" element={<LoginPage />} />
            
            {/* Rutas protegidas - Requieren autenticación */}
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/player"
              element={
                <ProtectedRoute>
                  <PlayerPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute userProfileOnly={true}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* Ruta de administración - Solo para "aqua" */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Ruta catch-all - Redirige al login si la ruta no existe */}
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;