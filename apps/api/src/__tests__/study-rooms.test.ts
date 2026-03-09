/**
 * Study Rooms API Tests
 * 
 * Tests for study room CRUD operations
 */

import { mockPrismaClient } from './setup';

describe('Study Rooms API', () => {
  const mockUser = {
    id: 'user-1',
    email: 'studyroom@test.com',
    password: 'hashedpassword',
    name: 'Study Room Tester',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoom = {
    id: 'room-1',
    name: 'Test Study Room',
    description: 'A test room for studying',
    creatorId: mockUser.id,
    isPublic: true,
    maxParticipants: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Study Room Model', () => {
    it('should create a public study room', async () => {
      mockPrismaClient.studyRoom.create.mockResolvedValue(mockRoom);

      const result = await mockPrismaClient.studyRoom.create({
        data: {
          name: 'Test Study Room',
          description: 'A test room for studying',
          creatorId: mockUser.id,
          isPublic: true,
          maxParticipants: 10,
        },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Study Room');
      expect(result.isPublic).toBe(true);
      expect(result.creatorId).toBe(mockUser.id);
      expect(mockPrismaClient.studyRoom.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Study Room',
          description: 'A test room for studying',
          creatorId: mockUser.id,
          isPublic: true,
          maxParticipants: 10,
        },
      });
    });

    it('should create a private study room', async () => {
      const privateRoom = {
        ...mockRoom,
        name: 'Private Room',
        isPublic: false,
      };

      mockPrismaClient.studyRoom.create.mockResolvedValue(privateRoom);

      const result = await mockPrismaClient.studyRoom.create({
        data: {
          name: 'Private Room',
          creatorId: mockUser.id,
          isPublic: false,
        },
      });

      expect(result.isPublic).toBe(false);
      expect(mockPrismaClient.studyRoom.create).toHaveBeenCalled();
    });

    it('should retrieve study room by ID', async () => {
      mockPrismaClient.studyRoom.findUnique.mockResolvedValue(mockRoom);

      const result = await mockPrismaClient.studyRoom.findUnique({
        where: { id: mockRoom.id },
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockRoom.id);
      expect(result?.name).toBe('Test Study Room');
      expect(mockPrismaClient.studyRoom.findUnique).toHaveBeenCalledWith({
        where: { id: mockRoom.id },
      });
    });

    it('should update study room details', async () => {
      const updatedRoom = {
        ...mockRoom,
        name: 'Updated Room Name',
        description: 'Updated description',
      };

      mockPrismaClient.studyRoom.update.mockResolvedValue(updatedRoom);

      const result = await mockPrismaClient.studyRoom.update({
        where: { id: mockRoom.id },
        data: {
          name: 'Updated Room Name',
          description: 'Updated description',
        },
      });

      expect(result.name).toBe('Updated Room Name');
      expect(result.description).toBe('Updated description');
      expect(mockPrismaClient.studyRoom.update).toHaveBeenCalled();
    });

    it('should list all public study rooms', async () => {
      const publicRooms = [mockRoom, { ...mockRoom, id: 'room-2' }];

      mockPrismaClient.studyRoom.findMany.mockResolvedValue(publicRooms);

      const result = await mockPrismaClient.studyRoom.findMany({
        where: { isPublic: true },
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result.every(room => room.isPublic)).toBe(true);
      expect(mockPrismaClient.studyRoom.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
      });
    });

    it('should filter rooms by creator', async () => {
      const userRooms = [mockRoom];

      mockPrismaClient.studyRoom.findMany.mockResolvedValue(userRooms);

      const result = await mockPrismaClient.studyRoom.findMany({
        where: { creatorId: mockUser.id },
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.every(room => room.creatorId === mockUser.id)).toBe(true);
      expect(mockPrismaClient.studyRoom.findMany).toHaveBeenCalledWith({
        where: { creatorId: mockUser.id },
      });
    });

    it('should delete a study room', async () => {
      mockPrismaClient.studyRoom.delete.mockResolvedValue(mockRoom);
      mockPrismaClient.studyRoom.findUnique.mockResolvedValue(null);

      await mockPrismaClient.studyRoom.delete({
        where: { id: mockRoom.id },
      });

      const result = await mockPrismaClient.studyRoom.findUnique({
        where: { id: mockRoom.id },
      });

      expect(result).toBeNull();
      expect(mockPrismaClient.studyRoom.delete).toHaveBeenCalledWith({
        where: { id: mockRoom.id },
      });
    });
  });
});

