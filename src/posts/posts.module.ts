import { Module } from "@nestjs/common"
import { FeedRankingStrategyFactory } from "@/posts/feed-ranking.strategy"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsController } from "@/posts/presentation/controllers/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PostRepository } from "@/posts/infrastructure/repositories/post.repository"
import { CreatePostUseCase } from "@/posts/application/use-cases/create-post.use-case"
import { GetFeedPostsUseCase } from "@/posts/application/use-cases/get-feed-posts.use-case"
import { ListPostsUseCase } from "@/posts/application/use-cases/list-posts.use-case"

@Module({
    imports: [ModerationModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        FeedRankingStrategyFactory,
        CreatePostUseCase,
        ListPostsUseCase,
        GetFeedPostsUseCase,
        {
            provide: "IPostRepository",
            useClass: PostRepository,
        },
    ],
    exports: [
        PostsService,
        "IPostRepository",
        CreatePostUseCase,
        ListPostsUseCase,
        GetFeedPostsUseCase,
    ],
})
export class PostsModule {}
