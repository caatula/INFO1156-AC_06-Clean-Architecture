import { Injectable } from "@nestjs/common"
import {
    ICommentRepository,
    CreateCommentInput,
} from "../../domain/repositories/comment.repository.interface"
import { IPostRepository } from "../../../posts/domain/repositories/post.repository.interface"
import { Comment } from "../../domain/entities/comment.entity"
import { PostNotFoundException } from "../../../shared/exceptions/post-not-found.exception"

@Injectable()
export class CreateCommentUseCase {
    constructor(
        private readonly commentRepository: ICommentRepository,
        private readonly postRepository: IPostRepository,
    ) {}

    async execute(input: CreateCommentInput): Promise<Comment> {
        const post = await this.postRepository.findById(input.postId)
        if (!post) {
            throw new PostNotFoundException(input.postId)
        }
        const comment = await this.commentRepository.create(input)
        return comment
    }
}
