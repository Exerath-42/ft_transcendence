import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateChatDto {
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(12)
  @MinLength(3)
  name: string;
  
  @IsString()
  @IsOptional()
  password: string;

  @IsBoolean()
  @IsOptional()
  isPrivate: boolean;
}