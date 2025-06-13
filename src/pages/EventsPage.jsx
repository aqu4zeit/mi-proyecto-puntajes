import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function EventsPage() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  // Estados para eventos
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [pastEvents, setPastEvents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para formularios
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    banner: ""
  });
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    banner: ""
  });

  // Estados para UI
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRegisteredUsers, setShowRegisteredUsers] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar eventos al inicializar
  useEffect(() => {
    loadEvents();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadEvents = () => {
    try {
      const savedEvents = localStorage.getItem("ytPartyEvents");
      const eventRegistrations = localStorage.getItem("eventRegistrations");
      
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        const registrations = eventRegistrations ? JSON.parse(eventRegistrations) : {};
        
        // Agregar conteo de registros a cada evento
        const eventsWithRegistrations = parsedEvents.map(event => ({
          ...event,
          registeredCount: registrations[event.id] ? registrations[event.id].length : 0
        }));
        
        categorizeEvents(eventsWithRegistrations);
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
      showMessage("Error cargando eventos", "error");
    }
  };

  const categorizeEvents = (allEvents) => {
    const now = new Date();
    const upcoming = [];
    const past = [];
    let active = null;

    allEvents.forEach(event => {
      // Convertir fecha y hora separadas en datetime para compatibilidad
      let eventDateTime;
      if (event.datetime) {
        eventDateTime = new Date(event.datetime);
      } else if (event.date && event.time) {
        eventDateTime = new Date(`${event.date}T${event.time}`);
      }
      
      const eventEndTime = new Date(eventDateTime.getTime() + (3 * 60 * 60 * 1000));

      if (event.status === 'active') {
        active = event;
      } else if (event.status === 'finished' || eventEndTime < now) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    // Ordenar eventos
    upcoming.sort((a, b) => {
      const dateA = a.datetime ? new Date(a.datetime) : new Date(`${a.date}T${a.time}`);
      const dateB = b.datetime ? new Date(b.datetime) : new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });
    past.sort((a, b) => {
      const dateA = a.datetime ? new Date(a.datetime) : new Date(`${a.date}T${a.time}`);
      const dateB = b.datetime ? new Date(b.datetime) : new Date(`${b.date}T${b.time}`);
      return dateB - dateA;
    }).slice(0, 3);

    setEvents(upcoming);
    setActiveEvent(active);
    setPastEvents(past);
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const isAdmin = () => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  };

  const handleCreateEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      showMessage("Título, fecha y hora son obligatorios", "error");
      return;
    }

    const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`);
    if (eventDateTime <= new Date()) {
      showMessage("La fecha y hora deben ser futuras", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const newEvent = {
          id: Date.now().toString(),
          title: eventForm.title,
          date: eventForm.date,
          time: eventForm.time,
          description: eventForm.description,
          banner: eventForm.banner,
          status: 'scheduled',
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          registeredCount: 0
        };

        const savedEvents = localStorage.getItem("ytPartyEvents");
        const currentEvents = savedEvents ? JSON.parse(savedEvents) : [];
        
        const updatedEvents = [...currentEvents, newEvent];
        localStorage.setItem("ytPartyEvents", JSON.stringify(updatedEvents));

        categorizeEvents(updatedEvents);
        setEventForm({ title: "", date: "", time: "", description: "", banner: "" });
        setShowCreateForm(false);
        setLoading(false);
        showMessage("Evento creado exitosamente");

      } catch (error) {
        console.error("Error creando evento:", error);
        setLoading(false);
        showMessage("Error creando evento", "error");
      }
    }, 500);
  };

  const handleEditEvent = (eventId) => {
    if (!editForm.title || !editForm.date || !editForm.time) {
      showMessage("Título, fecha y hora son obligatorios", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const savedEvents = localStorage.getItem("ytPartyEvents");
        const currentEvents = savedEvents ? JSON.parse(savedEvents) : [];
        
        const updatedEvents = currentEvents.map(event => 
          event.id === eventId ? { ...event, ...editForm } : event
        );
        
        localStorage.setItem("ytPartyEvents", JSON.stringify(updatedEvents));
        categorizeEvents(updatedEvents);
        setShowEditForm(null);
        setEditForm({ title: "", date: "", time: "", description: "", banner: "" });
        setLoading(false);
        showMessage("Evento actualizado exitosamente");

      } catch (error) {
        console.error("Error editando evento:", error);
        setLoading(false);
        showMessage("Error editando evento", "error");
      }
    }, 500);
  };

  const handleDeleteEvent = (eventId) => {
    setLoading(true);

    setTimeout(() => {
      try {
        const savedEvents = localStorage.getItem("ytPartyEvents");
        const currentEvents = savedEvents ? JSON.parse(savedEvents) : [];
        
        const updatedEvents = currentEvents.filter(event => event.id !== eventId);
        localStorage.setItem("ytPartyEvents", JSON.stringify(updatedEvents));
        
        // También eliminar registros del evento
        const registrations = localStorage.getItem("eventRegistrations");
        if (registrations) {
          const currentRegistrations = JSON.parse(registrations);
          delete currentRegistrations[eventId];
          localStorage.setItem("eventRegistrations", JSON.stringify(currentRegistrations));
        }

        categorizeEvents(updatedEvents);
        setShowDeleteConfirm(null);
        setLoading(false);
        showMessage("Evento eliminado exitosamente");

      } catch (error) {
        console.error("Error eliminando evento:", error);
        setLoading(false);
        showMessage("Error eliminando evento", "error");
      }
    }, 500);
  };

  const handleStartEvent = (eventId) => {
    if (activeEvent) {
      showMessage("Ya hay un evento activo. Cancela el actual antes de iniciar otro.", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      try {
        const savedEvents = localStorage.getItem("ytPartyEvents");
        const currentEvents = savedEvents ? JSON.parse(savedEvents) : [];
        
        const updatedEvents = currentEvents.map(event => 
          event.id === eventId ? { ...event, status: 'active', startedAt: new Date().toISOString() } : event
        );
        
        localStorage.setItem("ytPartyEvents", JSON.stringify(updatedEvents));
        categorizeEvents(updatedEvents);
        setLoading(false);
        showMessage("Evento iniciado exitosamente");

      } catch (error) {
        console.error("Error iniciando evento:", error);
        setLoading(false);
        showMessage("Error iniciando evento", "error");
      }
    }, 500);
  };

  const handleCancelEvent = () => {
    if (!activeEvent) return;

    setLoading(true);

    setTimeout(() => {
      try {
        const savedEvents = localStorage.getItem("ytPartyEvents");
        const currentEvents = savedEvents ? JSON.parse(savedEvents) : [];
        
        const updatedEvents = currentEvents.map(event => 
          event.id === activeEvent.id ? { ...event, status: 'scheduled' } : event
        );
        
        localStorage.setItem("ytPartyEvents", JSON.stringify(updatedEvents));
        categorizeEvents(updatedEvents);
        setLoading(false);
        showMessage("Evento cancelado");

      } catch (error) {
        console.error("Error cancelando evento:", error);
        setLoading(false);
        showMessage("Error cancelando evento", "error");
      }
    }, 500);
  };

  const handleJoinEvent = (eventId) => {
    if (activeEvent && activeEvent.id === eventId) {
      navigate("/player");
    } else {
      showMessage("El evento aún no ha comenzado", "error");
    }
  };

  const handleRegisterForEvent = (eventId) => {
    try {
      const registrations = localStorage.getItem("eventRegistrations");
      const currentRegistrations = registrations ? JSON.parse(registrations) : {};
      
      if (!currentRegistrations[eventId]) {
        currentRegistrations[eventId] = [];
      }
      
      if (!currentRegistrations[eventId].includes(user.id)) {
        currentRegistrations[eventId].push(user.id);
        localStorage.setItem("eventRegistrations", JSON.stringify(currentRegistrations));
        loadEvents();
        showMessage("Te has registrado al evento");
      } else {
        showMessage("Ya estás registrado en este evento", "error");
      }
    } catch (error) {
      console.error("Error registrando para evento:", error);
      showMessage("Error al registrarse", "error");
    }
  };

  const handleUnregisterFromEvent = (eventId) => {
    try {
      const registrations = localStorage.getItem("eventRegistrations");
      const currentRegistrations = registrations ? JSON.parse(registrations) : {};
      
      if (currentRegistrations[eventId]) {
        currentRegistrations[eventId] = currentRegistrations[eventId].filter(id => id !== user.id);
        localStorage.setItem("eventRegistrations", JSON.stringify(currentRegistrations));
        loadEvents();
        showMessage("Te has retirado del evento");
      }
    } catch (error) {
      console.error("Error retirándose del evento:", error);
      showMessage("Error al retirarse", "error");
    }
  };

  const isUserRegistered = (eventId) => {
    const registrations = localStorage.getItem("eventRegistrations");
    if (!registrations) return false;
    
    const currentRegistrations = JSON.parse(registrations);
    return currentRegistrations[eventId] && currentRegistrations[eventId].includes(user.id);
  };

  const getRegisteredUsers = (eventId) => {
    const registrations = localStorage.getItem("eventRegistrations");
    if (!registrations) return [];
    
    const currentRegistrations = JSON.parse(registrations);
    const userIds = currentRegistrations[eventId] || [];
    
    // Obtener información de usuarios registrados
    const savedUsers = localStorage.getItem("registeredUsers");
    const allUsers = savedUsers ? JSON.parse(savedUsers) : [];
    const baseUsers = [
      { id: "aqua", alias: "Aqua Admin", role: "superadmin" },
      ...allUsers
    ];
    
    return userIds.map(userId => {
      const userInfo = baseUsers.find(u => u.id === userId);
      return userInfo || { id: userId, alias: userId, role: "participante" };
    });
  };

  const formatDateTime = (event) => {
    let date;
    if (event.datetime) {
      date = new Date(event.datetime);
    } else if (event.date && event.time) {
      date = new Date(`${event.date}T${event.time}`);
    }
    
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (event) => {
    let date;
    if (event.datetime) {
      date = new Date(event.datetime);
    } else if (event.date && event.time) {
      date = new Date(`${event.date}T${event.time}`);
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  return (
    <div className="min-h-screen bg-gray-900">
      
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo/Título */}
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white">
                🎵 YouTube Party
              </h1>
              <span className="text-sm text-blue-400 bg-blue-900 px-3 py-1 rounded-full border border-blue-600">
                📅 Eventos
              </span>
            </div>

            {/* Usuario y navegación */}
            <div className="flex items-center space-x-4">
              {isAdmin() && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-lg"
                >
                  ➕ Crear Evento
                </button>
              )}

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

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Área principal de eventos */}
          <div className="lg:col-span-3">
            
            {/* Evento activo (destacado) */}
            {activeEvent && (
              <div className="mb-8 bg-gradient-to-r from-green-800 to-green-700 rounded-xl shadow-2xl p-6 border-2 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    🔴 EVENTO EN VIVO
                  </h2>
                  {isAdmin() && (
                    <button
                      onClick={handleCancelEvent}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      ❌ Cancelar Evento
                    </button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    {activeEvent.banner ? (
                      <img 
                        src={activeEvent.banner} 
                        alt="Banner del evento"
                        className="w-full h-40 object-cover rounded-lg border border-green-400"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center border border-green-400">
                        <span className="text-4xl">🎵</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-white mb-2">{activeEvent.title}</h3>
                    <p className="text-green-200 mb-4">
                      📅 {formatDateTime(activeEvent)}
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-green-200">
                        👥 {activeEvent.registeredCount} usuarios registrados
                      </span>
                      {activeEvent.registeredCount > 0 && (
                        <button
                          onClick={() => setShowRegisteredUsers(activeEvent.id)}
                          className="bg-white text-green-700 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors duration-200 cursor-pointer"
                        >
                          {activeEvent.registeredCount}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoinEvent(activeEvent.id)}
                      className="w-full bg-white text-green-700 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors duration-200 shadow-lg"
                    >
                      🚀 UNIRSE AL EVENTO
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Eventos programados */}
            {events.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  📋 Próximos Eventos
                </h2>
                
                <div className="space-y-6">
                  {events.map(event => (
                    <div key={event.id} className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          {event.banner ? (
                            <img 
                              src={event.banner} 
                              alt="Banner del evento"
                              className="w-full h-40 object-cover rounded-lg border border-gray-600"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center border border-gray-600">
                              <span className="text-4xl text-white">🎵</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="md:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                              <p className="text-gray-300 mb-2">
                                📅 {formatDateTime(event)}
                              </p>
                              <div className="flex items-center space-x-4">
                                <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                                  Próximamente
                                </span>
                              </div>
                            </div>
                            
                            {event.registeredCount > 0 && (
                              <button
                                onClick={() => setShowRegisteredUsers(event.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors duration-200 cursor-pointer"
                                title={`👥 ${event.registeredCount} registrados`}
                              >
                                {event.registeredCount}
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            {isUserRegistered(event.id) ? (
                              <button
                                onClick={() => handleUnregisterFromEvent(event.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                              >
                                ➖ Salir del evento
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegisterForEvent(event.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                              >
                                ➕ Registrarme
                              </button>
                            )}
                            
                            {isAdmin() && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditForm({
                                      title: event.title,
                                      date: event.date || event.datetime?.split('T')[0] || "",
                                      time: event.time || event.datetime?.split('T')[1]?.slice(0,5) || "",
                                      description: event.description || "",
                                      banner: event.banner || ""
                                    });
                                    setShowEditForm(event.id);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => handleStartEvent(event.id)}
                                  disabled={loading || activeEvent}
                                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                  🚀 Iniciar
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(event.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                  🗑️ Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado vacío */}
            {!activeEvent && events.length === 0 && (
              <div className="text-center py-16">
                <div className="text-8xl mb-4">🎵</div>
                <h2 className="text-2xl font-bold text-gray-400 mb-2">
                  No hay eventos programados
                </h2>
                <p className="text-gray-500">
                  {isAdmin() ? "Crea un nuevo evento para comenzar" : "Mantente atento a los próximos eventos"}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Eventos pasados */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                📚 Eventos Pasados
              </h3>
              
              {pastEvents.length > 0 ? (
                <div className="space-y-4">
                  {pastEvents.map(event => (
                    <div key={event.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      {event.banner ? (
                        <img 
                          src={event.banner} 
                          alt="Banner"
                          className="w-full h-20 object-cover rounded mb-3 border border-gray-600"
                        />
                      ) : (
                        <div className="w-full h-20 bg-gradient-to-br from-gray-600 to-gray-500 rounded mb-3 flex items-center justify-center border border-gray-600">
                          <span className="text-2xl text-gray-300">🎵</span>
                        </div>
                      )}
                      <h4 className="font-medium text-white text-sm mb-1">{event.title}</h4>
                      <p className="text-xs text-gray-400">
                        {formatDateOnly(event)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-gray-400 text-sm">
                    No hay eventos anteriores
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal crear evento */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">➕ Crear Nuevo Evento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Nombre del evento"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fecha *</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hora *</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción (privada)</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  rows="3"
                  placeholder="Notas internas del evento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner (URL)</label>
                <input
                  type="url"
                  value={eventForm.banner}
                  onChange={(e) => setEventForm(prev => ({ ...prev, banner: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateEvent}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Creando..." : "✅ Crear Evento"}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEventForm({ title: "", date: "", time: "", description: "", banner: "" });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar evento */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">✏️ Editar Evento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fecha *</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hora *</label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción (privada)</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Banner (URL)</label>
                <input
                  type="url"
                  value={editForm.banner}
                  onChange={(e) => setEditForm(prev => ({ ...prev, banner: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleEditEvent(showEditForm)}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Guardando..." : "💾 Guardar Cambios"}
              </button>
              <button
                onClick={() => {
                  setShowEditForm(null);
                  setEditForm({ title: "", date: "", time: "", description: "", banner: "" });
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
                ¿Estás seguro de que quieres eliminar este evento?
              </p>
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. 
                  Se eliminarán también todos los registros de usuarios para este evento.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
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

      {/* Modal usuarios registrados */}
      {showRegisteredUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">👥 Usuarios Registrados</h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getRegisteredUsers(showRegisteredUsers).map(registeredUser => (
                <div key={registeredUser.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-600">
                      <span className="text-white text-sm font-bold">
                        {registeredUser.alias.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-gray-700 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {registeredUser.alias}
                      {registeredUser.id === user?.id && (
                        <span className="text-blue-400 ml-1">(tú)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {registeredUser.role === 'superadmin' ? '👑 Admin' : '🎵 Participante'}
                    </p>
                  </div>
                </div>
              ))}
              
              {getRegisteredUsers(showRegisteredUsers).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-400 text-sm">
                    Aún no hay usuarios registrados
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowRegisteredUsers(null)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ✅ Cerrar
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

export default EventsPage;