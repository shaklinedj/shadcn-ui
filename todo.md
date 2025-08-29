# Multi-Screen CMS Implementation Plan

## MVP Implementation Strategy
Focus on core functionality with minimal complexity to ensure successful completion.

## Core Files to Create (Max 8 files limit):

### 1. CMS Application (Main Interface)
- **src/pages/Index.tsx** - Main CMS dashboard with media management
- **src/components/MediaUploader.tsx** - File upload component for images/videos
- **src/components/ScreenManager.tsx** - Multi-screen configuration panel
- **src/lib/websocket.ts** - WebSocket client for real-time sync

### 2. Display Application (Separate PWA)
- **public/display.html** - Standalone fullscreen display app
- **public/display.js** - Display logic with 5-click detection
- **public/display-sw.js** - Service worker for offline functionality

### 3. Backend Services (Simplified)
- **src/lib/mock-backend.ts** - Mock backend with localStorage for MVP

## Key Features Implementation:
1. ✅ Media upload (images/videos) with drag-drop
2. ✅ Folder organization system
3. ✅ Multi-screen management panel
4. ✅ Real-time sync simulation
5. ✅ Fullscreen display app with 5-click detection
6. ✅ Screen selection on first load
7. ✅ Content playlist management
8. ✅ Offline functionality with localStorage

## Technical Approach:
- Use localStorage as backend for MVP (no complex server setup)
- WebSocket simulation with localStorage events
- PWA features for display app
- Responsive design with Shadcn-ui components
- TypeScript for type safety

## File Relationships:
- Index.tsx imports MediaUploader, ScreenManager
- WebSocket.ts handles real-time communication simulation
- Display.html is standalone PWA for fullscreen viewing
- Mock-backend.ts provides data persistence layer

This simplified approach ensures all requirements are met while staying within complexity limits.