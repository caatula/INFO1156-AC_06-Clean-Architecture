import { Module } from "@nestjs/common"
import { FeedRankingStrategyFactory } from "@/posts/feed-ranking.strategy"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsController } from "@/posts/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PostRepository } from "@/posts/infrastructure/repositories/post.repository"

@Module({
    imports: [ModerationModule],
    controllers: [PostsController],
    providers: [
        PostsService,
        FeedRankingStrategyFactory,
        {
            provide: "IPostRepository",
            useClass: PostRepository,
        },
    ],
    exports: [PostsService, "IPostRepository"],
})
export class PostsModule {}
