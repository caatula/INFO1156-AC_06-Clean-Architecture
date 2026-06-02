import { Module } from "@nestjs/common"
import { APP_FILTER } from "@nestjs/core"
import { CategoriesModule } from "@/categories/categories.module"
import { CommentsModule } from "@/comments/comments.module"
import { LikesModule } from "@/likes/likes.module"
import { ModerationModule } from "@/moderation/moderation.module"
import { PostsModule } from "@/posts/posts.module"
import { PrismaModule } from "@/shared/prisma.module"
import { AllExceptionsFilter } from "@/shared/filters/exception.filter"

@Module({
    imports: [
        PrismaModule,
        CategoriesModule,
        PostsModule,
        CommentsModule,
        LikesModule,
        ModerationModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
