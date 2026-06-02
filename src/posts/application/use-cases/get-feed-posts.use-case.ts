import { Injectable } from "@nestjs/common"
import {
    IPostRepository,
    PostFilters,
} from "../../domain/repositories/post.repository.interface"
import { Post } from "../../domain/entities/post.entity"

@Injectable()
export class GetFeedPostsUseCase {
    constructor(private readonly postRepository: IPostRepository) {}

    async execute(filters?: PostFilters): Promise<Post[]> {
        const posts = await this.postRepository.findMany(filters)
        return posts
    }
}
