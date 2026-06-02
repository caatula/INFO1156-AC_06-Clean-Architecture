import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/shared/prisma.service"
import { Comment } from "@/comments/domain/entities/comment.entity"
import {
    ICommentRepository,
    CreateCommentInput,
} from "@/comments/domain/repositories/comment.repository.interface"

@Injectable()
export class CommentRepository implements ICommentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(input: CreateCommentInput): Promise<Comment> {
        const prismaComment = await this.prisma.comment.create({
            data: {
                postId: input.postId,
                content: input.content,
                source: input.source,
            },
        })

        return Comment.create({
            id: prismaComment.id,
            postId: prismaComment.postId,
            content: prismaComment.content,
            source: prismaComment.source,
            createdAt: prismaComment.createdAt,
            updatedAt: prismaComment.updatedAt,
        })
    }

    async findByPostId(postId: string): Promise<Comment[]> {
        const prismaComments = await this.prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        })

        return prismaComments.map((c) =>
            Comment.create({
                id: c.id,
                postId: c.postId,
                content: c.content,
                source: c.source,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            }),
        )
    }

    async findById(id: string): Promise<Comment | null> {
        const prismaComment = await this.prisma.comment.findUnique({
            where: { id },
        })

        if (!prismaComment) return null

        return Comment.create({
            id: prismaComment.id,
            postId: prismaComment.postId,
            content: prismaComment.content,
            source: prismaComment.source,
            createdAt: prismaComment.createdAt,
            updatedAt: prismaComment.updatedAt,
        })
    }
}
