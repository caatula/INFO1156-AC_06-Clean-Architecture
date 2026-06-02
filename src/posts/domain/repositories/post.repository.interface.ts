import { Post } from "../entities/post.entity"

export interface CreatePostInput {
    title: string
    description: string
    imageUrl: string
    categoryId?: string
}

export interface PostFilters {
    categoryId?: string
}

export interface IPostRepository {
    create(input: CreatePostInput): Promise<Post>
    findById(id: string): Promise<Post | null>
    findMany(filters?: PostFilters): Promise<Post[]>
    findByCategoryId(categoryId: string): Promise<Post[]>
}
