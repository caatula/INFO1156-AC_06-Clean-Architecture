import { Module } from "@nestjs/common"
import { LikesController } from "@/likes/presentation/controllers/likes.controller"
import { LikesService } from "@/likes/likes.service"
import { PostsModule } from "@/posts/posts.module"
import { LikeRepository } from "@/likes/infrastructure/repositories/like.repository"
import { AddLikeUseCase } from "@/likes/application/use-cases/add-like.use-case"

@Module({
    imports: [PostsModule],
    controllers: [LikesController],
    providers: [
        LikesService,
        AddLikeUseCase,
        {
            provide: "ILikeRepository",
            useClass: LikeRepository,
        },
    ],
    exports: [LikesService, "ILikeRepository", AddLikeUseCase],
})
export class LikesModule {}
