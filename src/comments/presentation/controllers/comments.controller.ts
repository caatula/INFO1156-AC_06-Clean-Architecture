import { Body, Controller, Get, Param, Post } from "@nestjs/common"
import { CreateCommentDto } from "@/posts/posts.dtos"
import { CreateCommentUseCase } from "@/comments/application/use-cases/create-comment.use-case"
import { ListCommentsByPostIdUseCase } from "@/comments/application/use-cases/list-comments-by-post.use-case"
import { CommentMapper } from "@/comments/presentation/mappers/comment.mapper"

@Controller("api/posts/:id/comments")
export class CommentsController {
    constructor(
        private readonly listCommentsByPostIdUseCase: ListCommentsByPostIdUseCase,
        private readonly createCommentUseCase: CreateCommentUseCase,
    ) {}

    @Get()
    async list(@Param("id") postId: string) {
        const { total_comments, comments } =
            await this.listCommentsByPostIdUseCase.execute(postId)

        return {
            total_comments,
            comments: comments.map(CommentMapper.toResponse),
        }
    }

    @Post()
    async create(@Param("id") postId: string, @Body() body: CreateCommentDto) {
        const created = await this.createCommentUseCase.execute({
            postId,
            content: body.content,
            source: "comments-module",
        })

        return {
            ok: true,
            payload: CommentMapper.toResponse(created),
        }
    }
}
