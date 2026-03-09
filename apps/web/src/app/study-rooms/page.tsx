/**
 * Study Rooms List Page
 * 
 * Displays all available study rooms and allows creating new ones
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StudyRoom {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  max_participants: number | null;
  activeUsers: number;
  created_at: string;
}

export default function StudyRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  // Create room form state
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    isPublic: true,
    maxParticipants: '',
  });

  const fetchRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/study-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let filteredRooms = response.data.rooms;
      
      if (filter === 'public') {
        filteredRooms = filteredRooms.filter((room: StudyRoom) => room.is_public);
      } else if (filter === 'private') {
        filteredRooms = filteredRooms.filter((room: StudyRoom) => !room.is_public);
      }

      setRooms(filteredRooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRooms();
    // Refresh room list every 10 seconds to update active users
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [filter, fetchRooms]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/study-rooms`,
        {
          name: newRoom.name,
          description: newRoom.description || null,
          isPublic: newRoom.isPublic,
          maxParticipants: newRoom.maxParticipants ? parseInt(newRoom.maxParticipants) : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowCreateModal(false);
      setNewRoom({ name: '', description: '', isPublic: true, maxParticipants: '' });
      fetchRooms();
      
      // Navigate to the new room
      router.push(`/study-rooms/${response.data.room.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create study room');
    }
  };

  const joinRoom = (roomId: string) => {
    router.push(`/study-rooms/${roomId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading study rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Rooms</h1>
              <p className="mt-2 text-gray-600">Join or create collaborative study spaces</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Room
            </button>
          </div>

          {/* Filters */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Rooms
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'public'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setFilter('private')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'private'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Rooms
            </button>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No study rooms found</h3>
            <p className="text-gray-500 mb-6">Create your first study room to get started!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Create Study Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer"
                onClick={() => joinRoom(room.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{room.name}</h3>
                  {room.is_public ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Public
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>

                {room.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-lg">👥</span>
                    <span>
                      {room.activeUsers} active
                      {room.max_participants && ` / ${room.max_participants} max`}
                    </span>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Join →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Study Room</h2>
            
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Math Study Group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="What will you study in this room?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants (Optional)
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={newRoom.maxParticipants}
                    onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newRoom.isPublic}
                    onChange={(e) => setNewRoom({ ...newRoom, isPublic: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this room public (anyone can join)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoom({ name: '', description: '', isPublic: true, maxParticipants: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
