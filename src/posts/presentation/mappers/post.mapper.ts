import { FeedPost } from "@/posts/feed-ranking.strategy"
import { Post } from "@/posts/domain/entities/post.entity"

export type PostResponseDto = {
    id: string
    title: string
    description: string
    imageUrl: string
    categoryId: string | null
    createdAt: Date
    updatedAt: Date
}

export type FeedPostResponseDto = FeedPost & {
    id: string
    title: string
    description: string
    imageUrl: string
    categoryId: string | null
    createdAt: Date
    updatedAt: Date
}

export class PostMapper {
    static toResponse(post: Post | any): PostResponseDto {
        return {
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.imageUrl,
            categoryId: post.categoryId ?? null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        }
    }

    static toFeedResponse(post: FeedPost & any): FeedPostResponseDto {
        return {
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.imageUrl,
            categoryId: post.categoryId ?? null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            relevanceScore: post.relevanceScore,
        }
    }
}
