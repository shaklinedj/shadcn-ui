// WebSocket client simulation using localStorage events for real-time sync
interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class WebSocketClient {
  private listeners: ((message: WebSocketMessage) => void)[] = [];
  private isConnected = false;
  private eventListener?: (event: StorageEvent) => void;

  connect(): void {
    if (this.isConnected) return;

    // Simulate WebSocket connection using localStorage events
    this.eventListener = (event: StorageEvent) => {
      if (event.key === 'cms_websocket_message' && event.newValue) {
        try {
          const message: WebSocketMessage = JSON.parse(event.newValue);
          this.notifyListeners(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    };

    window.addEventListener('storage', this.eventListener);
    this.isConnected = true;
    
    console.log('WebSocket client connected (simulated)');
  }

  disconnect(): void {
    if (!this.isConnected) return;

    if (this.eventListener) {
      window.removeEventListener('storage', this.eventListener);
    }
    
    this.isConnected = false;
    this.listeners = [];
    
    console.log('WebSocket client disconnected');
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, message not sent');
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now()
    };

    // Store message in localStorage to trigger storage event
    localStorage.setItem('cms_websocket_message', JSON.stringify(fullMessage));
    
    // Clean up the message after a short delay
    setTimeout(() => {
      localStorage.removeItem('cms_websocket_message');
    }, 100);

    console.log('WebSocket message sent:', fullMessage);
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(message: WebSocketMessage): void {
    this.listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket message listener:', error);
      }
    });
  }

  // Utility methods for common message types
  sendMediaUpdate(mediaFile: Record<string, unknown>): void {
    this.send({
      type: 'media_updated',
      data: mediaFile
    });
  }

  sendScreenUpdate(screen: Record<string, unknown>): void {
    this.send({
      type: 'screen_updated',
      data: screen
    });
  }

  sendPlaylistUpdate(playlist: Record<string, unknown>): void {
    this.send({
      type: 'playlist_updated',
      data: playlist
    });
  }

  sendDisplayCommand(screenId: string, command: string, params?: Record<string, unknown>): void {
    this.send({
      type: 'display_command',
      data: {
        screenId,
        command,
        params: params || {},
        timestamp: Date.now()
      }
    });
  }

  // Heartbeat mechanism for connection monitoring
  startHeartbeat(intervalMs: number = 30000): void {
    if (!this.isConnected) return;

    const heartbeatInterval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(heartbeatInterval);
        return;
      }

      this.send({
        type: 'heartbeat',
        data: { timestamp: Date.now() }
      });
    }, intervalMs);
  }

  // Connection status
  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

export const websocketClient = new WebSocketClient();

// Auto-connect when module is imported
if (typeof window !== 'undefined') {
  websocketClient.connect();
}