import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockSignUp = jest.fn();
  const mockSignIn = jest.fn();
  const mockUpdate = jest.fn();
  const mockSignOut = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: mockSignUp,
            signIn: mockSignIn,
            update: mockUpdate,
            signOut: mockSignOut,
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('calls authService.signUp with correct parameters', async () => {
      const dto: SignUpDto = { email: 'test@gmail.com', password: 'secret123', name: 'Teste' };
      const result = { message: 'Cadastro realizado com sucesso' };
      mockSignUp.mockResolvedValue(result);

      expect(await controller.signUp(dto)).toEqual(result);
      expect(mockSignUp).toHaveBeenCalledWith(dto.email, dto.password, dto.name);
    });
  });

  describe('signIn', () => {
    it('calls authService.signIn with correct parameters', async () => {
      const dto: SignInDto = { email: 'test@gmail.com', password: 'secret123' };
      const result = { access_token: 'token' };
      mockSignIn.mockResolvedValue(result);

      expect(await controller.signIn(dto)).toEqual(result);
      expect(mockSignIn).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });

  describe('update', () => {
    it('calls authService.update with userId from req and dto fields', async () => {
      const dto: UpdateUserDto = { email: 'c@d.com', password: 'newpass', name: 'NewName' };
      const req: any = { user: { userId: 'user-id' } };
      const result = { message: 'Usuário atualizado com sucesso' };
      mockUpdate.mockResolvedValue(result);

      expect(await controller.update(req, dto)).toEqual(result);
      expect(mockUpdate).toHaveBeenCalledWith(
        'user-id',
        dto.email,
        dto.password,
        dto.name,
      );
    });
  });

  describe('signOut', () => {
    it('calls authService.signOut with token extracted from header', async () => {
      const token = 'my-token';
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const result = { message: 'Logout realizado com sucesso' };
      mockSignOut.mockResolvedValue(result);

      expect(await controller.signOut(req)).toEqual(result);
      expect(mockSignOut).toHaveBeenCalledWith(token);
    });

    it('passes null if authorization header missing or malformed', async () => {
      const req1: any = { headers: {} };
      const req2: any = { headers: { authorization: 'token' } };
      const result = { message: 'Logout realizado com sucesso' };
      mockSignOut.mockResolvedValue(result);

      expect(await controller.signOut(req1)).toEqual(result);
      expect(mockSignOut).toHaveBeenCalledWith(null);

      expect(await controller.signOut(req2)).toEqual(result);
      expect(mockSignOut).toHaveBeenCalledWith(null);
    });
  });
});

