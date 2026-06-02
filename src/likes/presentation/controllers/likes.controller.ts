import { Body, Controller, Param, Post } from "@nestjs/common"
import { AddLikeDto } from "@/posts/posts.dtos"
import { AddLikeUseCase } from "@/likes/application/use-cases/add-like.use-case"
import { LikeMapper } from "@/likes/presentation/mappers/like.mapper"

@Controller("api/posts/:id/likes")
export class LikesController {
    constructor(private readonly addLikeUseCase: AddLikeUseCase) {}

    @Post()
    async create(@Param("id") postId: string, @Body() body: AddLikeDto) {
        const created = await this.addLikeUseCase.execute({
            postId,
            reactionType: body.reactionType ?? "like",
            weight: body.weight ?? 1,
            source: "likes-module",
        })

        return {
            ok: true,
            payload: LikeMapper.toResponse(created),
        }
    }
}
