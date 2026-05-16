import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  twitterHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  instagramHandle?: string;
}
