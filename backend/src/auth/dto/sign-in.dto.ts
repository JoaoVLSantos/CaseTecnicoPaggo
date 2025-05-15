import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres' })
  password: string;
}