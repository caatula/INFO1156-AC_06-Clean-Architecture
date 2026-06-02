import { Injectable } from "@nestjs/common"
import { CommentsService } from "@/comments/comments.service"

@Injectable()
export class ListCommentsByPostIdUseCase {
    constructor(private readonly commentsService: CommentsService) {}

    async execute(postId: string) {
        return this.commentsService.listByPostId(postId)
    }
}
