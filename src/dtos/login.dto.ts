import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDTO {
	@IsString()
	@MaxLength(32)
	@MinLength(1)
	name!: string;

	@IsString()
	@IsOptional()
	avatar?: string;
}
