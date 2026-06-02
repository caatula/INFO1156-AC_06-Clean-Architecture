import { Module } from "@nestjs/common"
import { LikesController } from "@/likes/likes.controller"
import { LikesService } from "@/likes/likes.service"
import { PostsModule } from "@/posts/posts.module"
import { LikeRepository } from "@/likes/infrastructure/repositories/like.repository"

@Module({
    imports: [PostsModule],
    controllers: [LikesController],
    providers: [
        LikesService,
        {
            provide: "ILikeRepository",
            useClass: LikeRepository,
        },
    ],
    exports: [LikesService, "ILikeRepository"],
})
export class LikesModule {}
