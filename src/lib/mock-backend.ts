// Mock backend using localStorage for MVP implementation
export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  folder: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  status: 'online' | 'offline' | 'maintenance';
  assignedFolder?: string; // Nuevo campo para la carpeta asignada
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPlaylist {
  id: string;
  screenId: string;
  mediaFiles: string[]; // Array of media file IDs
  currentIndex: number;
  isPlaying: boolean;
  updatedAt: Date;
}

interface StoredMediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  folder: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredScreen {
  id: string;
  name: string;
  location: string;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  status: 'online' | 'offline' | 'maintenance';
  assignedFolder?: string;
  createdAt: string;
  updatedAt: string;
}

class MockBackend {
  private readonly MEDIA_KEY = 'cms_media_files';
  private readonly SCREENS_KEY = 'cms_screens';
  private readonly PLAYLISTS_KEY = 'cms_playlists';

  // Media Files Management
  async getMediaFiles(): Promise<MediaFile[]> {
    const stored = localStorage.getItem(this.MEDIA_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored).map((file: StoredMediaFile) => ({
      ...file,
      createdAt: new Date(file.createdAt),
      updatedAt: new Date(file.updatedAt)
    }));
  }

  async addMediaFile(fileData: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaFile> {
    const files = await this.getMediaFiles();
    const newFile: MediaFile = {
      ...fileData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    files.push(newFile);
    localStorage.setItem(this.MEDIA_KEY, JSON.stringify(files));
    return newFile;
  }

  async deleteMediaFile(id: string): Promise<void> {
    const files = await this.getMediaFiles();
    const filtered = files.filter(file => file.id !== id);
    localStorage.setItem(this.MEDIA_KEY, JSON.stringify(filtered));
  }

  async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile | null> {
    const files = await this.getMediaFiles();
    const index = files.findIndex(file => file.id === id);
    
    if (index === -1) return null;
    
    files[index] = { ...files[index], ...updates, updatedAt: new Date() };
    localStorage.setItem(this.MEDIA_KEY, JSON.stringify(files));
    return files[index];
  }

  // Screens Management
  async getScreens(): Promise<Screen[]> {
    const stored = localStorage.getItem(this.SCREENS_KEY);
    if (!stored) {
      // Initialize with demo screens
      const demoScreens: Screen[] = [
        {
          id: 'screen-1',
          name: 'Pantalla Principal',
          location: 'Lobby de Entrada',
          resolution: '1920x1080',
          orientation: 'landscape',
          status: 'online',
          assignedFolder: 'promociones',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'screen-2',
          name: 'Pantalla Lateral',
          location: 'Área de Espera',
          resolution: '1366x768',
          orientation: 'landscape',
          status: 'online',
          assignedFolder: 'eventos',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'screen-3',
          name: 'Pantalla Vertical',
          location: 'Pasillo Principal',
          resolution: '1080x1920',
          orientation: 'portrait',
          status: 'offline',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      localStorage.setItem(this.SCREENS_KEY, JSON.stringify(demoScreens));
      return demoScreens;
    }
    
    return JSON.parse(stored).map((screen: StoredScreen) => ({
      ...screen,
      createdAt: new Date(screen.createdAt),
      updatedAt: new Date(screen.updatedAt)
    }));
  }

  async addScreen(screenData: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>): Promise<Screen> {
    const screens = await this.getScreens();
    const newScreen: Screen = {
      ...screenData,
      id: 'screen-' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    screens.push(newScreen);
    localStorage.setItem(this.SCREENS_KEY, JSON.stringify(screens));
    return newScreen;
  }

  async updateScreen(id: string, updates: Partial<Screen>): Promise<Screen | null> {
    const screens = await this.getScreens();
    const index = screens.findIndex(screen => screen.id === id);
    
    if (index === -1) return null;
    
    screens[index] = { ...screens[index], ...updates, updatedAt: new Date() };
    localStorage.setItem(this.SCREENS_KEY, JSON.stringify(screens));
    return screens[index];
  }

  async updateScreenStatus(id: string, status: Screen['status']): Promise<Screen | null> {
    return this.updateScreen(id, { status });
  }

  async deleteScreen(id: string): Promise<void> {
    const screens = await this.getScreens();
    const filtered = screens.filter(screen => screen.id !== id);
    localStorage.setItem(this.SCREENS_KEY, JSON.stringify(filtered));
  }

  // Content Playlists Management
  async getPlaylist(screenId: string): Promise<ContentPlaylist | null> {
    const stored = localStorage.getItem(this.PLAYLISTS_KEY);
    if (!stored) return null;
    
    const playlists = JSON.parse(stored);
    const playlist = playlists.find((p: ContentPlaylist) => p.screenId === screenId);
    
    if (!playlist) return null;
    
    return {
      ...playlist,
      updatedAt: new Date(playlist.updatedAt)
    };
  }

  async updatePlaylist(screenId: string, mediaFiles: string[]): Promise<ContentPlaylist> {
    const stored = localStorage.getItem(this.PLAYLISTS_KEY);
    const playlists = stored ? JSON.parse(stored) : [];
    
    const existingIndex = playlists.findIndex((p: ContentPlaylist) => p.screenId === screenId);
    const playlist: ContentPlaylist = {
      id: existingIndex >= 0 ? playlists[existingIndex].id : 'playlist-' + Date.now().toString(),
      screenId,
      mediaFiles,
      currentIndex: 0,
      isPlaying: true,
      updatedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    localStorage.setItem(this.PLAYLISTS_KEY, JSON.stringify(playlists));
    return playlist;
  }

  async getActiveContent(screenId: string): Promise<MediaFile | null> {
    const playlist = await this.getPlaylist(screenId);
    if (!playlist || playlist.mediaFiles.length === 0) return null;
    
    const mediaFiles = await this.getMediaFiles();
    const currentMediaId = playlist.mediaFiles[playlist.currentIndex];
    
    return mediaFiles.find(file => file.id === currentMediaId) || null;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    localStorage.removeItem(this.MEDIA_KEY);
    localStorage.removeItem(this.SCREENS_KEY);
    localStorage.removeItem(this.PLAYLISTS_KEY);
  }

  async exportData(): Promise<string> {
    const data = {
      mediaFiles: await this.getMediaFiles(),
      screens: await this.getScreens(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (data.mediaFiles) {
        localStorage.setItem(this.MEDIA_KEY, JSON.stringify(data.mediaFiles));
      }
      if (data.screens) {
        localStorage.setItem(this.SCREENS_KEY, JSON.stringify(data.screens));
      }
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }
}

export const mockBackend = new MockBackend();