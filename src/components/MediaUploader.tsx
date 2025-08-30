import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Image, Video, CheckCircle } from 'lucide-react';
import { mockBackend } from '@/lib/mock-backend';
import { websocketClient } from '@/lib/websocket';

interface MediaUploaderProps {
  onMediaUploaded: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
}

export default function MediaUploader({ onMediaUploaded }: MediaUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('promociones');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = [
    { value: 'promociones', label: 'Promociones' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'productos', label: 'Productos' },
    { value: 'temporadas', label: 'Temporadas' }
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];
    Array.from(files).forEach((file) => {
      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(`Archivo ${file.name} no es compatible. Solo se permiten imágenes y videos.`);
        return;
      }

      // Validate file size
      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
      if (file.size > maxSize) {
        alert(`Archivo ${file.name} es demasiado grande. Máximo ${isImage ? '10MB' : '100MB'}.`);
        return;
      }

      const uploadFile: UploadFile = {
        file,
        id: Date.now() + Math.random().toString(),
        progress: 0,
        status: 'pending'
      };

      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, preview: e.target?.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadFile);
    });

    setUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async (uploadFile: UploadFile) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 50 } : f
    ));

    try {
      // Upload to the real backend
      const mediaFile = await mockBackend.addMediaFile(uploadFile.file);

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'completed', progress: 100 } : f
      ));

      // Notify via WebSocket
      websocketClient.send({ type: 'media_updated', data: mediaFile });

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'error' } : f
      ));
    }
  };

  const uploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await handleUpload(file);
    }

    onMediaUploaded();
    
    // Clear completed files after a delay
    setTimeout(() => {
      setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Archivos Multimedia
        </CardTitle>
        <CardDescription>
          Arrastra archivos o haz clic para seleccionar. Soporta imágenes (JPG, PNG, WebP) hasta 10MB y videos (MP4, WebM) hasta 100MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Folder Selection */}
        <div className="flex items-center space-x-4">
          <Label htmlFor="folder-select">Carpeta de destino:</Label>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.value} value={folder.value}>
                  {folder.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Arrastra archivos aquí o haz clic para seleccionar
          </h3>
          <p className="text-gray-500">
            Imágenes: JPG, PNG, WebP (máx. 10MB) • Videos: MP4, WebM (máx. 100MB)
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Upload Queue */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Archivos seleccionados ({uploadFiles.length})</h4>
              <Button 
                onClick={uploadAll}
                disabled={uploadFiles.every(f => f.status !== 'pending')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Subir Todos
              </Button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {uploadFile.preview ? (
                      <img 
                        src={uploadFile.preview} 
                        alt={uploadFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : uploadFile.file.type.startsWith('image/') ? (
                      <Image className="h-12 w-12 text-gray-400" />
                    ) : (
                      <Video className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                  </div>

                  {/* Status/Actions */}
                  <div className="flex-shrink-0">
                    {uploadFile.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : uploadFile.status === 'uploading' ? (
                      <div className="text-sm text-blue-600">{uploadFile.progress}%</div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}