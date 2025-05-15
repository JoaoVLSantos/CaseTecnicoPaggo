import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  const mockFindUnique = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: mockFindUnique,
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('findMe', () => {
    it('should return the user when found', async () => {
      const userId = 'user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await service.findMe(userId);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
})