import { Injectable } from "@nestjs/common"

export interface ModerateTextInput {
    text: string
}

export interface ModerateTextOutput {
    isModerated: boolean
    flaggedWords: string[]
    reason?: string
}

@Injectable()
export class ModerateTextUseCase {
    constructor() {}

    async execute(input: ModerateTextInput): Promise<ModerateTextOutput> {
        const prohibitedWords = ["spam", "abuse", "hate"]
        const text = input.text.toLowerCase()
        const flaggedWords = prohibitedWords.filter((word) =>
            text.includes(word),
        )
        const isModerated = flaggedWords.length > 0

        return {
            isModerated,
            flaggedWords,
            reason: isModerated
                ? "Contenido contiene palabras prohibidas"
                : undefined,
        }
    }
}
