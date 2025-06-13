import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function AdminPanel() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  // Estados principales
  const [allUsers, setAllUsers] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Estados para edición de usuario
  const [editForm, setEditForm] = useState({
    id: "",
    alias: "",
    role: "participante",
    avatar: "",
    stats: {
      totalSessions: 0,
      totalTimeConnected: 0,
      averageRating: 0
    }
  });

  // Estados UI
  const [activeTab, setActiveTab] = useState("dashboard");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Cargar datos al inicializar
  useEffect(() => {
    if (user?.id !== "aqua") {
      navigate("/events");
      return;
    }
    loadAllData();
  }, [user, navigate]);

  const loadAllData = () => {
    try {
      // Cargar usuarios
      const savedUsers = localStorage.getItem("registeredUsers");
      const baseUsers = [
        { 
          id: "aqua", 
          password: "admin123", 
          role: "superadmin", 
          alias: "Aqua Admin",
          avatar: "",
          createdAt: "2024-01-01T00:00:00.000Z",
          stats: { totalSessions: 0, totalTimeConnected: 0, averageRating: 0 }
        }
      ];
      
      const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Filtrar duplicados: eliminar "aqua" de registeredUsers si existe
      const filteredRegisteredUsers = registeredUsers.filter(user => user.id !== "aqua");
      
      const allUsersData = [...baseUsers, ...filteredRegisteredUsers];
      setAllUsers(allUsersData);

      // Cargar eventos
      const savedEvents = localStorage.getItem("ytPartyEvents");
      const eventsData = savedEvents ? JSON.parse(savedEvents) : [];
      setAllEvents(eventsData);

      // Cargar registros de eventos
      const savedRegistrations = localStorage.getItem("eventRegistrations");
      const registrationsData = savedRegistrations ? JSON.parse(savedRegistrations) : {};
      setEventRegistrations(registrationsData);

      console.log("📊 Datos del admin cargados:", {
        usuarios: allUsersData.length,
        eventos: eventsData.length,
        registros: Object.keys(registrationsData).length
      });

    } catch (error) {
      console.error("Error cargando datos del admin:", error);
      showMessage("Error cargando datos", "error");
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditForm({
      id: userToEdit.id,
      alias: userToEdit.alias || userToEdit.id,
      role: userToEdit.role,
      avatar: userToEdit.avatar || "",
      stats: userToEdit.stats || {
        totalSessions: 0,
        totalTimeConnected: 0,
        averageRating: 0
      }
    });
    setShowEditUser(true);
  };

  const handleSaveUser = () => {
    if (!editForm.alias.trim()) {
      showMessage("El alias no puede estar vacío", "error");
      return;
    }

    if (editForm.alias.length < 2 || editForm.alias.length > 20) {
      showMessage("El alias debe tener entre 2 y 20 caracteres", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        // Si es el usuario "aqua", solo actualizar en memoria y contexto si es el usuario actual
        if (selectedUser.id === "aqua") {
          if (user.id === "aqua") {
            const updatedUser = { ...user, alias: editForm.alias };
            setUser(updatedUser);
          }
          
          setAllUsers(prev => 
            prev.map(u => u.id === "aqua" ? { ...u, alias: editForm.alias } : u)
          );
        } else {
          // Actualizar usuario normal en localStorage
          const savedUsers = localStorage.getItem("registeredUsers");
          const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
          
          const updatedUsers = registeredUsers.map(u => 
            u.id === selectedUser.id ? {
              ...u,
              alias: editForm.alias,
              role: editForm.role,
              avatar: editForm.avatar,
              stats: editForm.stats
            } : u
          );

          localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
          
          // FIXED: Si es el usuario actual, actualizar TODOS los lugares donde se guarda
          if (user.id === selectedUser.id) {
            const updatedCurrentUser = { 
              ...user, 
              alias: editForm.alias, 
              role: editForm.role,  // 🔥 IMPORTANTE: Incluir el rol actualizado
              avatar: editForm.avatar,
              stats: editForm.stats
            };
            
            // Actualizar contexto
            setUser(updatedCurrentUser);
            
            // Actualizar userData en localStorage (sesión actual)
            localStorage.setItem("userData", JSON.stringify(updatedCurrentUser));
            
            console.log("🔄 Usuario actual actualizado en contexto y localStorage:", updatedCurrentUser);
          }
        }

        loadAllData();
        setShowEditUser(false);
        setSelectedUser(null);
        setLoading(false);
        
        // 🆕 NUEVO: Mostrar mensaje específico para el usuario actual
        if (user.id === selectedUser.id) {
          showMessage(`Tu rol ha sido actualizado a: ${editForm.role}`, "success");
        } else {
          showMessage("Usuario actualizado correctamente");
        }

      } catch (error) {
        console.error("Error actualizando usuario:", error);
        setLoading(false);
        showMessage("Error actualizando usuario", "error");
      }
    }, 500);
  };

  const handleDeleteUser = (userId) => {
    if (userId === "aqua") {
      showMessage("No se puede eliminar al superadministrador", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        // Eliminar de registeredUsers
        const savedUsers = localStorage.getItem("registeredUsers");
        const registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
        const updatedUsers = registeredUsers.filter(u => u.id !== userId);
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

        // Eliminar de registros de eventos
        const savedRegistrations = localStorage.getItem("eventRegistrations");
        if (savedRegistrations) {
          const registrations = JSON.parse(savedRegistrations);
          Object.keys(registrations).forEach(eventId => {
            registrations[eventId] = registrations[eventId].filter(id => id !== userId);
          });
          localStorage.setItem("eventRegistrations", JSON.stringify(registrations));
        }

        loadAllData();
        setShowDeleteConfirm(null);
        setLoading(false);
        showMessage("Usuario eliminado correctamente");

      } catch (error) {
        console.error("Error eliminando usuario:", error);
        setLoading(false);
        showMessage("Error eliminando usuario", "error");
      }
    }, 500);
  };

  const getSystemStats = () => {
    const totalUsers = allUsers.length;
    const totalEvents = allEvents.length;
    const activeEvents = allEvents.filter(e => e.status === 'active').length;
    const totalRegistrations = Object.values(eventRegistrations).reduce((sum, users) => sum + users.length, 0);
    
    return {
      totalUsers,
      totalEvents,
      activeEvents,
      totalRegistrations,
      adminUsers: allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
      recentEvents: allEvents.filter(e => {
        const eventDate = e.date ? new Date(`${e.date}T${e.time}`) : new Date(e.datetime);
        const daysDiff = (new Date() - eventDate) / (1000 * 60 * 60 * 24);
        return Math.abs(daysDiff) <= 7;
      }).length
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return "0 min";
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes} min`;
  };

  const getMiniAvatarDisplay = () => {
    if (user?.avatar) {
      return (
        <img 
          src={user.avatar} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
        />
      );
    } else {
      const initial = (user?.alias || user?.id || "U").charAt(0).toUpperCase();
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-600">
          <span className="text-white text-sm font-bold">{initial}</span>
        </div>
      );
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  const stats = getSystemStats();

  return (
    <div className="min-h-screen bg-gray-900">
      
      {/* Header consistente con EventsPage */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Lado izquierdo - igual que EventsPage */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/events")}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                ← Volver a Eventos
              </button>
              <h1 className="text-3xl font-bold text-white">
                👑 Panel de Administración
              </h1>
            </div>

            {/* Lado derecho - igual que EventsPage */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-600"
                >
                  {getMiniAvatarDisplay()}
                  <span className="text-white text-sm font-medium">{user?.alias || user?.id}</span>
                  <span className="text-white text-sm">▼</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/profile");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                      >
                        <span>👤</span>
                        <span>Mi Perfil</span>
                      </button>
                      {user?.id === "aqua" && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate("/admin");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <span>👑</span>
                          <span>Panel Admin</span>
                        </button>
                      )}
                      <hr className="border-gray-700 my-1" />
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <span>🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensaje de feedback */}
          {message.text && (
            <div className="mt-4 flex justify-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                message.type === "error" 
                  ? "bg-red-900 border-red-600 text-red-300" 
                  : "bg-green-900 border-green-600 text-green-300"
              }`}>
                {message.text}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Tabs de navegación */}
        <div className="mb-8">
          <div className="flex space-x-4 bg-gray-800 p-2 rounded-lg border border-gray-700">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "dashboard" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "users" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              👥 Gestión de Usuarios
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "events" 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              📅 Historial de Eventos
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Métricas principales */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200">Total Usuarios</p>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div className="text-4xl opacity-80">👥</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200">Total Eventos</p>
                    <p className="text-3xl font-bold">{stats.totalEvents}</p>
                  </div>
                  <div className="text-4xl opacity-80">📅</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200">Eventos Activos</p>
                    <p className="text-3xl font-bold">{stats.activeEvents}</p>
                  </div>
                  <div className="text-4xl opacity-80">🔴</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200">Registros Totales</p>
                    <p className="text-3xl font-bold">{stats.totalRegistrations}</p>
                  </div>
                  <div className="text-4xl opacity-80">📝</div>
                </div>
              </div>
            </div>

            {/* Métricas adicionales */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Estadísticas del Sistema</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Administradores:</span>
                    <span className="text-white font-semibold">{stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Eventos esta semana:</span>
                    <span className="text-white font-semibold">{stats.recentEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Promedio registros/evento:</span>
                    <span className="text-white font-semibold">
                      {stats.totalEvents > 0 ? (stats.totalRegistrations / stats.totalEvents).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">🔧 Información del Sistema</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Almacenamiento:</span>
                    <span className="text-green-400 font-semibold">localStorage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última actualización:</span>
                    <span className="text-white font-semibold">Hoy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className="text-green-400 font-semibold">🟢 Operativo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">👥 Gestión de Usuarios</h2>
              <div className="text-sm text-gray-400">
                Total: {allUsers.length} usuarios
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Usuario</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Rol</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Creado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Estadísticas</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {allUsers.map(userItem => (
                      <tr key={userItem.id} className="hover:bg-gray-750 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {(userItem.alias || userItem.id).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {userItem.alias || userItem.id}
                                {userItem.id === user?.id && (
                                  <span className="text-blue-400 ml-1">(tú)</span>
                                )}
                              </p>
                              <p className="text-gray-400 text-sm">@{userItem.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            userItem.role === 'superadmin' ? 'bg-red-900 text-red-300' :
                            userItem.role === 'admin' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                            {userItem.role === 'superadmin' ? '👑 SuperAdmin' :
                             userItem.role === 'admin' ? '⚡ Admin' : '🎵 Participante'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(userItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div>
                            <div>Sesiones: {userItem.stats?.totalSessions || 0}</div>
                            <div>Tiempo: {formatTime(userItem.stats?.totalTimeConnected || 0)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditUser(userItem)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                            >
                              ✏️ Editar
                            </button>
                            {userItem.id !== "aqua" && (
                              <button
                                onClick={() => setShowDeleteConfirm(userItem.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                              >
                                🗑️ Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">📅 Historial de Eventos</h2>
              <div className="text-sm text-gray-400">
                Total: {allEvents.length} eventos
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Evento</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Estado</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Fecha</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Creador</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Registrados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {allEvents.map(event => (
                      <tr key={event.id} className="hover:bg-gray-750 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {event.banner ? (
                              <img 
                                src={event.banner} 
                                alt="Banner"
                                className="w-12 h-12 object-cover rounded border border-gray-600"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                                <span className="text-white text-lg">🎵</span>
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{event.title}</p>
                              <p className="text-gray-400 text-sm">ID: {event.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.status === 'active' ? 'bg-green-900 text-green-300' :
                            event.status === 'scheduled' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {event.status === 'active' ? '🔴 En Vivo' :
                             event.status === 'scheduled' ? '⏰ Programado' : '✅ Terminado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {event.date ? `${formatDate(event.date)} ${event.time}` : formatDate(event.datetime)}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {event.createdBy}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {eventRegistrations[event.id] ? eventRegistrations[event.id].length : 0} usuarios
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {allEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay eventos</h3>
                  <p className="text-gray-500">Los eventos creados aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal editar usuario */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">✏️ Editar Usuario: {selectedUser.id}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Alias</label>
                <input
                  type="text"
                  value={editForm.alias}
                  onChange={(e) => setEditForm(prev => ({ ...prev, alias: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  maxLength={20}
                />
              </div>

              {selectedUser.id !== "aqua" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rol</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="participante">🎵 Participante</option>
                    <option value="admin">⚡ Administrador</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sesiones</label>
                  <input
                    type="number"
                    value={editForm.stats.totalSessions}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, totalSessions: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tiempo (min)</label>
                  <input
                    type="number"
                    value={Math.floor(editForm.stats.totalTimeConnected / (1000 * 60))}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, totalTimeConnected: (parseInt(e.target.value) || 0) * 1000 * 60 }
                    }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    max="5"
                    min="0"
                    value={editForm.stats.averageRating}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      stats: { ...prev.stats, averageRating: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveUser}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Guardando..." : "💾 Guardar Cambios"}
              </button>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-red-400 mb-4">🗑️ Confirmar Eliminación</h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                ¿Estás seguro de que quieres eliminar al usuario <strong>{showDeleteConfirm}</strong>?
              </p>
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente:
                </p>
                <ul className="text-red-200 text-sm mt-2 ml-4 list-disc">
                  <li>Todos los datos del usuario</li>
                  <li>Sus registros en eventos</li>
                  <li>Sus estadísticas</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Eliminando..." : "🗑️ Sí, Eliminar"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar dropdown al hacer clic fuera */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
}

export default AdminPanel;