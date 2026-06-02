import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/shared/prisma.service"
import { TestModule } from "./setup/test.module"
import request from "supertest"

describe("Moderation Integration", () => {
    let app: INestApplication
    let prisma: any

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
    //  POST /api/admin/prohibited-words - Create Prohibited Word
    // ------------------------------------------------------------------ //
    describe("POST /api/admin/prohibited-words", () => {
        it("should create a prohibited word", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "badword", category: "GENERAL" })
                .expect(201)

            expect(res.body).toMatchObject({
                id: expect.any(String),
                word: "badword",
                category: "GENERAL",
            })
            expect(res.body.createdAt).toBeDefined()
        })

        it("should reject prohibited word with empty word", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "", category: "GENERAL" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/palabra|word/i),
                ]),
            )
        })

        it("should reject prohibited word with empty category", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "badword", category: "" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/categoría|category/i),
                ]),
            )
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/admin/prohibited-words - List Prohibited Words
    // ------------------------------------------------------------------ //
    describe("GET /api/admin/prohibited-words", () => {
        it("should list all prohibited words", async () => {
            await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "spam", category: "SPAM" })
                .expect(201)

            await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "hate", category: "HATE" })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body).toHaveLength(2)
        })

        it("should return empty array when no words exist", async () => {
            const res = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body).toEqual([])
        })
    })

    // ------------------------------------------------------------------ //
    //  DELETE /api/admin/prohibited-words/:id - Delete Prohibited Word
    // ------------------------------------------------------------------ //
    describe("DELETE /api/admin/prohibited-words/:id", () => {
        it("should delete a prohibited word", async () => {
            const created = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "temporary", category: "TEST" })
                .expect(201)

            await request(app.getHttpServer())
                .delete(`/api/admin/prohibited-words/${created.body.id}`)
                .expect(200)

            const list = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(list.body).toEqual([])
        })

        it("should return 404 for non-existent word", async () => {
            await request(app.getHttpServer())
                .delete("/api/admin/prohibited-words/nonexistent-id")
                .expect(404)
        })
    })

    // ------------------------------------------------------------------ //
    //  Moderation blocking content
    // ------------------------------------------------------------------ //
    describe("Moderation blocking content", () => {
        it("should block post with prohibited word in title", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "blocked", category: "GENERAL" },
            })

            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "This contains blocked word",
                    description:
                        "A long and descriptive text for the post content",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida|bloqueada/i)
        })

        it("should block post with prohibited word in description", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "forbidden", category: "GENERAL" },
            })

            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Valid title for post",
                    description: "This description contains forbidden content",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida|bloqueada/i)
        })

        it("should allow content when no prohibited words exist", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Clean title",
                    description: "Clean and safe description for the post",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(201)

            expect(res.body.ok).toBe(true)
        })
    })
})
