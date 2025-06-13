import { createContext, useContext, useState, useEffect } from "react";

/**
 * UserContext mejorado con manejo de persistencia y estados de carga
 * 
 * FIX: Previene duplicación del usuario "aqua" en el sistema
 * NUEVO: Actualiza automáticamente el rol del usuario cuando cambia
 */
const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Función para cargar los datos más recientes del usuario desde localStorage
   * FIXED: Maneja correctamente el usuario "aqua" para evitar duplicados
   * NUEVO: Incluye actualización automática de rol
   */
  const loadUserFromStorage = () => {
    console.group("🔄 Cargando datos del usuario desde localStorage");
    
    try {
      const userDataStr = localStorage.getItem("userData");
      if (!userDataStr) {
        console.log("No hay userData en localStorage");
        setIsLoading(false);
        console.groupEnd();
        return null;
      }

      const userData = JSON.parse(userDataStr);
      console.log("userData encontrado:", userData);

      // Si es el usuario "aqua", no buscar en registeredUsers
      if (userData.id === "aqua") {
        console.log("Usuario aqua detectado - usando datos base");
        console.groupEnd();
        return userData;
      }

      // Para otros usuarios, buscar datos actualizados en registeredUsers
      const registeredUsersStr = localStorage.getItem("registeredUsers");
      if (registeredUsersStr) {
        const registeredUsers = JSON.parse(registeredUsersStr);
        const updatedUserData = registeredUsers.find(u => u.id === userData.id);
        
        if (updatedUserData) {
          console.log("Datos actualizados encontrados en registeredUsers:", updatedUserData);
          
          const mergedUser = {
            ...userData,
            alias: updatedUserData.alias,
            avatar: updatedUserData.avatar,
            role: updatedUserData.role,  // 🔥 IMPORTANTE: Incluir el rol actualizado
            stats: updatedUserData.stats,
          };
          
          console.log("Datos del usuario combinados:", mergedUser);
          
          // 🆕 NUEVO: Si el rol cambió, actualizar también userData
          if (userData.role !== updatedUserData.role) {
            console.log(`🔄 Rol actualizado detectado: ${userData.role} → ${updatedUserData.role}`);
            localStorage.setItem("userData", JSON.stringify(mergedUser));
          }
          
          console.groupEnd();
          return mergedUser;
        }
      }

      console.log("Usando userData original");
      console.groupEnd();
      return userData;

    } catch (error) {
      console.error("Error cargando datos del usuario:", error);
      console.groupEnd();
      return null;
    }
  };

  /**
   * Función mejorada para actualizar el usuario
   * FIXED: Maneja "aqua" correctamente sin duplicar en registeredUsers
   */
  const updateUser = (updatedUserData) => {
    console.group("💾 Actualizando datos del usuario");
    console.log("Datos nuevos:", updatedUserData);

    try {
      setUser(updatedUserData);
      localStorage.setItem("userData", JSON.stringify(updatedUserData));
      console.log("✅ userData actualizado");

      // Si es "aqua", NO actualizar registeredUsers
      if (updatedUserData.id === "aqua") {
        console.log("Usuario aqua - no actualizar registeredUsers");
        console.groupEnd();
        return;
      }

      // Solo actualizar registeredUsers para usuarios normales
      const registeredUsersStr = localStorage.getItem("registeredUsers");
      let registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
      
      // Asegurar que "aqua" NO esté en registeredUsers
      registeredUsers = registeredUsers.filter(u => u.id !== "aqua");
      
      const userIndex = registeredUsers.findIndex(u => u.id === updatedUserData.id);

      if (userIndex !== -1) {
        registeredUsers[userIndex] = {
          ...registeredUsers[userIndex],
          alias: updatedUserData.alias,
          avatar: updatedUserData.avatar,
          role: updatedUserData.role,  // 🔥 IMPORTANTE: Actualizar también el rol
        };
        console.log("✅ Usuario existente actualizado en registeredUsers");
      } else {
        const newUserRecord = {
          id: updatedUserData.id,
          password: "***",
          role: updatedUserData.role,
          alias: updatedUserData.alias,
          avatar: updatedUserData.avatar,
          createdAt: updatedUserData.createdAt || new Date().toISOString(),
          stats: updatedUserData.stats || {
            totalSessions: 0,
            totalTimeConnected: 0,
            averageRating: 0
          }
        };
        
        registeredUsers.push(newUserRecord);
        console.log("✅ Usuario agregado a registeredUsers:", newUserRecord);
      }
      
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
      console.log("✅ registeredUsers actualizado");

      console.log("🎉 Actualización completa exitosa");
      console.groupEnd();

    } catch (error) {
      console.error("💥 Error actualizando usuario:", error);
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log("UserContext: Inicializando...");
    
    const userData = loadUserFromStorage();
    if (userData) {
      setUser(userData);
      console.log("UserContext: Usuario cargado exitosamente");
    } else {
      console.log("UserContext: No hay sesión activa");
    }
    
    setIsLoading(false);
  }, []);

  const setUserWithPersistence = (userData) => {
    if (userData) {
      updateUser(userData);
    } else {
      setUser(null);
      localStorage.removeItem("userData");
      console.log("Usuario desconectado y datos limpiados");
    }
  };

  const contextValue = {
    user,
    setUser: setUserWithPersistence,
    isLoading,
    refreshUser: () => {
      const userData = loadUserFromStorage();
      if (userData) {
        setUser(userData);
      }
    }
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe ser usado dentro de un UserProvider");
  }
  return context;
}