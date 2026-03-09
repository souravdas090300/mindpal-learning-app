/**
 * Study Room Detail Page
 * 
 * Real-time collaborative study room with:
 * - Live chat
 * - Active participants list
 * - Typing indicators
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { initSocket, joinRoom, leaveRoom, sendMessage, sendTyping } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  max_participants: number | null;
  activeUsers: User[];
  activeUserCount: number;
}

export default function StudyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentUserEmail = useRef<string>('');

  const fetchRoomDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/study-rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoom(response.data.room);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      alert('Failed to load study room');
      router.push('/study-rooms');
    } finally {
      setLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get current user email from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserEmail.current = payload.email;
    } catch (error) {
      console.error('Failed to parse token:', error);
    }

    // Fetch room details
    fetchRoomDetails();

    // Initialize Socket.IO
    const socket = initSocket(token);
    
    socket.on('connect', () => {
      console.log('Connected to study room');
      setConnected(true);
      joinRoom(roomId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from study room');
      setConnected(false);
    });

    // Listen for new messages
    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for user joined
    socket.on('user-joined', (data: { userId: string; userName: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          userId: 'system',
          userName: 'System',
          message: `${data.userName} joined the room`,
          timestamp: new Date().toISOString(),
        },
      ]);
      fetchRoomDetails(); // Refresh active users
    });

    // Listen for user left
    socket.on('user-left', (data: { userId: string; userName: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          userId: 'system',
          userName: 'System',
          message: `${data.userName} left the room`,
          timestamp: new Date().toISOString(),
        },
      ]);
      fetchRoomDetails(); // Refresh active users
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTyping((prev) => [...prev.filter((u) => u !== data.userName), data.userName]);
      } else {
        setTyping((prev) => prev.filter((u) => u !== data.userName));
      }
    });

    // Listen for active users
    socket.on('active-users', (data: { users: string[]; count: number }) => {
      console.log('Active users:', data);
    });

    // Cleanup
    return () => {
      leaveRoom(roomId);
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-typing');
      socket.off('active-users');
      // Don't disconnect socket here, let it persist for other pages
    };
  }, [roomId, router, fetchRoomDetails]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(roomId, newMessage);
    setNewMessage('');
    
    // Stop typing indicator
    sendTyping(roomId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Send typing indicator
    if (value && !typingTimeoutRef.current) {
      sendTyping(roomId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(roomId, false);
      typingTimeoutRef.current = undefined;
    }, 2000);
  };

  const handleLeaveRoom = () => {
    leaveRoom(roomId);
    router.push('/study-rooms');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Room not found</p>
          <button
            onClick={() => router.push('/study-rooms')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Back to study rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveRoom}
                className="text-gray-500 hover:text-gray-700 transition"
                title="Leave room"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
                {room.description && (
                  <p className="text-sm text-gray-600">{room.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-xl">👥</span>
              <span className="text-sm">{room.activeUserCount} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <div className="text-4xl mb-2">💬</div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.userId === 'system'
                    ? 'justify-center'
                    : msg.userName === currentUserEmail.current
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {msg.userId === 'system' ? (
                  <div className="text-xs text-gray-500 italic">{msg.message}</div>
                ) : (
                  <div
                    className={`max-w-[70%] ${
                      msg.userName === currentUserEmail.current
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-900 shadow'
                    } rounded-lg px-4 py-2`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-75">{msg.userName}</span>
                      <span className="text-xs opacity-50">
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {typing.length > 0 && (
              <div className="text-xs text-gray-500 italic">
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={!connected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !connected}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Participants Sidebar */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Participants ({room.activeUserCount})
          </h3>
          <div className="space-y-2">
            {room.activeUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.email}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
