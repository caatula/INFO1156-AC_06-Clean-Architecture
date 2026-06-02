import { Injectable, Inject, BadRequestException } from "@nestjs/common"
import {
    ICommentRepository,
    CreateCommentInput,
} from "../../domain/repositories/comment.repository.interface"
import { IPostRepository } from "../../../posts/domain/repositories/post.repository.interface"
import { Comment } from "../../domain/entities/comment.entity"
import { PostNotFoundException } from "../../../shared/exceptions/post-not-found.exception"
import { ModerationService } from "../../../moderation/moderation.service"

@Injectable()
export class CreateCommentUseCase {
    constructor(
        @Inject("ICommentRepository")
        private readonly commentRepository: ICommentRepository,
        @Inject("IPostRepository")
        private readonly postRepository: IPostRepository,
        private readonly moderationService: ModerationService,
    ) {}

    async execute(input: CreateCommentInput): Promise<Comment> {
        const post = await this.postRepository.findById(input.postId)
        if (!post) {
            throw new PostNotFoundException(input.postId)
        }

        const moderation = await this.moderationService.moderate(input.content)
        if (!moderation.approved) {
            throw new BadRequestException(
                moderation.reason ?? "Comentario bloqueado por moderación",
            )
        }

        const comment = await this.commentRepository.create(input)
        return comment
    }
}
