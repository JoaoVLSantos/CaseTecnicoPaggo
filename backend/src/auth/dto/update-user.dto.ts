import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Deve ser um e-mail válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;
}