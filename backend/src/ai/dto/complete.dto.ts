import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
