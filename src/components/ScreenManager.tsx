import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Plus, Settings, Wifi, WifiOff, Edit, Trash2 } from 'lucide-react';
import { mockBackend, Screen } from '@/lib/mock-backend';
import { websocketClient } from '@/lib/websocket';

interface ScreenManagerProps {
  screens: Screen[];
  onScreenUpdated: () => void;
}

export default function ScreenManager({ screens, onScreenUpdated }: ScreenManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [configuringScreen, setConfiguringScreen] = useState<Screen | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    resolution: '1920x1080',
    orientation: 'landscape' as 'landscape' | 'portrait'
  });

  useEffect(() => {
    if (configuringScreen) {
      setSelectedFolder(configuringScreen.assignedFolder || 'all');
    }
  }, [configuringScreen]);

  const resolutions = [
    { value: '1920x1080', label: 'Full HD (1920x1080)' },
    { value: '3840x2160', label: '4K (3840x2160)' },
    { value: '1366x768', label: 'HD (1366x768)' },
    { value: '1280x720', label: 'HD Ready (1280x720)' }
  ];

  const folders = ['all', 'promociones', 'eventos', 'productos', 'temporadas'];

  const handleAddScreen = async () => {
    if (!formData.name || !formData.location) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const newScreen = await mockBackend.addScreen({
      name: formData.name,
      location: formData.location,
      resolution: formData.resolution,
      orientation: formData.orientation,
      status: 'offline'
    });

    // Simulate screen coming online after creation
    setTimeout(async () => {
      await mockBackend.updateScreenStatus(newScreen.id, 'online');
      websocketClient.send({ type: 'screen_updated', data: newScreen });
      onScreenUpdated();
    }, 1000);

    websocketClient.send({ type: 'screen_updated', data: newScreen });
    onScreenUpdated();
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditScreen = async () => {
    if (!editingScreen || !formData.name || !formData.location) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const updatedScreen = await mockBackend.updateScreen(editingScreen.id, {
      name: formData.name,
      location: formData.location,
      resolution: formData.resolution,
      orientation: formData.orientation
    });

    websocketClient.send({ type: 'screen_updated', data: updatedScreen });
    onScreenUpdated();
    setEditingScreen(null);
    resetForm();
  };

  const handleAssignFolder = async () => {
    if (!configuringScreen) return;

    const updatedScreen = await mockBackend.updateScreen(configuringScreen.id, {
      assignedFolder: selectedFolder
    });

    websocketClient.send({ type: 'screen_updated', data: updatedScreen });
    onScreenUpdated();
    setConfiguringScreen(null);
  };

  const handleDeleteScreen = async (screenId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta pantalla?')) {
      await mockBackend.deleteScreen(screenId);
      websocketClient.send({ type: 'screen_updated', data: { id: screenId, deleted: true } });
      onScreenUpdated();
    }
  };

  const toggleScreenStatus = async (screen: Screen) => {
    const newStatus = screen.status === 'online' ? 'offline' : 'online';
    const updatedScreen = await mockBackend.updateScreenStatus(screen.id, newStatus);
    websocketClient.send({ type: 'screen_updated', data: updatedScreen });
    onScreenUpdated();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      resolution: '1920x1080',
      orientation: 'landscape'
    });
  };

  const openEditDialog = (screen: Screen) => {
    setEditingScreen(screen);
    setFormData({
      name: screen.name,
      location: screen.location,
      resolution: screen.resolution,
      orientation: screen.orientation
    });
  };

  const openConfigureDialog = (screen: Screen) => {
    setConfiguringScreen(screen);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'offline': return 'Desconectada';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pantallas</h2>
          <p className="text-gray-600">Configura y monitorea tus pantallas de visualización</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pantalla
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Pantalla</DialogTitle>
              <DialogDescription>
                Configura una nueva pantalla de visualización para tu red publicitaria.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  placeholder="ej. Pantalla Principal"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="col-span-3"
                  placeholder="ej. Lobby Principal"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resolution" className="text-right">Resolución</Label>
                <Select value={formData.resolution} onValueChange={(value) => setFormData(prev => ({ ...prev, resolution: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutions.map((res) => (
                      <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orientation" className="text-right">Orientación</Label>
                <Select value={formData.orientation} onValueChange={(value: 'landscape' | 'portrait') => setFormData(prev => ({ ...prev, orientation: value }))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Horizontal</SelectItem>
                    <SelectItem value="portrait">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddScreen}>Agregar Pantalla</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingScreen} onOpenChange={(open) => !open && setEditingScreen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pantalla</DialogTitle>
            <DialogDescription>
              Modifica la configuración de la pantalla seleccionada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">Ubicación</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-resolution" className="text-right">Resolución</Label>
              <Select value={formData.resolution} onValueChange={(value) => setFormData(prev => ({ ...prev, resolution: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map((res) => (
                    <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-orientation" className="text-right">Orientación</Label>
              <Select value={formData.orientation} onValueChange={(value: 'landscape' | 'portrait') => setFormData(prev => ({ ...prev, orientation: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landscape">Horizontal</SelectItem>
                  <SelectItem value="portrait">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditScreen}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Content Dialog */}
      <Dialog open={!!configuringScreen} onOpenChange={(open) => !open && setConfiguringScreen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Contenido de Pantalla</DialogTitle>
            <DialogDescription>
              Asigna una carpeta de contenido para mostrar en la pantalla "{configuringScreen?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder" className="text-right">
                Carpeta
              </Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una carpeta" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder === 'all' ? 'Todos los archivos' : folder.charAt(0).toUpperCase() + folder.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfiguringScreen(null)} variant="outline">Cancelar</Button>
            <Button onClick={handleAssignFolder}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.map((screen) => (
          <Card key={screen.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  {screen.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(screen.status)}`} />
                  <Badge variant={screen.status === 'online' ? 'default' : 'secondary'}>
                    {getStatusText(screen.status)}
                  </Badge>
                </div>
              </div>
              <CardDescription>{screen.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Resolución:</span>
                  <p className="text-gray-600">{screen.resolution}</p>
                </div>
                <div>
                  <span className="font-medium">Orientación:</span>
                  <p className="text-gray-600">
                    {screen.orientation === 'landscape' ? 'Horizontal' : 'Vertical'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Contenido Asignado:</span>
                  <p className="text-gray-600">
                    {screen.assignedFolder
                      ? screen.assignedFolder === 'all'
                        ? 'Todos los archivos'
                        : screen.assignedFolder.charAt(0).toUpperCase() + screen.assignedFolder.slice(1)
                      : 'Ninguno'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleScreenStatus(screen)}
                  >
                    {screen.status === 'online' ? (
                      <WifiOff className="h-4 w-4" />
                    ) : (
                      <Wifi className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(screen)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteScreen(screen.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => openConfigureDialog(screen)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {screens.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pantallas configuradas</h3>
            <p className="text-gray-500 mb-4">
              Agrega tu primera pantalla para comenzar a gestionar contenido publicitario.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Pantalla
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}