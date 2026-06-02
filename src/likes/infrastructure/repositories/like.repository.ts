import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/shared/prisma.service"
import { Like } from "@/likes/domain/entities/like.entity"
import {
    ILikeRepository,
    CreateLikeInput,
} from "@/likes/domain/repositories/like.repository.interface"

@Injectable()
export class LikeRepository implements ILikeRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(input: CreateLikeInput): Promise<Like> {
        const prismaLike = await this.prisma.like.create({
            data: {
                postId: input.postId,
                reactionType: input.reactionType,
                weight: input.weight,
                source: input.source,
            },
        })

        return Like.create({
            id: prismaLike.id,
            postId: prismaLike.postId,
            reactionType: prismaLike.reactionType,
            weight: prismaLike.weight,
            source: prismaLike.source,
            createdAt: prismaLike.createdAt,
        })
    }

    async findByPostId(postId: string): Promise<Like[]> {
        const prismaLikes = await this.prisma.like.findMany({
            where: { postId },
        })

        return prismaLikes.map((l) =>
            Like.create({
                id: l.id,
                postId: l.postId,
                reactionType: l.reactionType,
                weight: l.weight,
                source: l.source,
                createdAt: l.createdAt,
            }),
        )
    }

    async findById(id: string): Promise<Like | null> {
        const prismaLike = await this.prisma.like.findUnique({
            where: { id },
        })

        if (!prismaLike) return null

        return Like.create({
            id: prismaLike.id,
            postId: prismaLike.postId,
            reactionType: prismaLike.reactionType,
            weight: prismaLike.weight,
            source: prismaLike.source,
            createdAt: prismaLike.createdAt,
        })
    }
}
