import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function PlayerPage() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  
  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Estados del sistema de votación
  const [skipVotes, setSkipVotes] = useState([]);
  const [skipThreshold] = useState(7); // Votos necesarios para skip
  const [showSkipButton, setShowSkipButton] = useState(false);

  // Estados del chat y usuarios
  const [chatMessages, setChatMessages] = useState([
    { userId: "aqua", alias: "Aqua Admin", message: "¡Bienvenidos al evento!", timestamp: new Date().toISOString() },
    { userId: "user1", alias: "Usuario1", message: "¡Está genial esta música! 🎵", timestamp: new Date().toISOString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [connectedUsers] = useState([
    { id: "aqua", alias: "Aqua Admin", role: "superadmin", status: "online" },
    { id: user?.id, alias: user?.alias || user?.id, role: user?.role, status: "online" },
    { id: "user1", alias: "Usuario Demo", role: "participante", status: "online" },
    { id: "user2", alias: "Otro Usuario", role: "participante", status: "online" },
    { id: "user3", alias: "Participante 3", role: "participante", status: "online" },
    { id: "user4", alias: "Participante 4", role: "participante", status: "online" },
  ]);

  // Estados de rating
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Mock data para playlist actual
  const [playlist] = useState([
    { 
      id: 1, 
      title: "Bohemian Rhapsody - Queen", 
      youtubeId: "fJ9rUzIMcZQ", 
      duration: "5:55",
      averageRating: 4.8 
    },
    { 
      id: 2, 
      title: "Hotel California - Eagles", 
      youtubeId: "BciS5krYL80", 
      duration: "6:30",
      averageRating: 4.9 
    },
    { 
      id: 3, 
      title: "Stairway to Heaven - Led Zeppelin", 
      youtubeId: "QkF3oxziUI4", 
      duration: "8:02",
      averageRating: 4.7 
    },
  ]);

  // Cargar video actual
  useEffect(() => {
    if (playlist.length > 0 && currentVideoIndex < playlist.length) {
      setCurrentVideo(playlist[currentVideoIndex]);
    }
  }, [currentVideoIndex, playlist]);

  const isAdmin = () => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  };

  const handlePlayPause = () => {
    if (!isAdmin()) return;
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (!isAdmin()) return;
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isAdmin()) return;
    if (currentVideoIndex < playlist.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleForceSkip = () => {
    if (!isAdmin()) return;
    handleNext();
    setSkipVotes([]); // Reset votos
  };

  const handleSkipVote = () => {
    if (skipVotes.includes(user.id)) return; // Ya votó
    
    const newVotes = [...skipVotes, user.id];
    setSkipVotes(newVotes);
    
    // Si alcanza el threshold, skip automático
    if (newVotes.length >= skipThreshold) {
      handleNext();
      setSkipVotes([]);
    }
  };

  const handleRating = (rating) => {
    setCurrentRating(rating);
    console.log(`Usuario ${user.id} calificó el video con ${rating} estrellas`);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      userId: user.id,
      alias: user.alias || user.id,
      message: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      
      {/* Header - Consistente con el resto de páginas */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Lado Izquierdo - Botón Volver */}
            <button
              onClick={() => navigate("/events")}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              ← Volver
            </button>

            {/* Centro - Título de la Página */}
            <h1 className="text-3xl font-bold text-white">
              🎵 Evento Musical en Vivo
            </h1>

            {/* Lado Derecho - Dropdown de Perfil */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-600"
              >
                {getMiniAvatarDisplay()}
                <span className="text-white text-sm font-medium">{user?.alias || user?.id}</span>
                <span className="text-white text-sm">▼</span>
              </button>

              {/* Dropdown Menu */}
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
      </header>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Reproductor Principal - Columnas 1-8 */}
          <div className="col-span-8 flex flex-col">
            
            {/* Video Player */}
            <div className="relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex-1 flex flex-col">
              
              {/* Área del Video */}
              <div className="relative flex-1 bg-gradient-to-br from-gray-700 to-gray-600 rounded-t-xl flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-8xl mb-4 animate-pulse">
                    {isPlaying ? "▶️" : "⏸️"}
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {currentVideo ? currentVideo.title : "Selecciona una canción"}
                  </p>
                  <p className="text-lg text-gray-300">
                    YouTube Party Player
                  </p>
                  {currentVideo && (
                    <p className="text-sm text-gray-400 mt-2">
                      ⭐ {currentVideo.averageRating}/5 • {currentVideo.duration}
                    </p>
                  )}
                </div>

                {/* Botón de Votación Skip - Oculto en el borde */}
                <div 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2"
                  onMouseEnter={() => setShowSkipButton(true)}
                  onMouseLeave={() => setShowSkipButton(false)}
                >
                  {/* Área trigger - siempre visible */}
                  <div className="w-4 h-16 bg-blue-600 bg-opacity-20 hover:bg-opacity-40 transition-all duration-200 cursor-pointer rounded-l-lg">
                  </div>
                  
                  {/* Botón expandible */}
                  <div className={`absolute right-0 top-0 h-16 bg-blue-600 rounded-l-lg shadow-lg transition-all duration-300 flex items-center ${
                    showSkipButton ? 'w-32 opacity-100' : 'w-0 opacity-0'
                  } overflow-hidden`}>
                    <button
                      onClick={handleSkipVote}
                      disabled={skipVotes.includes(user.id)}
                      className="w-full h-full flex flex-col items-center justify-center text-white font-medium text-xs disabled:opacity-50"
                    >
                      <span>⏭️ Skip</span>
                      <span className="text-xs mt-1">
                        {skipVotes.length}/{skipThreshold}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="px-6 py-3 bg-gray-800">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{currentVideo?.duration || "0:00"}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              {/* Controles del Reproductor */}
              <div className="px-6 py-4 bg-gray-800 rounded-b-xl">
                <div className="flex items-center justify-center space-x-6">
                  <button 
                    onClick={handlePrevious}
                    disabled={!isAdmin() || currentVideoIndex === 0}
                    className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 border border-gray-600"
                  >
                    <span className="text-xl">⏮️</span>
                  </button>
                  
                  <button 
                    onClick={handlePlayPause}
                    disabled={!isAdmin()}
                    className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-lg"
                  >
                    <span className="text-2xl">{isPlaying ? "⏸️" : "▶️"}</span>
                  </button>
                  
                  <button 
                    onClick={handleNext}
                    disabled={!isAdmin() || currentVideoIndex === playlist.length - 1}
                    className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors duration-200 border border-gray-600"
                  >
                    <span className="text-xl">⏭️</span>
                  </button>

                  {/* Control de Volumen */}
                  {isAdmin() && (
                    <div className="flex items-center space-x-2 ml-6">
                      <span className="text-white text-sm">🔊</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-white text-xs w-8">{volume}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Video y Rating */}
            <div className="mt-4 bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                
                {/* Título del Video */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {currentVideo ? currentVideo.title : "No hay video seleccionado"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Video {currentVideoIndex + 1} de {playlist.length}
                  </p>
                </div>

                {/* Sistema de Rating */}
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">Calificar:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-2xl transition-colors duration-200"
                      >
                        <span className={
                          star <= (hoverRating || currentRating) 
                            ? "text-yellow-400" 
                            : "text-gray-600"
                        }>
                          ⭐
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Force Skip (Solo Admins) */}
                  {isAdmin() && (
                    <button
                      onClick={handleForceSkip}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                    >
                      Force Skip
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Derecho - Columnas 9-12 */}
          <div className="col-span-4 flex flex-col space-y-4">
            
            {/* Chat de Sala */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">💬 Chat de Sala</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {msg.alias.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-400">{msg.alias}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    📤
                  </button>
                </div>
              </div>
            </div>

            {/* Usuarios Conectados */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">
                  👥 Usuarios Conectados ({connectedUsers.length})
                </h3>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-3 max-h-80">
                {connectedUsers.map(connectedUser => (
                  <div key={connectedUser.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700 border border-gray-600">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-gray-600">
                        <span className="text-white text-sm font-bold">
                          {connectedUser.alias.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-gray-700 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {connectedUser.alias}
                        {connectedUser.id === user?.id && (
                          <span className="text-blue-400 ml-1">(tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {connectedUser.role === 'superadmin' ? '👑 Admin' : 
                         connectedUser.role === 'admin' ? '⚡ Admin' : '🎵 Participante'}
                      </p>
                    </div>
                    {skipVotes.includes(connectedUser.id) && (
                      <div className="text-xs text-yellow-400">⏭️</div>
                    )}
                  </div>
                ))}
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

export default PlayerPage;