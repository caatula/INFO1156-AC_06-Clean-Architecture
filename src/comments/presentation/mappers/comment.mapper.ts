import { Comment } from "@/comments/domain/entities/comment.entity"

export class CommentMapper {
    static toResponse(comment: Comment | any) {
        return {
            id: comment.id,
            postId: comment.postId,
            content: comment.content,
            source: comment.source,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        }
    }
}
