import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common"
import { CreateProhibitedWordDto } from "@/moderation/moderation.dtos"
import { ModerationService } from "@/moderation/moderation.service"

@Controller("api/admin/prohibited-words")
export class ModerationController {
    constructor(private readonly moderationService: ModerationService) {}

    @Get()
    findAll() {
        return this.moderationService.findAll()
    }

    @Post()
    async create(@Body() body: CreateProhibitedWordDto) {
        const created = await this.moderationService.create(
            body.word,
            body.category,
        )
        return created
    }

    @Delete(":id")
    delete(@Param("id") id: string) {
        return this.moderationService.delete(id)
    }
}
