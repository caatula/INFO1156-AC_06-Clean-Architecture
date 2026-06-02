import { DomainException } from "./domain.exception"

export class PostNotFoundException extends DomainException {
    constructor(postId: string) {
        super(`Post with ID "${postId}" not found`)
        this.name = "PostNotFoundException"
    }
}
