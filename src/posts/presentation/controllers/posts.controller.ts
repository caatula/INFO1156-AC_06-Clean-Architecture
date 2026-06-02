import { Body, Controller, Get, Post, Query } from "@nestjs/common"

import { CreatePostDto, FeedQueryDto } from "@/posts/posts.dtos"
import { CreatePostUseCase } from "@/posts/application/use-cases/create-post.use-case"
import { GetFeedPostsUseCase } from "@/posts/application/use-cases/get-feed-posts.use-case"
import { ListPostsUseCase } from "@/posts/application/use-cases/list-posts.use-case"
import { FeedRankingStrategyFactory } from "@/posts/feed-ranking.strategy"
import { PostMapper } from "@/posts/presentation/mappers/post.mapper"

@Controller("api/posts")
export class PostsController {
    constructor(
        private readonly createPostUseCase: CreatePostUseCase,
        private readonly listPostsUseCase: ListPostsUseCase,
        private readonly getFeedPostsUseCase: GetFeedPostsUseCase,
        private readonly feedRankingFactory: FeedRankingStrategyFactory,
    ) {}

    @Post()
    async create(@Body() body: CreatePostDto) {
        const created = await this.createPostUseCase.execute(body)
        const response = PostMapper.toResponse(created)

        return {
            ok: true,
            payload: response,
            ...response,
        }
    }

    @Get()
    async findAll() {
        const posts = await this.listPostsUseCase.execute()

        return {
            total: posts.length,
            items: posts.map(PostMapper.toResponse),
        }
    }

    @Get("feed")
    async getFeed(@Query() query: FeedQueryDto) {
        const mode = query.mode ?? "latest"
        const feedPosts = await this.getFeedPostsUseCase.execute(
            query.categoryId,
        )
        const rankedPosts = this.feedRankingFactory
            .forMode(mode)
            .rank(feedPosts)

        return {
            mode,
            count: rankedPosts.length,
            rows: rankedPosts.map(PostMapper.toFeedResponse),
        }
    }
}
