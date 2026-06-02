import { Injectable } from "@nestjs/common"
import {
    ILikeRepository,
    CreateLikeInput,
} from "../../domain/repositories/like.repository.interface"
import { IPostRepository } from "../../../posts/domain/repositories/post.repository.interface"
import { Like } from "../../domain/entities/like.entity"
import { PostNotFoundException } from "../../../shared/exceptions/post-not-found.exception"

@Injectable()
export class AddLikeUseCase {
    constructor(
        private readonly likeRepository: ILikeRepository,
        private readonly postRepository: IPostRepository,
    ) {}

    async execute(input: CreateLikeInput): Promise<Like> {
        const post = await this.postRepository.findById(input.postId)
        if (!post) {
            throw new PostNotFoundException(input.postId)
        }
        const like = await this.likeRepository.create(input)
        return like
    }
}
