import { Module } from "@nestjs/common"
import { APP_FILTER } from "@nestjs/core"
import { PrismaModule } from "@/shared/prisma.module"
import { PrismaService } from "@/shared/prisma.service"
import { AllExceptionsFilter } from "@/shared/filters/exception.filter"

// Posts
import { PostsController } from "@/posts/presentation/controllers/posts.controller"
import { PostsService } from "@/posts/posts.service"
import { PostRepository } from "@/posts/infrastructure/repositories/post.repository"
import { CreatePostUseCase } from "@/posts/application/use-cases/create-post.use-case"
import { GetFeedPostsUseCase } from "@/posts/application/use-cases/get-feed-posts.use-case"
import { ListPostsUseCase } from "@/posts/application/use-cases/list-posts.use-case"
import { FeedRankingStrategyFactory } from "@/posts/feed-ranking.strategy"

// Comments
import { CommentsController } from "@/comments/presentation/controllers/comments.controller"
import { CommentsService } from "@/comments/comments.service"
import { CreateCommentUseCase } from "@/comments/application/use-cases/create-comment.use-case"
import { ListCommentsByPostIdUseCase } from "@/comments/application/use-cases/list-comments-by-post.use-case"
import { CommentRepository } from "@/comments/infrastructure/repositories/comment.repository"

// Likes
import { LikesController } from "@/likes/presentation/controllers/likes.controller"
import { LikesService } from "@/likes/likes.service"
import { AddLikeUseCase } from "@/likes/application/use-cases/add-like.use-case"
import { LikeRepository } from "@/likes/infrastructure/repositories/like.repository"

// Moderation
import { ModerationController } from "@/moderation/moderation.controller"
import { ModerationService } from "@/moderation/moderation.service"

// Categories
import { CategoriesController } from "@/categories/categories.controller"
import { CategoriesService } from "@/categories/categories.service"

@Module({
    imports: [PrismaModule],
    controllers: [
        PostsController,
        CommentsController,
        LikesController,
        ModerationController,
        CategoriesController,
    ],
    providers: [
        // Global Filter
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },

        // Shared
        PrismaService,

        // Posts
        PostsService,
        FeedRankingStrategyFactory,
        CreatePostUseCase,
        ListPostsUseCase,
        GetFeedPostsUseCase,
        {
            provide: "IPostRepository",
            useClass: PostRepository,
        },

        // Comments
        CommentsService,
        CreateCommentUseCase,
        ListCommentsByPostIdUseCase,
        {
            provide: "ICommentRepository",
            useClass: CommentRepository,
        },

        // Likes
        LikesService,
        AddLikeUseCase,
        {
            provide: "ILikeRepository",
            useClass: LikeRepository,
        },

        // Moderation
        ModerationService,

        // Categories
        CategoriesService,
    ],
})
export class TestModule {}
