import { Module } from "@nestjs/common"
import { CommentsController } from "@/comments/comments.controller"
import { CommentsService } from "@/comments/comments.service"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsModule } from "@/posts/posts.module"
import { CommentRepository } from "@/comments/infrastructure/repositories/comment.repository"

@Module({
    imports: [PostsModule, ModerationModule],
    controllers: [CommentsController],
    providers: [
        CommentsService,
        {
            provide: "ICommentRepository",
            useClass: CommentRepository,
        },
    ],
    exports: [CommentsService, "ICommentRepository"],
})
export class CommentsModule {}
