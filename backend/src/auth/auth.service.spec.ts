import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockCreate = jest.fn();
  const mockFindUnique = jest.fn();
  const mockUpdate = jest.fn();
  const mockSign = jest.fn();
  let hashSpy: jest.SpyInstance;
  let compareSpy: jest.SpyInstance;

  beforeEach(async () => {
    hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation((pwd, salt) => Promise.resolve(`hashed-${pwd}`));
    compareSpy = jest
      .spyOn(bcrypt, 'compare')
      .mockImplementation((pwd, hash) => Promise.resolve(pwd === 'pass123'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: mockCreate,
              findUnique: mockFindUnique,
              update: mockUpdate,
            },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: mockSign },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should hash password and create a user', async () => {
      mockCreate.mockResolvedValue({});
      const dto = { email: 'a@b.com', password: 'pass123', name: 'Name' };
      const result = await service.signUp(dto.email, dto.password, dto.name);

      expect(hashSpy).toHaveBeenCalledWith(dto.password, 10);
      expect(mockCreate).toHaveBeenCalledWith({ data: { email: dto.email, password: expect.any(String), name: dto.name } });
      expect(result).toEqual({ message: 'Cadastro realizado com sucesso' });
    });

    it('should throw ConflictException if email already exists', async () => {
      const error: any = new Error();
      error.code = 'P2002';
      error.meta = { target: ['email'] };
      mockCreate.mockRejectedValue(error);

      await expect(service.signUp('a@b.com', 'pass123', 'Name')).rejects.toThrow(ConflictException);
    });
  });

  describe('signIn', () => {
    it('should return token on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      mockFindUnique.mockResolvedValue({ id: 'id', email: 'a@b.com', password: hashed });
      mockSign.mockReturnValue('jwt-token');

      const result = await service.signIn('a@b.com', 'pass123');

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
      expect(compareSpy).toHaveBeenCalledWith('pass123', hashed);
      expect(mockSign).toHaveBeenCalledWith({ sub: 'id', email: 'a@b.com' });
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('should throw UnauthorizedException on invalid user', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(service.signIn('a@b.com', 'pass123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should add token to revokedTokens', async () => {
      const result = await service.signOut('token123');
      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(service.isTokenRevoked('token123')).toBe(true);
    });

    it('should throw UnauthorizedException if token is null', async () => {
      await expect(service.signOut(null)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('update', () => {
    it('should update user data successfully', async () => {
      mockUpdate.mockResolvedValue({});
      const res = await service.update('id', 'new@e.com', 'newpass', 'NewName');

      expect(hashSpy).toHaveBeenCalledWith('newpass', 10);
      expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'id' }, data: expect.objectContaining({ email: 'new@e.com', name: 'NewName', password: expect.any(String) }) });
      expect(res).toEqual({ message: 'Usuário atualizado com sucesso' });
    });

    it('should throw NotFoundException if user not exists', async () => {
      const error: any = new Error();
      error.code = 'P2025';
      mockUpdate.mockRejectedValue(error);
      await expect(service.update('id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on email collision', async () => {
      const error: any = new Error();
      error.code = 'P2002';
      error.meta = { target: ['email'] };
      mockUpdate.mockRejectedValue(error);
      await expect(service.update('id', 'exists@e.com')).rejects.toThrow(ConflictException);
    });
  });
});

