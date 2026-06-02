import { Injectable } from "@nestjs/common"
import { PostsService } from "@/posts/posts.service"

@Injectable()
export class ListPostsUseCase {
    constructor(private readonly postsService: PostsService) {}

    async execute() {
        return this.postsService.findAll()
    }
}
