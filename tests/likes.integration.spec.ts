import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/shared/prisma.service"
import { TestModule } from "./setup/test.module"
import request from "supertest"

describe("Likes Integration", () => {
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
                title: "Test post for likes",
                description: "This is a test post for likes integration",
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
    //  POST /api/posts/:id/likes - Add Like
    // ------------------------------------------------------------------ //
    describe("POST /api/posts/:id/likes", () => {
        it("should create a like with default values", async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/likes`)
                .send({})
                .expect(201)

            expect(res.body.ok).toBe(true)
            expect(res.body.payload).toMatchObject({
                id: expect.any(String),
                postId,
                reactionType: "like",
                weight: 1,
                source: "likes-module",
            })
            expect(res.body.payload.createdAt).toBeDefined()
        })

        it("should create a like with custom reaction and weight", async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/likes`)
                .send({ reactionType: "fire", weight: 3 })
                .expect(201)

            expect(res.body.payload).toMatchObject({
                reactionType: "fire",
                weight: 3,
            })
        })

        it("should accept reaction types: like, fire, clap", async () => {
            for (const type of ["like", "fire", "clap"]) {
                const res = await request(app.getHttpServer())
                    .post(`/api/posts/${postId}/likes`)
                    .send({ reactionType: type })
                    .expect(201)

                expect(res.body.payload.reactionType).toBe(type)
            }
        })

        it("should reject like for non-existent post", async () => {
            await request(app.getHttpServer())
                .post("/api/posts/nonexistent-id/likes")
                .send({ reactionType: "like", weight: 1 })
                .expect(404)
        })

        it("should reject like with invalid reactionType", async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/likes`)
                .send({ reactionType: "invalid" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/reacción|reaction/i),
                ]),
            )
        })

        it("should allow multiple likes on the same post", async () => {
            const like1 = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/likes`)
                .send({ reactionType: "like" })
                .expect(201)

            const like2 = await request(app.getHttpServer())
                .post(`/api/posts/${postId}/likes`)
                .send({ reactionType: "fire", weight: 2 })
                .expect(201)

            expect(like1.body.payload.id).not.toBe(like2.body.payload.id)
            expect(like1.body.payload.postId).toBe(postId)
            expect(like2.body.payload.postId).toBe(postId)
        })
    })
})
