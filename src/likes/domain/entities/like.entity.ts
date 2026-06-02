export class Like {
    constructor(
        public readonly id: string,
        public readonly postId: string,
        public readonly reactionType: string,
        public readonly weight: number,
        public readonly source: string,
        public readonly createdAt: Date,
    ) {}

    static create(data: {
        id: string
        postId: string
        reactionType: string
        weight: number
        source: string
        createdAt: Date
    }): Like {
        return new Like(
            data.id,
            data.postId,
            data.reactionType,
            data.weight,
            data.source,
            data.createdAt,
        )
    }
}
