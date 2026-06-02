import { Module } from "@nestjs/common"
import { ModerationController } from "@/moderation/moderation.controller"
import { ModerationService } from "@/moderation/moderation.service"
import { ModerateTextUseCase } from "@/moderation/application/use-cases/moderate-text.use-case"

@Module({
    controllers: [ModerationController],
    providers: [ModerationService, ModerateTextUseCase],
    exports: [ModerationService, ModerateTextUseCase],
})
export class ModerationModule {}
