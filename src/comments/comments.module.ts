import { Module } from "@nestjs/common"
import { CommentsController } from "@/comments/presentation/controllers/comments.controller"
import { CommentsService } from "@/comments/comments.service"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsModule } from "@/posts/posts.module"
import { CommentRepository } from "@/comments/infrastructure/repositories/comment.repository"
import { CreateCommentUseCase } from "@/comments/application/use-cases/create-comment.use-case"
import { ListCommentsByPostIdUseCase } from "@/comments/application/use-cases/list-comments-by-post.use-case"

@Module({
    imports: [PostsModule, ModerationModule],
    controllers: [CommentsController],
    providers: [
        CommentsService,
        CreateCommentUseCase,
        ListCommentsByPostIdUseCase,
        {
            provide: "ICommentRepository",
            useClass: CommentRepository,
        },
    ],
    exports: [
        CommentsService,
        "ICommentRepository",
        CreateCommentUseCase,
        ListCommentsByPostIdUseCase,
    ],
})
export class CommentsModule {}
