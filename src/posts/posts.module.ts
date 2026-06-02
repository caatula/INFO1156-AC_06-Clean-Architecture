import { Module } from "@nestjs/common"
import { FeedRankingStrategyFactory } from "@/posts/feed-ranking.strategy"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PostRepository } from "@/posts/infrastructure/repositories/post.repository"
import { CreatePostUseCase } from "@/posts/application/use-cases/create-post.use-case"
import { GetFeedPostsUseCase } from "@/posts/application/use-cases/get-feed-posts.use-case"

@Module({
    imports: [ModerationModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        FeedRankingStrategyFactory,
        CreatePostUseCase,
        GetFeedPostsUseCase,
        {
            provide: "IPostRepository",
            useClass: PostRepository,
        },
    ],
    exports: [PostsService, "IPostRepository", CreatePostUseCase, GetFeedPostsUseCase],
})
export class PostsModule {}
