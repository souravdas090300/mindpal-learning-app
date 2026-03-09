/**
 * Socket.IO Client for Real-Time Study Rooms
 * 
 * Provides WebSocket connection for:
 * - Real-time chat
 * - User presence
 * - Typing indicators
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 * @param token - JWT authentication token
 * @returns Socket instance
 */
export function initSocket(token: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  socket = io(apiUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.IO connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO connection error:', error.message);
  });

  return socket;
}

/**
 * Get the current socket instance
 * @returns Socket instance or null if not connected
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Join a study room
 * @param roomId - Study room ID
 */
export function joinRoom(roomId: string): void {
  socket?.emit('join-room', roomId);
}

/**
 * Leave a study room
 * @param roomId - Study room ID
 */
export function leaveRoom(roomId: string): void {
  socket?.emit('leave-room', roomId);
}

/**
 * Send a chat message
 * @param roomId - Study room ID
 * @param message - Message text
 */
export function sendMessage(roomId: string, message: string): void {
  socket?.emit('send-message', { roomId, message });
}

/**
 * Send typing indicator
 * @param roomId - Study room ID
 * @param isTyping - Whether user is typing
 */
export function sendTyping(roomId: string, isTyping: boolean): void {
  socket?.emit('typing', { roomId, isTyping });
}

const socketFunctions = {
  initSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendTyping,
};

export default socketFunctions;
