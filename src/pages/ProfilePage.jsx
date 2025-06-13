import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function ProfilePage() {
  const { user, setUser } = useUser(); // ❌ REMOVIDO refreshUser de aquí
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

  // 🔥 FIXED: Función para verificar actualizaciones sin causar loops
  const checkForRoleUpdates = useCallback(() => {
    if (!user?.id || user.id === "aqua") return;
    
    try {
      const savedUsers = localStorage.getItem("registeredUsers");
      if (!savedUsers) return;
      
      const registeredUsers = JSON.parse(savedUsers);
      const updatedUserData = registeredUsers.find(u => u.id === user.id);
      
      if (updatedUserData && updatedUserData.role !== user.role) {
        console.log(`🔄 Rol actualizado detectado: ${user.role} → ${updatedUserData.role}`);
        
        // Actualizar el usuario en el contexto con el nuevo rol
        const updatedUser = { ...user, role: updatedUserData.role };
        setUser(updatedUser);
        
        showMessage(`Tu rol ha sido actualizado a: ${updatedUserData.role}`, "success");
      }
    } catch (error) {
      console.error("Error verificando actualizaciones de rol:", error);
    }
  }, [user, setUser]); // useCallback para evitar recreación innecesaria

  // 🔥 FIXED: useEffect simplificado - SIN refreshUser en dependencias
  useEffect(() => {
    if (!user?.id) {
      console.error("ProfilePage: No hay usuario autenticado");
      navigate("/", { replace: true });
      return;
    }

    console.log(`ProfilePage: Cargando perfil para usuario: ${user.id}`);
    loadProfileData();
    
    // Solo verificar actualizaciones de rol UNA VEZ al cargar
    checkForRoleUpdates();
  }, [user?.id, navigate]); // ❌ REMOVIDO: refreshUser, checkForRoleUpdates de dependencias

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

  // NUEVO: Función para resetear alias al ID original
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

  // NUEVO: Función para eliminar avatar
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
      
      {/* Header siguiendo el patrón nuevo */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Botón volver - lado izquierdo */}
            <button
              onClick={() => navigate(-1)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              ← Volver
            </button>

            {/* Título centrado */}
            <h1 className="text-3xl font-bold text-white text-center flex-1">
              Configuración de perfil
            </h1>

            {/* Dropdown de perfil - lado derecho */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-600"
              >
                {getMiniAvatarDisplay()}
                <span className="text-white text-sm font-medium">{profileData.alias}</span>
                <span className="text-white text-sm">▼</span>
              </button>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        // Ya estamos en perfil, solo cerrar dropdown
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

          {/* Mensajes de feedback */}
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

      {/* Resto del componente igual... */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Sidebar izquierda - Información básica del usuario */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 sticky top-8">
              
              {/* Avatar clickeable */}
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

              {/* ID */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-400 block mb-1">ID</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <span className="text-white font-medium">{user.id}</span>
                </div>
              </div>

              {/* Alias */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-400 block mb-1">Alias</label>
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <span className="text-white font-medium">{profileData.alias}</span>
                </div>
              </div>

              {/* Rol */}
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

          {/* Panel principal - Resto del contenido igual */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 min-h-screen overflow-y-auto">
              <div className="p-6">
                
                {/* Sección de Estadísticas */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-6">📊 Estadísticas</h3>
                  
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
                      <span className="text-gray-400">Rating promedio:</span>
                      <span className="text-purple-400 font-semibold">
                        {profileData.averageRating > 0 ? `${profileData.averageRating.toFixed(1)} ⭐` : "Sin calificar"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fecha de creación:</span>
                      <span className="text-gray-300 font-semibold">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Separador */}
                <div className="border-t border-gray-600 my-8"></div>

                {/* Sección de Cambiar Información */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">⚙️ Cambiar Información</h3>

                  {/* Formulario para editar alias */}
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

                  {/* Formulario para cambiar contraseña */}
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