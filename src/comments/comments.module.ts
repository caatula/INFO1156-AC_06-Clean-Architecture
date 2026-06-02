import { Module } from "@nestjs/common"
import { CommentsController } from "@/comments/comments.controller"
import { CommentsService } from "@/comments/comments.service"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsModule } from "@/posts/posts.module"
import { CommentRepository } from "@/comments/infrastructure/repositories/comment.repository"
import { CreateCommentUseCase } from "@/comments/application/use-cases/create-comment.use-case"

@Module({
    imports: [PostsModule, ModerationModule],
    controllers: [CommentsController],
    providers: [
        CommentsService,
        CreateCommentUseCase,
        {
            provide: "ICommentRepository",
            useClass: CommentRepository,
        },
    ],
    exports: [CommentsService, "ICommentRepository", CreateCommentUseCase],
})
export class CommentsModule {}
