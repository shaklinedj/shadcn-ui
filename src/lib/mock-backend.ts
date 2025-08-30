// API service for interacting with the backend
const API_URL = 'http://localhost:3001/api';

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  path: string;
  // The following fields are from the old mock interface and might not be on the backend model.
  // They are kept for now to avoid breaking UI components.
  size?: number;
  folder?: string;
  url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Screen {
  id: string;
  name: string;
  location: string;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  status: 'online' | 'offline' | 'maintenance';
  assignedFolder?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ... other interfaces can remain for now ...

class ApiService {
  // --- Media Files Management ---
  async getMediaFiles(): Promise<MediaFile[]> {
    const response = await fetch(`${API_URL}/media`);
    if (!response.ok) {
      throw new Error('Failed to fetch media files');
    }
    return response.json();
  }

  async addMediaFile(file: File): Promise<MediaFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/media`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media file');
    }
    return response.json();
  }

  async deleteMediaFile(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/media/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete media file');
    }
  }

  // --- Screens Management (Still Mocked) ---
  private readonly SCREENS_KEY = 'cms_screens';
  async getScreens(): Promise<Screen[]> {
    const stored = localStorage.getItem(this.SCREENS_KEY);
    if (!stored) return []; // Return empty array if nothing is stored
    return JSON.parse(stored).map((screen: any) => ({
      ...screen,
      createdAt: new Date(screen.createdAt),
      updatedAt: new Date(screen.updatedAt)
    }));
  }
  // ... other screen methods remain mocked for now ...
}

export const apiService = new ApiService();
// For backward compatibility, we can also export it as mockBackend
export const mockBackend = apiService;