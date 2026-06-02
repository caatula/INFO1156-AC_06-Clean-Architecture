import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/shared/prisma.service"
import { Post } from "@/posts/domain/entities/post.entity"
import {
    IPostRepository,
    CreatePostInput,
    PostFilters,
} from "@/posts/domain/repositories/post.repository.interface"

@Injectable()
export class PostRepository implements IPostRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(input: CreatePostInput): Promise<Post> {
        const prismaPost = await this.prisma.post.create({
            data: {
                title: input.title,
                description: input.description,
                imageUrl: input.imageUrl,
                categoryId: input.categoryId,
            },
        })

        return Post.create({
            id: prismaPost.id,
            title: prismaPost.title,
            description: prismaPost.description,
            imageUrl: prismaPost.imageUrl,
            categoryId: prismaPost.categoryId ?? undefined,
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
        })
    }

    async findById(id: string): Promise<Post | null> {
        const prismaPost = await this.prisma.post.findUnique({
            where: { id },
        })

        if (!prismaPost) return null

        return Post.create({
            id: prismaPost.id,
            title: prismaPost.title,
            description: prismaPost.description,
            imageUrl: prismaPost.imageUrl,
            categoryId: prismaPost.categoryId ?? undefined,
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
        })
    }

    async findMany(filters?: PostFilters): Promise<Post[]> {
        const prismaPosts = await this.prisma.post.findMany({
            where: filters?.categoryId
                ? { categoryId: filters.categoryId }
                : undefined,
            orderBy: { createdAt: "desc" },
        })

        return prismaPosts.map((p) =>
            Post.create({
                id: p.id,
                title: p.title,
                description: p.description,
                imageUrl: p.imageUrl,
                categoryId: p.categoryId ?? undefined,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            }),
        )
    }

    async findByCategoryId(categoryId: string): Promise<Post[]> {
        return this.findMany({ categoryId })
    }
}
