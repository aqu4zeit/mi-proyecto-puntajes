import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { usersDB } from "../data/usersDB";

// Lista de nombres prohibidos
const FORBIDDEN_NAMES = [
  "admin", "administrator", "root", "superuser", "moderator", "mod",
  "owner", "master", "god", "system", "server", "bot", "null", "undefined",
  "aqua", "test", "demo", "guest", "user", "player", "default"
];

function LoginPage() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [localUsers, setLocalUsers] = useState([]);

  // Función para verificar si el nombre está prohibido
  const isNameForbidden = (name) => {
    return FORBIDDEN_NAMES.includes(name.toLowerCase());
  };

  // Función para verificar si el usuario ya existe
  const userExists = (name) => {
    return localUsers.some(user => user.id.toLowerCase() === name.toLowerCase());
  };

  // Cargar usuarios al iniciar el componente
  useEffect(() => {
  const savedUsers = localStorage.getItem("registeredUsers");
  
  if (savedUsers) {
    const parsedUsers = JSON.parse(savedUsers);
    // FIXED: Filtrar "aqua" de registeredUsers para evitar duplicados
    const filteredUsers = parsedUsers.filter(user => user.id !== "aqua");
    const allUsers = [...usersDB, ...filteredUsers];
    setLocalUsers(allUsers);
    console.log("👥 Usuarios cargados:", allUsers);
  } else {
    setLocalUsers(usersDB);
    console.log("👥 Solo usuarios base cargados:", usersDB);
  }
}, []);

  // Función para guardar usuarios nuevos en localStorage
  const saveUsersToStorage = (newUsersList) => {
    const usersToSave = newUsersList.filter(user => 
      !usersDB.some(baseUser => baseUser.id === user.id)
    );
    
    localStorage.setItem("registeredUsers", JSON.stringify(usersToSave));
    console.log("💾 Usuarios guardados en localStorage:", usersToSave);
  };

  const handleAuth = () => {
    const id = username.trim().toLowerCase();

    // Validaciones básicas
    if (!id || !password) {
      alert("⚠️ Rellena todos los campos");
      return;
    }

    if (id.length < 3) {
      alert("⚠️ El usuario debe tener al menos 3 caracteres");
      return;
    }

    if (password.length < 4) {
      alert("⚠️ La contraseña debe tener al menos 4 caracteres");
      return;
    }

    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(id)) {
      alert("⚠️ El usuario solo puede contener letras, números, guiones (-) y guiones bajos (_)");
      return;
    }

    if (isNew) {
      // REGISTRO DE NUEVO USUARIO
      console.log("🔍 Intentando registrar usuario:", id);
      
      if (isNameForbidden(id)) {
        alert("❌ Este nombre de usuario no está permitido. Por favor elige otro.");
        return;
      }

      if (userExists(id)) {
        alert("❌ Este usuario ya existe. Prueba con otro nombre.");
        return;
      }

      const newUser = { 
        id, 
        password, 
        role: "participante",
        alias: id,
        avatar: "",
        createdAt: new Date().toISOString(),
        stats: {
          totalSessions: 0,
          totalTimeConnected: 0,
          averageRating: 0
        }
      };

      const updatedUsers = [...localUsers, newUser];
      setLocalUsers(updatedUsers);
      saveUsersToStorage(updatedUsers);

      console.log("✅ Usuario registrado exitosamente:", newUser);
      alert("🎉 Cuenta creada con éxito. Ahora puedes iniciar sesión.");
      
      setUsername("");
      setPassword("");
      setIsNew(false);
      return;
    }

    // INICIO DE SESIÓN
    console.group("🔐 Iniciando proceso de login");
    console.log("🔍 Intentando iniciar sesión:", id);
    
    const user = localUsers.find(u => u.id === id && u.password === password);
    
    if (!user) {
      alert("❌ Usuario o contraseña incorrecta");
      console.log("❌ Login fallido para:", id);
      console.groupEnd();
      return;
    }

    console.log("✅ Usuario encontrado en la base de datos:", user);
    
    const sessionUser = {
      id: user.id,
      role: user.role,
      alias: user.alias || user.id,
      avatar: user.avatar || "",
      joinTime: Date.now(),
      createdAt: user.createdAt,
      stats: user.stats || {
        totalSessions: 0,
        totalTimeConnected: 0,
        averageRating: 0
      }
    };

    console.log("📋 Objeto de sesión creado con datos completos:", sessionUser);
    setUser(sessionUser);
    console.log("🎉 Login completado exitosamente");
    console.groupEnd();

    navigate("/events");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      
      {/* Título principal */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
          🎵 YouTube Party
        </h1>
        <p className="text-gray-300 text-lg">
          Disfruta música con tus amigos en tiempo real
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          {isNew ? "🆕 Crear cuenta" : "🔐 Iniciar sesión"}
        </h2>

        {/* Campo usuario */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Usuario
          </label>
          <input
            type="text"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     outline-none text-white placeholder-gray-400
                     hover:bg-gray-650 transition-colors duration-200"
            maxLength={20}
          />
        </div>

        {/* Campo contraseña */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     outline-none text-white placeholder-gray-400
                     hover:bg-gray-650 transition-colors duration-200"
            maxLength={30}
          />
        </div>

        {/* Botón principal */}
        <button
          onClick={handleAuth}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                   text-white font-semibold py-3 px-4 rounded-lg 
                   transition-all duration-200 mb-4 shadow-lg
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isNew ? "🎉 Registrarse" : "🚀 Ingresar"}
        </button>

        {/* Botón cambiar modo */}
        <button
          onClick={() => {
            setIsNew(!isNew);
            setUsername("");
            setPassword("");
          }}
          className="w-full text-blue-400 hover:text-blue-300 
                   font-medium py-2 transition-colors duration-200"
        >
          {isNew ? "Ya tengo cuenta" : "Crear una nueva cuenta"}
        </button>

        {/* Información de usuarios registrados */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {localUsers.length} usuarios registrados en la plataforma
          </p>
        </div>

        {/* Panel de información de debug mejorado */}
        <div className="mt-4 p-4 bg-gray-750 rounded-lg text-xs text-gray-300 border border-gray-600">
          <p className="text-sm font-semibold mb-2 text-blue-400">🔍 Debug Info</p>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-700 p-2 rounded">
              <p className="text-gray-400">Usuarios:</p>
              <p className="font-bold text-white">{localUsers.length}</p>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <p className="text-gray-400">LocalStorage:</p>
              <p className="font-bold text-white">{localStorage.getItem("registeredUsers") ? "✅ Activo" : "❌ Vacío"}</p>
            </div>
          </div>
          
          <details className="mt-3">
            <summary className="cursor-pointer hover:text-gray-100 transition-colors duration-200 font-medium">
              📋 Ver lista de usuarios
            </summary>
            <div className="mt-3 max-h-32 overflow-y-auto">
              {localUsers.map(user => (
                <div key={user.id} className="text-xs p-2 border-b border-gray-600 hover:bg-gray-700 rounded transition-colors duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-blue-400">{user.id}</span>
                      <span className="text-gray-400 ml-2">- {user.role}</span>
                    </div>
                    <div className="flex gap-1">
                      {user.alias && user.alias !== user.id && (
                        <span className="bg-green-600 text-white px-1 rounded text-xs">A</span>
                      )}
                      {user.avatar && (
                        <span className="bg-purple-600 text-white px-1 rounded text-xs">📷</span>
                      )}
                    </div>
                  </div>
                  {user.alias && user.alias !== user.id && (
                    <div className="text-green-400 text-xs mt-1">Alias: {user.alias}</div>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>🌙 Tema oscuro optimizado para sesiones nocturnas</p>
        <p className="mt-1">Diseñado para la mejor experiencia musical</p>
      </div>
    </div>
  );
}

export default LoginPage;