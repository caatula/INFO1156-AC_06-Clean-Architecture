import { Injectable } from "@nestjs/common"
import {
    IPostRepository,
    CreatePostInput,
} from "../../domain/repositories/post.repository.interface"
import { Post } from "../../domain/entities/post.entity"

@Injectable()
export class CreatePostUseCase {
    constructor(private readonly postRepository: IPostRepository) {}

    async execute(input: CreatePostInput): Promise<Post> {
        const post = await this.postRepository.create(input)
        return post
    }
}
