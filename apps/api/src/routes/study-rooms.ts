/**
 * Study Rooms API Routes
 * 
 * Endpoints for managing collaborative study rooms:
 * - Create and join study rooms
 * - List available rooms
 * - Get room details and participants
 * - Delete rooms
 * 
 * Real-time chat is handled via Socket.IO (see lib/socket.ts)
 * 
 * @module routes/study-rooms
 */

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticateToken, AuthRequest } from '../lib/auth';
import { createId } from '@paralleldrive/cuid2';
import { getActiveUsersInRoom } from '../lib/socket';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/study-rooms
 * Get all study rooms (public and user's private rooms)
 * 
 * @query type - Filter by room type ('public', 'private', 'all')
 * @returns Array of study rooms
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const type = req.query.type as string || 'all';

    let query = supabase
      .from('study_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (type === 'public') {
      query = query.eq('is_public', true);
    } else if (type === 'private') {
      query = query.eq('creator_id', userId).eq('is_public', false);
    } else {
      // All rooms: public rooms OR user's private rooms
      query = query.or(`is_public.eq.true,creator_id.eq.${userId}`);
    }

    const { data: rooms, error } = await query;

    if (error) throw error;

    // Add active user counts from Socket.IO
    const roomsWithActiveUsers = rooms?.map(room => ({
      ...room,
      activeUsers: getActiveUsersInRoom(room.id).length,
    }));

    res.json({ rooms: roomsWithActiveUsers || [] });
  } catch (error) {
    console.error('Error fetching study rooms:', error);
    res.status(500).json({ error: 'Failed to fetch study rooms' });
  }
});

/**
 * GET /api/study-rooms/:id
 * Get a specific study room with details
 * 
 * @param id - Study room ID
 * @returns Study room details with participants
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const { data: room, error } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !room) {
      return res.status(404).json({ error: 'Study room not found' });
    }

    // Check if user has access to private rooms
    if (!room.is_public && room.creator_id !== userId) {
      return res.status(403).json({ error: 'Access denied to private room' });
    }

    // Get active users from Socket.IO
    const activeUserIds = getActiveUsersInRoom(id);

    // Get user details for active users
    let activeUsers = [];
    if (activeUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', activeUserIds);
      
      activeUsers = users || [];
    }

    res.json({
      room: {
        ...room,
        activeUsers,
        activeUserCount: activeUserIds.length,
      },
    });
  } catch (error) {
    console.error('Error fetching study room:', error);
    res.status(500).json({ error: 'Failed to fetch study room' });
  }
});

/**
 * POST /api/study-rooms
 * Create a new study room
 * 
 * @body name - Room name
 * @body description - Room description (optional)
 * @body isPublic - Whether the room is public (default: true)
 * @body maxParticipants - Maximum number of participants (optional)
 * @returns Created study room
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPublic = true, maxParticipants } = req.body;
    const userId = req.user?.userId;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = createId();

    const { data: room, error } = await supabase
      .from('study_rooms')
      .insert({
        id: roomId,
        name,
        description: description || null,
        creator_id: userId,
        is_public: isPublic,
        max_participants: maxParticipants || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ room });
  } catch (error) {
    console.error('Error creating study room:', error);
    res.status(500).json({ error: 'Failed to create study room' });
  }
});

/**
 * PUT /api/study-rooms/:id
 * Update a study room (only by creator)
 * 
 * @param id - Study room ID
 * @body name - New room name (optional)
 * @body description - New description (optional)
 * @body isPublic - New public status (optional)
 * @returns Updated study room
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.user?.userId;

    // Check if user is the creator
    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) {
      return res.status(404).json({ error: 'Study room not found' });
    }

    if (room.creator_id !== userId) {
      return res.status(403).json({ error: 'Only the creator can update this room' });
    }

    // Update room
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.is_public = isPublic;

    const { data: updatedRoom, error: updateError } = await supabase
      .from('study_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error updating study room:', error);
    res.status(500).json({ error: 'Failed to update study room' });
  }
});

/**
 * DELETE /api/study-rooms/:id
 * Delete a study room (only by creator)
 * 
 * @param id - Study room ID
 * @returns Success message
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check if user is the creator
    const { data: room, error: fetchError } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !room) {
      return res.status(404).json({ error: 'Study room not found' });
    }

    if (room.creator_id !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete this room' });
    }

    // Delete room
    const { error: deleteError } = await supabase
      .from('study_rooms')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Study room deleted successfully' });
  } catch (error) {
    console.error('Error deleting study room:', error);
    res.status(500).json({ error: 'Failed to delete study room' });
  }
});

export default router;
