import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

function PlaylistManager() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  // Estados para playlists
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);

  // Estados para formularios
  const [playlistForm, setPlaylistForm] = useState({
    title: "",
    description: ""
  });
  const [videoForm, setVideoForm] = useState({
    youtubeUrl: "",
    title: "",
    customTitle: false
  });

  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showDropdown, setShowDropdown] = useState(false);
  const [draggedVideo, setDraggedVideo] = useState(null);
  const [conversionProgress, setConversionProgress] = useState({});
  const [showDeletePlaylist, setShowDeletePlaylist] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);

  // Mock data para playlists (solo visual)
  const mockPlaylists = [
    {
      id: "playlist_1",
      title: "Rock Clásico",
      description: "Los mejores hits del rock",
      createdBy: user?.id || "admin",
      createdAt: "2024-12-01T10:00:00Z",
      videoCount: 5,
      totalDuration: "23:45",
      videos: [
        {
          id: "video_1",
          youtubeUrl: "https://youtube.com/watch?v=fJ9rUzIMcZQ",
          youtubeId: "fJ9rUzIMcZQ",
          title: "Bohemian Rhapsody - Queen",
          duration: "5:55",
          thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/mqdefault.jpg",
          status: "completed",
          addedAt: "2024-12-01T10:00:00Z"
        },
        {
          id: "video_2",
          youtubeUrl: "https://youtube.com/watch?v=BciS5krYL80",
          youtubeId: "BciS5krYL80", 
          title: "Hotel California - Eagles",
          duration: "6:30",
          thumbnail: "https://img.youtube.com/vi/BciS5krYL80/mqdefault.jpg",
          status: "completed",
          addedAt: "2024-12-01T10:05:00Z"
        },
        {
          id: "video_3",
          youtubeUrl: "https://youtube.com/watch?v=QkF3oxziUI4",
          youtubeId: "QkF3oxziUI4",
          title: "Stairway to Heaven - Led Zeppelin", 
          duration: "8:02",
          thumbnail: "https://img.youtube.com/vi/QkF3oxziUI4/mqdefault.jpg",
          status: "processing",
          progress: 65,
          addedAt: "2024-12-01T10:10:00Z"
        }
      ]
    },
    {
      id: "playlist_2", 
      title: "Pop Hits",
      description: "Música pop actual",
      createdBy: user?.id || "admin",
      createdAt: "2024-12-02T15:00:00Z",
      videoCount: 3,
      totalDuration: "12:30",
      videos: [
        {
          id: "video_4",
          youtubeUrl: "https://youtube.com/watch?v=kffacxfA7G4",
          youtubeId: "kffacxfA7G4",
          title: "Anti-Hero - Taylor Swift",
          duration: "3:20",
          thumbnail: "https://img.youtube.com/vi/kffacxfA7G4/mqdefault.jpg",
          status: "completed",
          addedAt: "2024-12-02T15:00:00Z"
        }
      ]
    }
  ];

  // Cargar datos mock al inicializar
  useEffect(() => {
    if (!isAdmin()) {
      navigate("/events");
      return;
    }
    loadMockData();
  }, [user, navigate]);

  const loadMockData = () => {
    setPlaylists(mockPlaylists);
    if (mockPlaylists.length > 0) {
      setSelectedPlaylist(mockPlaylists[0]);
      setOriginalOrder([...mockPlaylists[0].videos]);
    }
  };

  const isAdmin = () => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  // Funciones mock (solo visual)
  const handleCreatePlaylist = () => {
    if (!playlistForm.title.trim()) {
      showMessage("El título es obligatorio", "error");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newPlaylist = {
        id: `playlist_${Date.now()}`,
        title: playlistForm.title,
        description: playlistForm.description,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        videoCount: 0,
        totalDuration: "0:00",
        videos: []
      };

      setPlaylists(prev => [...prev, newPlaylist]);
      setSelectedPlaylist(newPlaylist);
      setPlaylistForm({ title: "", description: "" });
      setShowCreatePlaylist(false);
      setLoading(false);
      showMessage("Playlist creada exitosamente");
    }, 1000);
  };

  const handleAddVideo = () => {
    if (!videoForm.youtubeUrl.trim()) {
      showMessage("La URL de YouTube es obligatoria", "error");
      return;
    }

    if (!selectedPlaylist) {
      showMessage("Selecciona una playlist primero", "error");
      return;
    }

    // Simular extracción de ID de YouTube
    const youtubeId = extractYouTubeId(videoForm.youtubeUrl);
    if (!youtubeId) {
      showMessage("URL de YouTube inválida", "error");
      return;
    }

    setLoading(true);
    setShowAddVideo(false);

    // Simular proceso de conversión
    const newVideo = {
      id: `video_${Date.now()}`,
      youtubeUrl: videoForm.youtubeUrl,
      youtubeId: youtubeId,
      title: videoForm.customTitle ? videoForm.title : "Obteniendo título...",
      duration: "0:00",
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
      status: "processing",
      progress: 0,
      addedAt: new Date().toISOString()
    };

    // Agregar video a la playlist seleccionada
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === selectedPlaylist.id 
        ? { 
            ...playlist, 
            videos: [...playlist.videos, newVideo],
            videoCount: playlist.videoCount + 1
          }
        : playlist
    ));

    // Actualizar playlist seleccionada
    setSelectedPlaylist(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo],
      videoCount: prev.videoCount + 1
    }));

    // Marcar como cambios sin guardar
    setHasUnsavedChanges(true);

    // Simular progreso de conversión
    simulateConversion(newVideo.id);

    setVideoForm({ youtubeUrl: "", title: "", customTitle: false });
    setLoading(false);
    showMessage("Video agregado - Recuerda guardar los cambios");
  };

  const simulateConversion = (videoId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Actualizar video como completado
        setTimeout(() => {
          setPlaylists(prev => prev.map(playlist => ({
            ...playlist,
            videos: playlist.videos.map(video => 
              video.id === videoId 
                ? { 
                    ...video, 
                    status: "completed", 
                    progress: 100,
                    title: video.title === "Obteniendo título..." ? "Video Convertido" : video.title,
                    duration: "3:45"
                  }
                : video
            )
          })));
          
          if (selectedPlaylist) {
            setSelectedPlaylist(prev => ({
              ...prev,
              videos: prev.videos.map(video => 
                video.id === videoId 
                  ? { 
                      ...video, 
                      status: "completed", 
                      progress: 100,
                      title: video.title === "Obteniendo título..." ? "Video Convertido" : video.title,
                      duration: "3:45"
                    }
                  : video
              )
            }));
          }
          
          showMessage("¡Conversión completada!", "success");
        }, 1000);
      }

      setConversionProgress(prev => ({ ...prev, [videoId]: Math.floor(progress) }));
    }, 200);
  };

  const extractYouTubeId = (url) => {
    const regex = /[?&]v=([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleVideoReorder = (dragIndex, hoverIndex) => {
    if (!selectedPlaylist) return;

    const draggedVideo = selectedPlaylist.videos[dragIndex];
    const newVideos = [...selectedPlaylist.videos];
    newVideos.splice(dragIndex, 1);
    newVideos.splice(hoverIndex, 0, draggedVideo);

    const updatedPlaylist = { ...selectedPlaylist, videos: newVideos };
    setSelectedPlaylist(updatedPlaylist);
    
    // Marcar como cambios sin guardar
    setHasUnsavedChanges(true);
    showMessage("Videos reordenados - Recuerda guardar los cambios", "success");
  };

  const handleRandomizeOrder = () => {
    if (!selectedPlaylist || selectedPlaylist.videos.length <= 1) return;

    // Algoritmo Fisher-Yates para barajar array
    const shuffledVideos = [...selectedPlaylist.videos];
    for (let i = shuffledVideos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledVideos[i], shuffledVideos[j]] = [shuffledVideos[j], shuffledVideos[i]];
    }

    const updatedPlaylist = { ...selectedPlaylist, videos: shuffledVideos };
    setSelectedPlaylist(updatedPlaylist);
    setHasUnsavedChanges(true);
    showMessage("Videos randomizados - Recuerda guardar los cambios", "success");
  };

  const handleSaveChanges = () => {
    if (!selectedPlaylist || !hasUnsavedChanges) return;

    setLoading(true);
    setTimeout(() => {
      // Actualizar la playlist en la lista de playlists
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === selectedPlaylist.id ? selectedPlaylist : playlist
      ));

      // Actualizar el orden original
      setOriginalOrder([...selectedPlaylist.videos]);
      setHasUnsavedChanges(false);
      setLoading(false);
      
      showMessage("Cambios guardados exitosamente", "success");
    }, 800);
  };

  const handleDiscardChanges = () => {
    if (!selectedPlaylist || !hasUnsavedChanges) return;

    if (window.confirm("¿Estás seguro de que quieres descartar los cambios?")) {
      const updatedPlaylist = { ...selectedPlaylist, videos: [...originalOrder] };
      setSelectedPlaylist(updatedPlaylist);
      setHasUnsavedChanges(false);
      showMessage("Cambios descartados", "success");
    }
  };

  const handleDeleteVideo = (videoId) => {
    if (!selectedPlaylist) return;

    if (!window.confirm("¿Estás seguro de que quieres eliminar este video?")) return;

    const updatedVideos = selectedPlaylist.videos.filter(v => v.id !== videoId);
    const updatedPlaylist = { 
      ...selectedPlaylist, 
      videos: updatedVideos,
      videoCount: updatedVideos.length
    };
    
    setSelectedPlaylist(updatedPlaylist);
    setHasUnsavedChanges(true);
    showMessage("Video eliminado - Recuerda guardar los cambios", "success");
  };

  const handleDeletePlaylist = (playlistId) => {
    setLoading(true);

    setTimeout(() => {
      try {
        // Eliminar playlist de la lista
        const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
        setPlaylists(updatedPlaylists);

        // Si la playlist eliminada era la seleccionada, resetear selección
        if (selectedPlaylist?.id === playlistId) {
          setSelectedPlaylist(updatedPlaylists.length > 0 ? updatedPlaylists[0] : null);
        }

        setShowDeletePlaylist(null);
        setLoading(false);
        showMessage("Playlist eliminada exitosamente");

      } catch (error) {
        console.error("Error eliminando playlist:", error);
        setLoading(false);
        showMessage("Error eliminando playlist", "error");
      }
    }, 500);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      
      {/* Header consistente */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Lado Izquierdo - Botón Volver */}
            <button
              onClick={() => navigate(-1)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              ← Volver
            </button>

            {/* Centro - Título de la Página */}
            <h1 className="text-3xl font-bold text-white flex items-center">
              🎬 Gestión de Playlists
              {hasUnsavedChanges && (
                <span className="ml-3 text-sm bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full">
                  • Sin guardar
                </span>
              )}
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

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Sidebar Izquierdo - Lista de Playlists */}
          <div className="col-span-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 h-full">
              
              {/* Header del sidebar */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📚 Mis Playlists</h2>
                  <button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    ➕ Nueva
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {playlists.length} playlist{playlists.length !== 1 ? 's' : ''} total
                </p>
              </div>

              {/* Lista de playlists */}
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {playlists.map(playlist => (
                  <div
                    key={playlist.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      selectedPlaylist?.id === playlist.id
                        ? "bg-blue-900 border-blue-600 ring-2 ring-blue-500"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedPlaylist(playlist);
                          setOriginalOrder([...playlist.videos]);
                          setHasUnsavedChanges(false);
                        }}
                      >
                        <h3 className="font-semibold text-white text-sm">{playlist.title}</h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {playlist.description || "Sin descripción"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {playlist.videoCount} videos
                          </span>
                          <span className="text-xs text-gray-500">
                            {playlist.totalDuration}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex items-center space-x-2">
                        <div className="text-2xl">🎵</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeletePlaylist(playlist.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                          title="Eliminar playlist"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {playlists.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No hay playlists</h3>
                    <p className="text-gray-500 text-sm">Crea tu primera playlist</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Principal - Gestión de Videos */}
          <div className="col-span-8">
            {selectedPlaylist ? (
              <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                
                {/* Header de la playlist */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedPlaylist.title}</h2>
                      <p className="text-gray-400 mt-1">{selectedPlaylist.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>📅 {formatDate(selectedPlaylist.createdAt)}</span>
                        <span>🎵 {selectedPlaylist.videoCount} videos</span>
                        <span>⏱️ {selectedPlaylist.totalDuration}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAddVideo(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        ➕ Agregar Video
                      </button>
                      
                      {selectedPlaylist.videos.length > 1 && (
                        <button
                          onClick={handleRandomizeOrder}
                          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          🎲 Randomizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de videos */}
                <div className="p-6">
                  {selectedPlaylist.videos.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">🎬 Videos</h3>
                        <p className="text-sm text-gray-400">
                          Arrastra los videos para reordenar
                        </p>
                      </div>
                      
                      {selectedPlaylist.videos.map((video, index) => (
                        <div
                          key={video.id}
                          draggable="true"
                          onDragStart={(e) => {
                            setDraggedVideo({ video, index });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedVideo && draggedVideo.index !== index) {
                              handleVideoReorder(draggedVideo.index, index);
                            }
                            setDraggedVideo(null);
                          }}
                          onDragEnd={() => setDraggedVideo(null)}
                          className={`bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors duration-200 cursor-move ${
                            draggedVideo?.index === index ? 'opacity-50 bg-gray-600' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            
                            {/* Drag Handle */}
                            <div className="cursor-move text-gray-400 hover:text-gray-300 flex-shrink-0">
                              <span className="text-lg">⋮⋮</span>
                            </div>

                            {/* Thumbnail */}
                            <div className="w-20 h-12 bg-gray-600 rounded border border-gray-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {video.thumbnail ? (
                                <img 
                                  src={video.thumbnail} 
                                  alt="Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">🎵</span>
                              )}
                            </div>

                            {/* Info del video */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-white text-sm">{video.title}</h4>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {video.youtubeUrl}
                                  </p>
                                  <div className="flex items-center space-x-3 mt-2">
                                    <span className="text-xs text-gray-500">
                                      ⏱️ {video.duration}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      📅 {formatDate(video.addedAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Estado y acciones */}
                                <div className="flex items-center space-x-2">
                                  {video.status === "processing" ? (
                                    <div className="text-center">
                                      <div className="w-16 bg-gray-600 rounded-full h-2 mb-1">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${conversionProgress[video.id] || video.progress || 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs text-yellow-400">
                                        {conversionProgress[video.id] || video.progress || 0}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-green-400 bg-green-900 px-2 py-1 rounded">
                                      ✅ Listo
                                    </span>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteVideo(video.id)}
                                    className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                                    title="Eliminar video"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Botones de Guardar Cambios */}
                      {hasUnsavedChanges && (
                        <div className="mt-6 bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-yellow-200 font-medium">⚠️ Cambios sin guardar</h4>
                              <p className="text-yellow-300 text-sm mt-1">
                                Has modificado el orden de los videos. ¿Quieres guardar los cambios?
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={handleDiscardChanges}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                              >
                                ❌ Descartar
                              </button>
                              <button
                                onClick={handleSaveChanges}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                              >
                                {loading ? "Guardando..." : "💾 Guardar Cambios"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-8xl mb-4">🎬</div>
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        Playlist vacía
                      </h3>
                      <p className="text-gray-500">
                        Agrega videos desde YouTube para comenzar
                      </p>
                      <button
                        onClick={() => setShowAddVideo(true)}
                        className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        ➕ Agregar Primer Video
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Selecciona una playlist
                  </h3>
                  <p className="text-gray-500">
                    Elige una playlist del panel izquierdo para ver y editar sus videos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal crear playlist */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">📚 Crear Nueva Playlist</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  value={playlistForm.title}
                  onChange={(e) => setPlaylistForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="Nombre de la playlist"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={playlistForm.description}
                  onChange={(e) => setPlaylistForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  rows="3"
                  placeholder="Describe tu playlist"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreatePlaylist}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Creando..." : "✅ Crear Playlist"}
              </button>
              <button
                onClick={() => {
                  setShowCreatePlaylist(false);
                  setPlaylistForm({ title: "", description: "" });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar video */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">🎬 Agregar Video desde YouTube</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL de YouTube *</label>
                <input
                  type="url"
                  value={videoForm.youtubeUrl}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pega la URL completa del video de YouTube
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="customTitle"
                  checked={videoForm.customTitle}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, customTitle: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="customTitle" className="text-sm text-gray-300">
                  Usar título personalizado
                </label>
              </div>

              {videoForm.customTitle && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Título personalizado</label>
                  <input
                    type="text"
                    value={videoForm.title}
                    onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Título del video"
                    maxLength={100}
                  />
                </div>
              )}

              <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  <strong>💡 Proceso automático:</strong>
                </p>
                <ul className="text-blue-200 text-sm mt-2 ml-4 list-disc">
                  <li>Descarga del video desde YouTube</li>
                  <li>Conversión a MP4 optimizado</li>
                  <li>Extracción de metadatos</li>
                  <li>Listo para reproducción</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddVideo}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Procesando..." : "🚀 Convertir y Agregar"}
              </button>
              <button
                onClick={() => {
                  setShowAddVideo(false);
                  setVideoForm({ youtubeUrl: "", title: "", customTitle: false });
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación de playlist */}
      {showDeletePlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold text-red-400 mb-4">🗑️ Confirmar Eliminación</h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                ¿Estás seguro de que quieres eliminar la playlist <strong>"{playlists.find(p => p.id === showDeletePlaylist)?.title}"</strong>?
              </p>
              <div className="bg-red-900 border border-red-600 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente:
                </p>
                <ul className="text-red-200 text-sm mt-2 ml-4 list-disc">
                  <li>La playlist completa</li>
                  <li>Todos los videos de la playlist</li>
                  <li>Los archivos MP4 convertidos</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeletePlaylist(showDeletePlaylist)}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? "Eliminando..." : "🗑️ Sí, Eliminar"}
              </button>
              <button
                onClick={() => setShowDeletePlaylist(null)}
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

export default PlaylistManager;