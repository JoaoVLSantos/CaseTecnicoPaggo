import { Controller, Post, Put, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.email, dto.password, dto.name);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  update(
    @Req() req: any,
    @Body() dto: UpdateUserDto,
  ) {
    const userId: string = req.user.userId;
    return this.authService.update(
      userId,
      dto.email,
      dto.password,
      dto.name,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  signOut(@Req() req: any) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
    return this.authService.signOut(token);
  }
}
