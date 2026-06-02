export class Post {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly description: string,
        public readonly imageUrl: string,
        public readonly categoryId: string | undefined,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    static create(data: {
        id: string
        title: string
        description: string
        imageUrl: string
        categoryId?: string
        createdAt: Date
        updatedAt: Date
    }): Post {
        return new Post(
            data.id,
            data.title,
            data.description,
            data.imageUrl,
            data.categoryId,
            data.createdAt,
            data.updatedAt,
        )
    }
}
