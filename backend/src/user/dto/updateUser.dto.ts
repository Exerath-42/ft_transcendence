import { IsOptional, IsString, MaxLength, MinLength  } from 'class-validator';

export class UpdateUserDto {
  
  @MaxLength(40)
  @MinLength(3)
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}