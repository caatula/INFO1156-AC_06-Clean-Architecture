import { Like } from "../entities/like.entity"

export interface CreateLikeInput {
    postId: string
    reactionType: string
    weight: number
    source: string
}

export interface ILikeRepository {
    create(input: CreateLikeInput): Promise<Like>
    findByPostId(postId: string): Promise<Like[]>
    findById(id: string): Promise<Like | null>
}
