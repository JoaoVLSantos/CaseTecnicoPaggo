import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  
  private revokedTokens = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signUp(email: string, password: string, name: string) {
    const hash = await bcrypt.hash(password, 10);
    try {
      await this.prisma.user.create({
        data: { email, password: hash, name },
      });
      return { message: 'Cadastro realizado com sucesso' };
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw e;
    }
  }
  
  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwt.sign(payload) };
  }

  async signOut(token: string | null) {
    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }
    this.revokedTokens.add(token);
    return { message: 'Logout realizado com sucesso' };
  }

  isTokenRevoked(token: string): boolean {
    return this.revokedTokens.has(token);
  }

  async update(
    id: string,
    email?: string,
    password?: string,
    name?: string,
  ) {
    const data: { email?: string; password?: string; name?: string } = {};
    if (email)  data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (name)   data.name = name;

    try {
      await this.prisma.user.update({ where: { id }, data });
      return { message: 'Usuário atualizado com sucesso' };
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado');
      }
      if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw e;
    }
  }
}
