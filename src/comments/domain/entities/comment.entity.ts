export class Comment {
    constructor(
        public readonly id: string,
        public readonly postId: string,
        public readonly content: string,
        public readonly source: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static create(data: {
        id: string
        postId: string
        content: string
        source: string
        createdAt: Date
        updatedAt: Date
    }): Comment {
        return new Comment(
            data.id,
            data.postId,
            data.content,
            data.source,
            data.createdAt,
            data.updatedAt,
        )
    }
}
