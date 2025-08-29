// Display Application - Fullscreen advertising content viewer
class DisplayApp {
    constructor() {
        this.clickCount = 0;
        this.clickTimer = null;
        this.currentScreenId = null;
        this.contentRotationTimer = null;
        this.currentContentIndex = 0;
        this.mediaFiles = [];
        this.isConfigMode = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing Display App...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for saved screen configuration
        await this.loadConfiguration();
        
        // Enter fullscreen mode
        this.enterFullscreen();
        
        // Start content loading
        await this.loadContent();
        
        // Hide loading screen
        document.getElementById('loadingScreen').classList.add('hidden');
        
        // Start content rotation
        this.startContentRotation();
        
        console.log('Display App initialized successfully');
    }

    setupEventListeners() {
        const clickZone = document.getElementById('clickZone');
        const configModal = document.getElementById('configModal');
        const configForm = document.getElementById('configForm');
        const cancelBtn = document.getElementById('cancelBtn');

        // 5-click detection
        clickZone.addEventListener('click', (e) => {
            this.handleCenterClick(e);
        });

        // Configuration form
        configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfiguration();
        });

        cancelBtn.addEventListener('click', () => {
            this.hideConfigModal();
        });

        // Fullscreen change detection
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                setTimeout(() => this.enterFullscreen(), 1000);
            }
        });

        // Storage events for real-time sync
        window.addEventListener('storage', (e) => {
            if (e.key === 'cms_websocket_message') {
                this.handleWebSocketMessage(e);
            }
        });

        // Keyboard shortcuts (for development)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isConfigMode) {
                this.hideConfigModal();
            } else if (e.key === 'F11') {
                e.preventDefault();
                this.enterFullscreen();
            }
        });
    }

    handleCenterClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const clickZone = document.getElementById('clickZone');
        clickZone.classList.add('active');
        
        setTimeout(() => {
            clickZone.classList.remove('active');
        }, 300);

        this.clickCount++;
        console.log(`Click ${this.clickCount}/5`);

        // Reset timer
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
        }

        // Check if 5 clicks reached
        if (this.clickCount >= 5) {
            this.showConfigModal();
            this.clickCount = 0;
            return;
        }

        // Reset click count after 2 seconds of inactivity
        this.clickTimer = setTimeout(() => {
            this.clickCount = 0;
        }, 2000);
    }

    async showConfigModal() {
        console.log('Opening configuration modal...');
        this.isConfigMode = true;
        
        // Load available screens
        await this.loadAvailableScreens();
        
        const modal = document.getElementById('configModal');
        modal.classList.add('show');
        
        // Focus on select element
        setTimeout(() => {
            document.getElementById('screenSelect').focus();
        }, 100);
    }

    hideConfigModal() {
        console.log('Closing configuration modal...');
        this.isConfigMode = false;
        
        const modal = document.getElementById('configModal');
        modal.classList.remove('show');
        
        this.clickCount = 0;
    }

    async loadAvailableScreens() {
        try {
            const screens = this.getStoredScreens();
            const screenSelect = document.getElementById('screenSelect');
            
            screenSelect.innerHTML = '<option value="">Seleccionar pantalla...</option>';
            
            screens.forEach(screen => {
                const option = document.createElement('option');
                option.value = screen.id;
                option.textContent = `${screen.name} - ${screen.location}`;
                option.selected = screen.id === this.currentScreenId;
                screenSelect.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading screens:', error);
            const screenSelect = document.getElementById('screenSelect');
            screenSelect.innerHTML = '<option value="">Error cargando pantallas</option>';
        }
    }

    async saveConfiguration() {
        const screenSelect = document.getElementById('screenSelect');
        const selectedScreenId = screenSelect.value;
        
        if (!selectedScreenId) {
            alert('Por favor selecciona una pantalla');
            return;
        }

        console.log('Saving configuration for screen:', selectedScreenId);
        
        // Save to localStorage
        localStorage.setItem('display_screen_id', selectedScreenId);
        this.currentScreenId = selectedScreenId;
        
        // Update status indicator
        this.updateStatusIndicator();
        
        // Reload content for new screen
        await this.loadContent();
        
        // Hide modal
        this.hideConfigModal();
        
        // Show confirmation
        this.showNotification('Configuración guardada correctamente');
    }

    async loadConfiguration() {
        // Check for saved screen ID
        const savedScreenId = localStorage.getItem('display_screen_id');
        
        if (savedScreenId) {
            this.currentScreenId = savedScreenId;
            console.log('Loaded saved screen configuration:', savedScreenId);
        } else {
            console.log('No saved configuration found, will show config on first run');
            // Show configuration modal for first-time setup
            setTimeout(() => this.showConfigModal(), 2000);
        }
        
        this.updateStatusIndicator();
    }

    async loadContent() {
        try {
            console.log('Loading content for screen:', this.currentScreenId);
            if (!this.currentScreenId) {
                this.showWelcomeScreen();
                return;
            }

            const allScreens = this.getStoredScreens();
            const currentScreen = allScreens.find(s => s.id === this.currentScreenId);
            const assignedFolder = currentScreen?.assignedFolder;

            const allMediaFiles = this.getStoredMediaFiles();
            let filteredMedia = allMediaFiles;

            if (assignedFolder && assignedFolder !== 'all') {
                filteredMedia = allMediaFiles.filter(file => file.folder === assignedFolder);
            }
            
            if (filteredMedia.length === 0) {
                this.showWelcomeScreen();
                return;
            }
            
            this.mediaFiles = filteredMedia;
            this.currentContentIndex = 0;
            
            console.log(`Loaded ${this.mediaFiles.length} media files for folder "${assignedFolder || 'all'}"`);
            
        } catch (error) {
            console.error('Error loading content:', error);
            this.showErrorScreen('Error cargando contenido');
        }
    }

    getStoredMediaFiles() {
        try {
            const stored = localStorage.getItem('cms_media_files');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error parsing media files:', error);
            return [];
        }
    }

    getStoredScreens() {
        try {
            const stored = localStorage.getItem('cms_screens');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error parsing screens:', error);
            return [];
        }
    }

    startContentRotation() {
        if (this.mediaFiles.length === 0) {
            console.log('No content to rotate');
            return;
        }

        this.displayCurrentContent();
        
        // Rotate content every 10 seconds
        this.contentRotationTimer = setInterval(() => {
            this.nextContent();
        }, 10000);
        
        console.log('Content rotation started');
    }

    stopContentRotation() {
        if (this.contentRotationTimer) {
            clearInterval(this.contentRotationTimer);
            this.contentRotationTimer = null;
        }
    }

    nextContent() {
        if (this.mediaFiles.length === 0) return;
        
        this.currentContentIndex = (this.currentContentIndex + 1) % this.mediaFiles.length;
        this.displayCurrentContent();
    }

    displayCurrentContent() {
        if (this.mediaFiles.length === 0) return;
        
        const currentMedia = this.mediaFiles[this.currentContentIndex];
        const contentDisplay = document.getElementById('contentDisplay');
        
        console.log('Displaying content:', currentMedia.name);
        
        // Fade out current content
        const currentElement = contentDisplay.querySelector('.media-content');
        if (currentElement) {
            currentElement.classList.add('fade-out');
            setTimeout(() => {
                this.renderMediaContent(currentMedia, contentDisplay);
            }, 250);
        } else {
            this.renderMediaContent(currentMedia, contentDisplay);
        }
    }

    renderMediaContent(media, container) {
        container.innerHTML = '';
        
        let mediaElement;
        
        if (media.type.startsWith('image/')) {
            mediaElement = document.createElement('img');
            mediaElement.src = media.url;
            mediaElement.alt = media.name;
        } else if (media.type.startsWith('video/')) {
            mediaElement = document.createElement('video');
            mediaElement.src = media.url;
            mediaElement.autoplay = true;
            mediaElement.muted = true;
            mediaElement.loop = true;
        } else {
            console.warn('Unsupported media type:', media.type);
            return;
        }
        
        mediaElement.className = 'media-content fade-in';
        
        mediaElement.onerror = () => {
            console.error('Error loading media:', media.name);
            this.showErrorScreen('Error cargando contenido multimedia');
        };
        
        container.appendChild(mediaElement);
    }

    showWelcomeScreen() {
        const contentDisplay = document.getElementById('contentDisplay');
        contentDisplay.innerHTML = `
            <div class="welcome-screen">
                <h1 class="welcome-title">Multi-Screen CMS</h1>
                <p class="welcome-subtitle">Display publicitario iniciado</p>
                <p style="color: #666; font-size: 0.9rem;">No hay contenido disponible</p>
                <p style="color: #666; font-size: 0.8rem; margin-top: 1rem;">
                    Sube contenido desde el CMS para comenzar
                </p>
            </div>
        `;
    }

    showErrorScreen(message) {
        const contentDisplay = document.getElementById('contentDisplay');
        contentDisplay.innerHTML = `
            <div class="welcome-screen">
                <h1 class="welcome-title" style="color: #ff4444;">Error</h1>
                <p class="welcome-subtitle">${message}</p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 1rem;">
                    Verifica la conexión y recarga la página
                </p>
            </div>
        `;
    }

    updateStatusIndicator() {
        const indicator = document.getElementById('statusIndicator');
        const isOnline = this.currentScreenId && this.mediaFiles.length > 0;
        
        if (isOnline) {
            indicator.innerHTML = '<span class="status-online">● En línea</span>';
        } else {
            indicator.innerHTML = '<span class="status-offline">● Desconectado</span>';
        }
    }

    showNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: rgba(0, 102, 204, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            z-index: 1001;
            font-size: 0.9rem;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    handleWebSocketMessage(event) {
        if (!event.newValue) return;
        
        try {
            const message = JSON.parse(event.newValue);
            
            switch (message.type) {
                case 'media_updated':
                    console.log('Media updated, reloading content...');
                    this.loadContent();
                    break;
                    
                case 'screen_updated':
                    console.log('Screen configuration updated');
                    break;
                    
                case 'display_command':
                    if (message.data.screenId === this.currentScreenId) {
                        this.handleDisplayCommand(message.data);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }

    handleDisplayCommand(command) {
        console.log('Received display command:', command);
        
        switch (command.command) {
            case 'reload_content':
                this.loadContent();
                break;
                
            case 'next_content':
                this.nextContent();
                break;
                
            case 'enter_fullscreen':
                this.enterFullscreen();
                break;
        }
    }

    enterFullscreen() {
        if (document.fullscreenElement) return;
        
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
                console.warn('Could not enter fullscreen:', err);
            });
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    // Cleanup method
    destroy() {
        this.stopContentRotation();
        
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
        }
        
        console.log('Display App destroyed');
    }
}

// Initialize the display app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.displayApp = new DisplayApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.displayApp) {
        window.displayApp.destroy();
    }
});