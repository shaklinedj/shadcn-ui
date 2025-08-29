import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Upload, FolderOpen, Settings, Play, Users } from 'lucide-react';
import MediaUploader from '@/components/MediaUploader';
import ScreenManager from '@/components/ScreenManager';
import { mockBackend, MediaFile, Screen } from '@/lib/mock-backend';
import { websocketClient } from '@/lib/websocket';

export default function CMSDashboard() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [stats, setStats] = useState({ totalFiles: 0, activeScreens: 0, totalStorage: 0 });

  useEffect(() => {
    // Initialize data
    loadData();
    
    // Setup WebSocket for real-time updates
    websocketClient.connect();
    websocketClient.onMessage((data) => {
      if (data.type === 'media_updated') {
        loadMediaFiles();
      } else if (data.type === 'screen_updated') {
        loadScreens();
      }
    });

    return () => websocketClient.disconnect();
  }, []);

  const loadData = async () => {
    await loadMediaFiles();
    await loadScreens();
  };

  useEffect(() => {
    updateStats();
  }, [mediaFiles, screens]);

  const loadMediaFiles = async () => {
    const files = await mockBackend.getMediaFiles();
    setMediaFiles(files);
  };

  const loadScreens = async () => {
    const screenList = await mockBackend.getScreens();
    setScreens(screenList);
  };

  const updateStats = () => {
    const totalFiles = mediaFiles.length;
    const activeScreens = screens.filter(s => s.status === 'online').length;
    const totalStorage = mediaFiles.reduce((sum, file) => sum + file.size, 0);
    setStats({ totalFiles, activeScreens, totalStorage });
  };

  const handleMediaUploaded = () => {
    loadMediaFiles();
  };

  const handleScreenUpdated = () => {
    loadScreens();
  };

  const folders = ['all', 'promociones', 'eventos', 'productos', 'temporadas'];
  const filteredFiles = selectedFolder === 'all' 
    ? mediaFiles 
    : mediaFiles.filter(file => file.folder === selectedFolder);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openDisplayApp = () => {
    window.open('/display.html', '_blank', 'fullscreen=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Multi-Screen CMS</h1>
                <p className="text-sm text-gray-500">Sistema de Gestión de Contenido Publicitario</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={openDisplayApp} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Abrir Display
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archivos Totales</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">Imágenes y videos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pantallas Activas</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeScreens}</div>
              <p className="text-xs text-muted-foreground">de {screens.length} configuradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalStorage)}</div>
              <p className="text-xs text-muted-foreground">Espacio utilizado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado Sistema</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">Todos los servicios activos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="media" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="media">Gestión de Medios</TabsTrigger>
            <TabsTrigger value="screens">Pantallas</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Folders Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Carpetas</CardTitle>
                  <CardDescription>Organiza tu contenido</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {folders.map((folder) => (
                    <Button
                      key={folder}
                      variant={selectedFolder === folder ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedFolder(folder)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      {folder === 'all' ? 'Todos los archivos' : folder.charAt(0).toUpperCase() + folder.slice(1)}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Media Content */}
              <div className="lg:col-span-3 space-y-6">
                <MediaUploader onMediaUploaded={handleMediaUploaded} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Contenido Multimedia</CardTitle>
                    <CardDescription>
                      {filteredFiles.length} archivos en {selectedFolder === 'all' ? 'todas las carpetas' : selectedFolder}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredFiles.map((file) => (
                        <div key={file.id} className="group relative">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Play className="h-8 w-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {file.type.startsWith('image/') ? 'IMG' : 'VID'}
                              </Badge>
                              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="screens">
            <ScreenManager screens={screens} onScreenUpdated={handleScreenUpdated} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analíticas del Sistema</CardTitle>
                <CardDescription>Métricas de rendimiento y uso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analíticas en Desarrollo</h3>
                  <p className="text-gray-500">Las métricas detalladas estarán disponibles próximamente.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}