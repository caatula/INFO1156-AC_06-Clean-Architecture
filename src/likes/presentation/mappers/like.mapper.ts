import { Like } from "@/likes/domain/entities/like.entity"

export class LikeMapper {
    static toResponse(like: Like | any) {
        return {
            id: like.id,
            postId: like.postId,
            reactionType: like.reactionType,
            weight: like.weight,
            source: like.source,
            createdAt: like.createdAt,
        }
    }
}
