import { BadRequestException, Injectable } from "@nestjs/common"
import { CreatePostDto } from "@/posts/posts.dtos"
import { ModerationService } from "@/moderation/moderation.service"
import { PrismaService } from "@/shared/prisma.service"

@Injectable()
export class PostsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly moderationService: ModerationService,
    ) {}

    async create(data: CreatePostDto) {
        const text = `${data.title} ${data.description}`
        const moderation = await this.moderationService.moderate(text)

        if (!moderation.approved) {
            throw new BadRequestException(
                moderation.reason ?? "Post bloqueado por moderación",
            )
        }

        return await this.prisma.post.create({
            data: {
                ...data,
            },
        })
    }

    findAll() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
        })
    }

    findById(id: string) {
        return this.prisma.post.findUnique({ where: { id } })
    }

    async getFeedPosts(categoryId?: string) {
        const posts = await this.prisma.post.findMany({
            where: categoryId ? { categoryId } : undefined,
            include: { comments: true, likes: true, category: true },
        })

        return posts.map((post) => ({
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.imageUrl,
            categoryId: post.categoryId,
            category: post.category?.name ?? null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likesCount: post.likes.reduce((sum, l) => sum + l.weight, 0),
            commentsCount: post.comments.length,
            relevanceScore: 0,
        }))
    }
}
