import { IsString, IsOptional, IsNumber, Min } from "class-validator"

export class AddLikeDto {
    @IsString()
    @IsOptional()
    reactionType?: string

    @IsNumber()
    @Min(1)
    @IsOptional()
    weight?: number
}
