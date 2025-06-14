import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function ProfilePage() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados para la información del perfil
  const [profileData, setProfileData] = useState({
    alias: "",
    avatar: "",
    hoursPlayed: 0,
    eventsPlayed: 0,
    averageRating: 0
  });

  // Estados para los formularios de edición
  const [editMode, setEditMode] = useState({
    alias: false,
    password: false
  });

  const [newAlias, setNewAlias] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  
  // 🆕 NUEVOS ESTADOS para pestañas y eventos
  const [activeTab, setActiveTab] = useState("profile"); // "profile" o "stats"
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userEventHistory, setUserEventHistory] = useState([]);
  const [eventRatings, setEventRatings] = useState({});

  // 🆕 MOCK DATA para historial de eventos del usuario
  const mockUserEventHistory = [
    {
      id: "event_1",
      title: "Noche de Rock Clásico",
      date: "2024-11-15",
      time: "20:00",
      participatedAt: "2024-11-15T20:00:00Z",
      songsCount: 5,
      userAverageRating: 4.2,
      globalAverageRating: 4.1
    },
    {
      id: "event_2", 
      title: "Pop Hits Session",
      date: "2024-11-20",
      time: "19:30",
      participatedAt: "2024-11-20T19:30:00Z",
      songsCount: 4,
      userAverageRating: 3.8,
      globalAverageRating: 4.0
    },
    {
      id: "event_3",
      title: "Música Latina",
      date: "2024-11-25", 
      time: "21:00",
      participatedAt: "2024-11-25T21:00:00Z",
      songsCount: 6,
      userAverageRating: 4.5,
      globalAverageRating: 4.3
    }
  ];

  // 🆕 MOCK DATA para calificaciones por evento
  const mockEventRatings = {
    "event_1": {
      songs: [
        { id: "song_1", title: "Bohemian Rhapsody - Queen", userRating: 5, globalAverage: 4.8, duration: "5:55" },
        { id: "song_2", title: "Hotel California - Eagles", userRating: 4, globalAverage: 4.6, duration: "6:30" },
        { id: "song_3", title: "Stairway to Heaven - Led Zeppelin", userRating: 5, globalAverage: 4.9, duration: "8:02" },
        { id: "song_4", title: "Sweet Child O' Mine - Guns N' Roses", userRating: 3, globalAverage: 4.2, duration: "5:03" },
        { id: "song_5", title: "November Rain - Guns N' Roses", userRating: 4, globalAverage: 4.0, duration: "8:57" }
      ],
      userAverage: 4.2,
      globalAverage: 4.5
    },
    "event_2": {
      songs: [
        { id: "song_6", title: "Anti-Hero - Taylor Swift", userRating: 4, globalAverage: 4.1, duration: "3:20" },
        { id: "song_7", title: "As It Was - Harry Styles", userRating: 3, globalAverage: 3.8, duration: "2:47" },
        { id: "song_8", title: "Heat Waves - Glass Animals", userRating: 4, globalAverage: 4.2, duration: "3:58" },
        { id: "song_9", title: "Bad Habit - Steve Lacy", userRating: 4, globalAverage: 3.9, duration: "3:51" }
      ],
      userAverage: 3.8,
      globalAverage: 4.0
    },
    "event_3": {
      songs: [
        { id: "song_10", title: "Despacito - Luis Fonsi ft. Daddy Yankee", userRating: 5, globalAverage: 4.5, duration: "3:47" },
        { id: "song_11", title: "La Vida Es Una Fiesta - Manu Chao", userRating: 4, globalAverage: 4.0, duration: "3:15" },
        { id: "song_12", title: "Bamboléo - Gipsy Kings", userRating: 5, globalAverage: 4.8, duration: "3:28" },
        { id: "song_13", title: "Macarena - Los Del Rio", userRating: 3, globalAverage: 3.5, duration: "4:12" },
        { id: "song_14", title: "La Bamba - Ritchie Valens", userRating: 5, globalAverage: 4.6, duration: "2:06" },
        { id: "song_15", title: "Oye Como Va - Santana", userRating: 5, globalAverage: 4.4, duration: "4:18" }
      ],
      userAverage: 4.5,
      globalAverage: 4.3
    }
  };

  // Función para verificar actualizaciones de rol
  const checkForRoleUpdates = useCallback(() => {
    if (!user?.id || user.id === "aqua") return;
    
    try {
      const savedUsers = localStorage.getItem("registeredUsers");
      if (!savedUsers) return;
      
      const registeredUsers = JSON.parse(savedUsers);
      const updatedUserData = registeredUsers.find(u => u.id === user.id);
      
      if (updatedUserData && updatedUserData.role !== user.role) {
        console.log(`🔄 Rol actualizado detectado: ${user.role} → ${updatedUserData.role}`);
        
        const updatedUser = { ...user, role: updatedUserData.role };
        setUser(updatedUser);
        
        showMessage(`Tu rol ha sido actualizado a: ${updatedUserData.role}`, "success");
      }
    } catch (error) {
      console.error("Error verificando actualizaciones de rol:", error);
    }
  }, [user, setUser]);

  useEffect(() => {
    if (!user?.id) {
      console.error("ProfilePage: No hay usuario autenticado");
      navigate("/", { replace: true });
      return;
    }

    console.log(`ProfilePage: Cargando perfil para usuario: ${user.id}`);
    loadProfileData();
    checkForRoleUpdates();

    // 🆕 Cargar datos mock del historial de eventos
    setUserEventHistory(mockUserEventHistory);
    setEventRatings(mockEventRatings);
  }, [user?.id, navigate]);

  const loadProfileData = () => {
    const baseData = {
      alias: user.alias || user.id,
      avatar: user.avatar || "",
      hoursPlayed: 0,
      eventsPlayed: 0,
      averageRating: 0
    };

    const userStatsKey = `userStats_${user.id}`;
    const savedStats = localStorage.getItem(userStatsKey);
    
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        baseData.hoursPlayed = Math.round((stats.totalTimeConnected || 0) / (1000 * 60 * 60 * 100)) / 100;
        baseData.eventsPlayed = stats.totalSessions || 0;
        baseData.averageRating = stats.averageRating || 0;
      } catch (error) {
        console.warn(`Error cargando estadísticas del usuario ${user.id}:`, error);
      }
    }

    // 🆕 Calcular estadísticas basadas en mock data
    baseData.eventsPlayed = mockUserEventHistory.length;
    if (mockUserEventHistory.length > 0) {
      const totalRating = mockUserEventHistory.reduce((sum, event) => sum + event.userAverageRating, 0);
      baseData.averageRating = totalRating / mockUserEventHistory.length;
    }

    setProfileData(baseData);
    setNewAlias(baseData.alias);
    
    console.log("📊 Datos del perfil cargados:", baseData);
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleAliasUpdate = () => {
    if (!user?.id) {
      console.error("No hay usuario autenticado");
      navigate("/", { replace: true });
      return;
    }

    const trimmedAlias = newAlias.trim();

    if (!trimmedAlias) {
      showMessage("El alias no puede estar vacío", "error");
      return;
    }

    if (trimmedAlias.length < 2 || trimmedAlias.length > 20) {
      showMessage("El alias debe tener entre 2 y 20 caracteres", "error");
      return;
    }

    const allowedPattern = /^[a-zA-Z0-9_\-\sáéíóúñü]+$/i;
    if (!allowedPattern.test(trimmedAlias)) {
      showMessage("El alias contiene caracteres no permitidos", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        console.log(`🔄 Actualizando alias de ${user.alias} a ${trimmedAlias}`);
        
        const updatedUser = { ...user, alias: trimmedAlias };
        setUser(updatedUser);
        
        setProfileData(prev => ({ ...prev, alias: trimmedAlias }));
        setEditMode(prev => ({ ...prev, alias: false }));
        setLoading(false);
        showMessage("Alias actualizado correctamente");
        
        console.log("🎉 Alias actualizado exitosamente");

      } catch (error) {
        console.error("💥 Error actualizando alias:", error);
        setLoading(false);
        showMessage("Error actualizando el alias: " + error.message, "error");
      }
    }, 500);
  };

  const handleResetAlias = () => {
    setLoading(true);
    
    setTimeout(() => {
      try {
        const updatedUser = { ...user, alias: user.id };
        setUser(updatedUser);
        
        setProfileData(prev => ({ ...prev, alias: user.id }));
        setNewAlias(user.id);
        setEditMode(prev => ({ ...prev, alias: false }));
        setLoading(false);
        showMessage("Alias restaurado al original");
        
        console.log("🔄 Alias restaurado al ID original");
      } catch (error) {
        console.error("💥 Error restaurando alias:", error);
        setLoading(false);
        showMessage("Error restaurando alias: " + error.message, "error");
      }
    }, 500);
  };

  const handlePasswordUpdate = () => {
    if (!user?.id) {
      console.error("No hay usuario autenticado");
      navigate("/", { replace: true });
      return;
    }

    const { current, new: newPass, confirm } = passwordForm;

    if (!current || !newPass || !confirm) {
      showMessage("Todos los campos son obligatorios", "error");
      return;
    }

    if (newPass !== confirm) {
      showMessage("Las contraseñas nuevas no coinciden", "error");
      return;
    }

    if (newPass.length < 4) {
      showMessage("La nueva contraseña debe tener al menos 4 caracteres", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const savedUsersStr = localStorage.getItem("registeredUsers");
        if (!savedUsersStr) {
          throw new Error("No se encontraron usuarios registrados");
        }

        const savedUsers = JSON.parse(savedUsersStr);
        const userIndex = savedUsers.findIndex(u => u.id === user.id);

        if (userIndex === -1) {
          throw new Error("Usuario no encontrado en la base de datos");
        }

        if (savedUsers[userIndex].password !== current) {
          showMessage("La contraseña actual es incorrecta", "error");
          setLoading(false);
          return;
        }

        savedUsers[userIndex].password = newPass;
        localStorage.setItem("registeredUsers", JSON.stringify(savedUsers));

        setPasswordForm({ current: "", new: "", confirm: "" });
        setEditMode(prev => ({ ...prev, password: false }));
        setLoading(false);
        showMessage("Contraseña actualizada correctamente");
        
        console.log("🎉 Contraseña actualizada exitosamente");

      } catch (error) {
        console.error("💥 Error cambiando contraseña:", error);
        setLoading(false);
        showMessage("Error: " + error.message, "error");
      }
    }, 800);
  };

  const handleAvatarChange = (event) => {
    if (!user?.id) {
      console.error("No hay usuario autenticado");
      navigate("/", { replace: true });
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage("Por favor selecciona un archivo de imagen válido", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("La imagen debe ser menor a 2MB", "error");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const avatarData = e.target.result;
        console.log("🖼️ Procesando nuevo avatar...");
        
        const updatedUser = { ...user, avatar: avatarData };
        setUser(updatedUser);
        
        setProfileData(prev => ({ ...prev, avatar: avatarData }));
        
        setLoading(false);
        showMessage("Avatar actualizado correctamente");
        
        console.log("🎉 Avatar actualizado exitosamente");

      } catch (error) {
        console.error("💥 Error procesando avatar:", error);
        setLoading(false);
        showMessage("Error procesando la imagen: " + error.message, "error");
      }
    };

    reader.onerror = () => {
      console.error("💥 Error leyendo archivo");
      setLoading(false);
      showMessage("Error leyendo el archivo", "error");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setLoading(true);
    
    setTimeout(() => {
      try {
        const updatedUser = { ...user, avatar: "" };
        setUser(updatedUser);
        
        setProfileData(prev => ({ ...prev, avatar: "" }));
        setLoading(false);
        showMessage("Avatar eliminado correctamente");
        
        console.log("🖼️ Avatar eliminado");
      } catch (error) {
        console.error("💥 Error eliminando avatar:", error);
        setLoading(false);
        showMessage("Error eliminando avatar: " + error.message, "error");
      }
    }, 500);
  };

  // 🆕 Función para manejar selección de evento
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  // 🆕 Función para formatear fecha
  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // 🆕 Función para renderizar estrellas
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-600"}>
        ⭐
      </span>
    ));
  };

  const getAvatarDisplay = () => {
    if (profileData.avatar) {
      return (
        <img 
          src={profileData.avatar} 
          alt="Avatar" 
          className="w-20 h-20 rounded-full object-cover border-3 border-gray-600 shadow-xl hover:border-blue-500 transition-colors duration-200"
        />
      );
    } else {
      const initial = (profileData.alias || user?.id || "U").charAt(0).toUpperCase();
      return (
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-3 border-gray-600 shadow-xl hover:border-blue-500 transition-colors duration-200">
          <span className="text-white text-2xl font-bold">{initial}</span>
        </div>
      );
    }
  };

  const getMiniAvatarDisplay = () => {
    if (profileData.avatar) {
      return (
        <img 
          src={profileData.avatar} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
        />
      );
    } else {
      const initial = (profileData.alias || user?.id || "U").charAt(0).toUpperCase();
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-600">
          <span className="text-white text-sm font-bold">{initial}</span>
        </div>
      );
    }
  };

  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");
    setUser(null);
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center bg-gray-800 p-8 rounded-xl border border-gray-700">
          <h1 className="text-3xl font-bold text-red-400 mb-4">
            🚫 Acceso no autorizado
          </h1>
          <p className="text-gray-300 mb-6">
            Debes iniciar sesión para ver tu perfil
          </p>
          <button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg"
          >
            🏠 Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            <button
              onClick={() => navigate(-1)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              ← Volver
            </button>

            <h1 className="text-3xl font-bold text-white text-center flex-1">
              👤 Mi Perfil
            </h1>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-600"
              >
                {getMiniAvatarDisplay()}
                <span className="text-white text-sm font-medium">{profileData.alias}</span>
                <span className="text-white text-sm">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => setShowDropdown(false)}
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
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar izquierda */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 sticky top-8">
              
              <div className="text-center mb-6">
                <div 
                  className="inline-block cursor-pointer hover:opacity-80 transition-opacity relative"
                  onClick={() => fileInputRef.current?.click()}
                  title="Haz clic para cambiar tu avatar"
                >
                  {getAvatarDisplay()}
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-gray-800 hover:bg-blue-500 transition-colors duration-200">
                    ✏️
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">
                    Haz clic para cambiar
                  </p>
                  {profileData.avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      🗑️ Eliminar avatar
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-400 block mb-1">ID</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <span className="text-white font-medium">{user.id}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-400 block mb-1">Alias</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <span className="text-white font-medium">{profileData.alias}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-400 block mb-1">Rol</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <span className={`font-medium ${
                    user.role === 'superadmin' ? 'text-red-300' : 
                    user.role === 'admin' ? 'text-yellow-300' : 'text-blue-300'
                  }`}>
                    {user.role === 'superadmin' ? '👑 Super Administrador' : 
                     user.role === 'admin' ? '⚡ Administrador' : '🎵 Participante'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Panel principal rediseñado */}
          <div className="lg:col-span-3">
            
            {/* 🆕 Navegación rediseñada con pills separados */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <div
                  onClick={() => {
                    setActiveTab("profile");
                    setSelectedEvent(null);
                  }}
                  className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 cursor-pointer select-none text-center ${
                    activeTab === "profile"
                      ? "bg-blue-600 text-white shadow-lg transform scale-105"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600"
                  }`}
                >
                  👤 Información de Perfil
                </div>
                <div
                  onClick={() => {
                    setActiveTab("stats");
                    setSelectedEvent(null);
                  }}
                  className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 cursor-pointer select-none text-center ${
                    activeTab === "stats"
                      ? "bg-blue-600 text-white shadow-lg transform scale-105"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600"
                  }`}
                >
                  📊 Estadísticas e Historial
                </div>
              </div>
            </div>

            {/* Contenido de las pestañas */}
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
              <div className="p-6">
                
                {/* Pestaña Información de Perfil */}
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6">⚙️ Configuración de la Cuenta</h3>

                      {/* Cambiar Alias */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-white">✏️ Cambiar Alias</h4>
                          {!editMode.alias && (
                            <button
                              onClick={() => setEditMode(prev => ({ ...prev, alias: true }))}
                              className="text-blue-400 hover:text-blue-300 font-medium bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              Editar
                            </button>
                          )}
                        </div>

                        {editMode.alias ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nuevo alias
                              </label>
                              <input
                                type="text"
                                value={newAlias}
                                onChange={(e) => setNewAlias(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         text-white placeholder-gray-400
                                         hover:bg-gray-650 transition-colors duration-200"
                                placeholder="Ingresa tu nuevo alias"
                                maxLength={20}
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                {newAlias.length}/20 caracteres
                              </p>
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                onClick={handleAliasUpdate}
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
                              >
                                {loading ? "Guardando..." : "💾 Guardar"}
                              </button>
                              <button
                                onClick={handleResetAlias}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
                              >
                                {loading ? "Restaurando..." : "🔄 Usar ID original"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditMode(prev => ({ ...prev, alias: false }));
                                  setNewAlias(profileData.alias);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                            <p className="text-gray-300">
                              Tu alias actual es: <span className="font-semibold text-white">{profileData.alias}</span>
                              {profileData.alias !== user.id && (
                                <span className="text-gray-400 text-sm ml-2">(Original: {user.id})</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cambiar Contraseña */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-white">🔒 Cambiar Contraseña</h4>
                          {!editMode.password && (
                            <button
                              onClick={() => setEditMode(prev => ({ ...prev, password: true }))}
                              className="text-blue-400 hover:text-blue-300 font-medium bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              Cambiar
                            </button>
                          )}
                        </div>

                        {editMode.password ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña actual
                              </label>
                              <input
                                type="password"
                                value={passwordForm.current}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         text-white placeholder-gray-400
                                         hover:bg-gray-650 transition-colors duration-200"
                                placeholder="Ingresa tu contraseña actual"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nueva contraseña
                              </label>
                              <input
                                type="password"
                                value={passwordForm.new}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         text-white placeholder-gray-400
                                         hover:bg-gray-650 transition-colors duration-200"
                                placeholder="Ingresa tu nueva contraseña"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirmar nueva contraseña
                              </label>
                              <input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         text-white placeholder-gray-400
                                         hover:bg-gray-650 transition-colors duration-200"
                                placeholder="Confirma tu nueva contraseña"
                              />
                            </div>

                            <div className="flex space-x-3">
                              <button
                                onClick={handlePasswordUpdate}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                              >
                                {loading ? "Actualizando..." : "🔄 Actualizar Contraseña"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditMode(prev => ({ ...prev, password: false }));
                                  setPasswordForm({ current: "", new: "", confirm: "" });
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                              >
                                ❌ Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                            <p className="text-gray-300">
                              Haz clic en "Cambiar" para actualizar tu contraseña de forma segura.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Pestaña Estadísticas e Historial */}
                {activeTab === "stats" && (
                  <div className="grid grid-cols-12 gap-6">
                    
                    {/* Panel Izquierdo - Estadísticas + Lista de Eventos */}
                    <div className="col-span-5 space-y-6">
                      
                      {/* Estadísticas Generales */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">📊 Mis Estadísticas</h3>
                        
                        <div className="space-y-4 text-gray-300">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Horas jugadas totales:</span>
                            <span className="text-blue-400 font-semibold">{profileData.hoursPlayed.toFixed(1)} horas</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Eventos completados:</span>
                            <span className="text-green-400 font-semibold">{profileData.eventsPlayed} eventos</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Rating promedio general:</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-400 font-semibold">
                                {profileData.averageRating > 0 ? profileData.averageRating.toFixed(1) : "0.0"}
                              </span>
                              <div className="flex">
                                {renderStars(profileData.averageRating)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Fecha de creación:</span>
                            <span className="text-gray-300 font-semibold">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Historial de Eventos */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">🎵 Historial de Eventos</h4>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {userEventHistory.map(event => (
                            <div
                              key={event.id}
                              onClick={() => handleEventSelect(event)}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                selectedEvent?.id === event.id
                                  ? "bg-blue-900 border-blue-500 shadow-lg shadow-blue-500/20"
                                  : "bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
                              }`}
                            >
                              <h5 className="font-semibold text-white text-sm mb-2">{event.title}</h5>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>📅 {formatEventDate(event.date)} - {event.time}</div>
                                <div className="flex justify-between">
                                  <span>🎵 {event.songsCount} canciones</span>
                                  <div className="flex items-center space-x-2">
                                    <span>Tu promedio:</span>
                                    <div className="flex items-center space-x-1">
                                      <span className="text-purple-400 font-semibold">
                                        {event.userAverageRating.toFixed(1)}
                                      </span>
                                      {renderStars(event.userAverageRating)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {userEventHistory.length === 0 && (
                            <div className="text-center py-8">
                              <div className="text-4xl mb-2">🎵</div>
                              <p className="text-gray-400 text-sm">
                                Aún no has participado en eventos
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel Derecho - Detalles del Evento Seleccionado */}
                    <div className="col-span-7">
                      {selectedEvent ? (
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">
                              🎬 {selectedEvent.title}
                            </h3>
                            <button
                              onClick={() => setSelectedEvent(null)}
                              className="text-gray-400 hover:text-gray-300 p-2 rounded transition-colors duration-200"
                            >
                              ❌
                            </button>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Fecha del evento:</span>
                                <p className="text-white font-medium">{formatEventDate(selectedEvent.date)} - {selectedEvent.time}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Total de canciones:</span>
                                <p className="text-white font-medium">{selectedEvent.songsCount} canciones</p>
                              </div>
                            </div>
                          </div>

                          {/* Lista de Canciones Calificadas */}
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {eventRatings[selectedEvent.id]?.songs.map((song, index) => (
                              <div key={song.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="text-gray-400 text-sm">#{index + 1}</span>
                                      <h5 className="font-medium text-white text-sm">{song.title}</h5>
                                    </div>
                                    <p className="text-xs text-gray-400">⏱️ {song.duration}</p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-6">
                                    {/* Tu Calificación */}
                                    <div className="text-center">
                                      <p className="text-xs text-gray-400 mb-1">Tu Calificación</p>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-purple-400 font-semibold text-sm">
                                          {song.userRating.toFixed(1)}
                                        </span>
                                        <div className="flex">
                                          {renderStars(song.userRating)}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Promedio General */}
                                    <div className="text-center">
                                      <p className="text-xs text-gray-400 mb-1">Promedio General</p>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-blue-400 font-semibold text-sm">
                                          {song.globalAverage.toFixed(1)}
                                        </span>
                                        <div className="flex">
                                          {renderStars(song.globalAverage)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Resumen Final */}
                          <div className="mt-6 bg-gray-700 rounded-lg p-4 border-2 border-blue-600">
                            <h4 className="text-lg font-semibold text-white mb-4 text-center">
                              📊 Resumen del Evento
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="text-center">
                                <p className="text-gray-400 text-sm mb-2">Tu Promedio General</p>
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-purple-400 font-bold text-xl">
                                    {eventRatings[selectedEvent.id]?.userAverage.toFixed(1)}
                                  </span>
                                  <div className="flex">
                                    {renderStars(eventRatings[selectedEvent.id]?.userAverage || 0)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <p className="text-gray-400 text-sm mb-2">Promedio General del Evento</p>
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-blue-400 font-bold text-xl">
                                    {eventRatings[selectedEvent.id]?.globalAverage.toFixed(1)}
                                  </span>
                                  <div className="flex">
                                    {renderStars(eventRatings[selectedEvent.id]?.globalAverage || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-8xl mb-4">🎵</div>
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                              Selecciona un evento
                            </h3>
                            <p className="text-gray-500">
                              Haz clic en un evento de tu historial para ver las canciones que calificaste
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>

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

export default ProfilePage;