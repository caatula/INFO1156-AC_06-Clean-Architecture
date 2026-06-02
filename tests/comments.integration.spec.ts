import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/shared/prisma.service"
import { TestModule } from "./setup/test.module"
import request from "supertest"

describe("Comments Integration", () => {
    let app: INestApplication
    let prisma: any
    let postId: string

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        await app.init()

        prisma = app.get(PrismaService)
    })

    beforeEach(async () => {
        // Delete in STRICT SEQUENTIAL order to respect FK constraints
        // Order: comment → like → prohibitedWord → post
        await prisma.comment.deleteMany()
        await prisma.like.deleteMany()
        await prisma.prohibitedWord.deleteMany()
        await prisma.post.deleteMany()

        // Create a post for testing
        const createdPost = await prisma.post.create({
            data: {
                title: "Test post for comments",
                description: "This is a test post for comments integration",
                imageUrl: "https://example.com/test.jpg",
            },
        })
        postId = createdPost.id
    })

    afterEach(async () => {
        // Clean up in STRICT SEQUENTIAL order (same as beforeEach)
        await prisma.comment.deleteMany()
        await prisma.like.deleteMany()
        await prisma.prohibitedWord.deleteMany()
        await prisma.post.deleteMany()
    })

    afterAll(async () => {
        // Disconnect Prisma to release database connections
        await prisma.$disconnect()
        await app.close()
    })

    // ------------------------------------------------------------------ //
    //  POST /api/posts/:id/comments - Create Comment
    // ------------------------------------------------------------------ //
    describe("POST /api/posts/:id/comments", () => {
        it("should create a comment with valid content", async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ content: "This is a valid comment" })
                .expect(201)

            expect(res.body.ok).toBe(true)
            expect(res.body.payload).toMatchObject({
                id: expect.any(String),
                postId,
                content: "This is a valid comment",
                source: "comments-module",
            })
            expect(res.body.payload.createdAt).toBeDefined()
            expect(res.body.payload.updatedAt).toBeDefined()
        })

        it("should reject comment with content too short", async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ content: "X" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/contenido/i)]),
            )
        })

        it("should reject comment for non-existent post", async () => {
            await request(app.getHttpServer())
                .post("/api/posts/nonexistent-id/comments")
                .send({ content: "This is a valid comment" })
                .expect(404)
        })

        it("should reject comment blocked by moderation", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "forbidden", category: "GENERAL" },
            })

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ content: "This contains forbidden content" })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida|bloqueada/i)
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/posts/:id/comments - List Comments
    // ------------------------------------------------------------------ //
    describe("GET /api/posts/:id/comments", () => {
        it("should list all comments for a post", async () => {
            await request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ content: "First comment" })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${postId}/comments`)
                .send({ content: "Second comment" })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get(`/api/posts/${postId}/comments`)
                .expect(200)

            expect(res.body.total_comments).toBe(2)
            expect(res.body.comments).toHaveLength(2)
        })

        it("should return empty list when no comments exist", async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/posts/${postId}/comments`)
                .expect(200)

            expect(res.body.total_comments).toBe(0)
            expect(res.body.comments).toEqual([])
        })

        it("should return 404 for non-existent post", async () => {
            await request(app.getHttpServer())
                .get("/api/posts/nonexistent-id/comments")
                .expect(404)
        })
    })
})
