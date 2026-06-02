import { Comment } from "../entities/comment.entity"

export interface CreateCommentInput {
    postId: string
    content: string
    source: string
}

export interface ICommentRepository {
    create(input: CreateCommentInput): Promise<Comment>
    findByPostId(postId: string): Promise<Comment[]>
    findById(id: string): Promise<Comment | null>
}
