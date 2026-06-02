import { IsString, IsOptional, IsNotEmpty } from "class-validator"

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title!: string

    @IsString()
    @IsNotEmpty()
    description!: string

    @IsString()
    @IsNotEmpty()
    imageUrl!: string

    @IsString()
    @IsOptional()
    categoryId?: string
}

export class FeedQueryDto {
    @IsString()
    @IsOptional()
    mode?: string

    @IsString()
    @IsOptional()
    categoryId?: string
}
