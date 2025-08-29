// Real WebSocket client
interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: ((message: WebSocketMessage) => void)[] = [];
  private isConnected = false;
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  connect(): void {
    if (this.isConnected || this.ws) return;

    // Use the port the server is running on
    const port = 3001;
    this.ws = new WebSocket(`ws://localhost:${port}`);

    this.ws.onopen = () => {
      this.isConnected = true;
      console.log('WebSocket client connected');
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.notifyListeners(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.ws = null;
      console.log('WebSocket client disconnected. Attempting to reconnect...');
      this.reconnectTimeoutId = setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onclose will be called next
    };
  }

  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  send(message: Omit<WebSocketMessage, 'timestamp'>): void {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, message not sent');
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(fullMessage));
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

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

export const websocketClient = new WebSocketClient();

// Auto-connect when module is imported
if (typeof window !== 'undefined') {
  websocketClient.connect();
}