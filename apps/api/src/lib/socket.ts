/**
 * Socket.IO Server for Real-Time Study Rooms
 * 
 * Provides WebSocket functionality for:
 * - Real-time chat in study rooms
 * - User presence tracking
 * - Typing indicators
 * - Room join/leave notifications
 * 
 * @module lib/socket
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './auth';

interface UserData {
  userId: string;
  email: string;
  name?: string;
}

interface MessageData {
  roomId: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: string;
}

interface TypingData {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

let io: SocketIOServer | null = null;

// Track active users in rooms
const activeUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

/**
 * Initialize Socket.IO server
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:19000',
        'http://localhost:19006',
        /^https:\/\/.*\.vercel\.app$/,
        /^exp:\/\/.*$/,
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const user = verifyToken(token);
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as UserData;
    console.log(`✅ User connected: ${user.email} (${socket.id})`);

    /**
     * Join a study room
     */
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);

      // Track active user
      if (!activeUsers.has(roomId)) {
        activeUsers.set(roomId, new Set());
      }
      activeUsers.get(roomId)?.add(user.userId);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        userId: user.userId,
        userName: user.email,
        timestamp: new Date().toISOString(),
      });

      // Send current active users to the joining user
      const activeUsersList = Array.from(activeUsers.get(roomId) || []);
      socket.emit('active-users', {
        roomId,
        users: activeUsersList,
        count: activeUsersList.length,
      });

      console.log(`📥 User ${user.email} joined room: ${roomId}`);
    });

    /**
     * Leave a study room
     */
    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);

      // Remove from active users
      activeUsers.get(roomId)?.delete(user.userId);

      // Notify others in the room
      socket.to(roomId).emit('user-left', {
        userId: user.userId,
        userName: user.email,
        timestamp: new Date().toISOString(),
      });

      console.log(`📤 User ${user.email} left room: ${roomId}`);
    });

    /**
     * Send a chat message
     */
    socket.on('send-message', (data: MessageData) => {
      const message = {
        ...data,
        userId: user.userId,
        userName: user.email,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all users in the room (including sender)
      io?.to(data.roomId).emit('new-message', message);

      console.log(`💬 Message in room ${data.roomId}: ${data.message}`);
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data: TypingData) => {
      socket.to(data.roomId).emit('user-typing', {
        userId: user.userId,
        userName: user.email,
        isTyping: data.isTyping,
      });
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      // Remove user from all rooms
      activeUsers.forEach((users, roomId) => {
        if (users.has(user.userId)) {
          users.delete(user.userId);
          
          // Notify room members
          io?.to(roomId).emit('user-left', {
            userId: user.userId,
            userName: user.email,
            timestamp: new Date().toISOString(),
          });
        }
      });

      console.log(`❌ User disconnected: ${user.email} (${socket.id})`);
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance
 * @returns Socket.IO server instance or null if not initialized
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Get active users in a room
 * @param roomId - Study room ID
 * @returns Array of user IDs
 */
export function getActiveUsersInRoom(roomId: string): string[] {
  return Array.from(activeUsers.get(roomId) || []);
}

/**
 * Send notification to a specific room
 * @param roomId - Study room ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToRoom(roomId: string, event: string, data: any): void {
  io?.to(roomId).emit(event, data);
}
