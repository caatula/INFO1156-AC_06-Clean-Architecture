import { NotFoundException } from "@nestjs/common"

export class PostNotFoundException extends NotFoundException {
    constructor(postId: string) {
        super(`Post with ID "${postId}" not found`)
        this.name = "PostNotFoundException"
    }
}
