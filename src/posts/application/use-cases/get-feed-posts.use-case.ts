import { Injectable } from "@nestjs/common"
import { PostsService } from "@/posts/posts.service"
import { FeedPost } from "@/posts/feed-ranking.strategy"

@Injectable()
export class GetFeedPostsUseCase {
    constructor(private readonly postsService: PostsService) {}

    async execute(categoryId?: string): Promise<FeedPost[]> {
        return this.postsService.getFeedPosts(categoryId)
    }
}
