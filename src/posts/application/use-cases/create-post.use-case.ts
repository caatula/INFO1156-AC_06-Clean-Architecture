import { Injectable, Inject, BadRequestException } from "@nestjs/common"
import {
    IPostRepository,
    CreatePostInput,
} from "../../domain/repositories/post.repository.interface"
import { Post } from "../../domain/entities/post.entity"
import { ModerationService } from "../../../moderation/moderation.service"

@Injectable()
export class CreatePostUseCase {
    constructor(
        @Inject("IPostRepository") private readonly postRepository: IPostRepository,
        private readonly moderationService: ModerationService,
    ) {}

    async execute(input: CreatePostInput): Promise<Post> {
        const text = `${input.title} ${input.description}`
        const moderation = await this.moderationService.moderate(text)

        if (!moderation.approved) {
            throw new BadRequestException(
                moderation.reason ?? "Post bloqueado por moderación",
            )
        }

        const post = await this.postRepository.create(input)
        return post
    }
}
