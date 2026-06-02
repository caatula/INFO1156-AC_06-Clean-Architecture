import { INestApplication, ValidationPipe } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import { PrismaService } from "@/shared/prisma.service"
import { TestModule } from "./setup/test.module"
import request from "supertest"

describe("API Integration", () => {
    let app: INestApplication
    let prisma: PrismaService
    let categoryId: string

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

        const cat = await prisma.category.upsert({
            where: { slug: "technology" },
            update: { name: "Tecnología" },
            create: { name: "Tecnología", slug: "technology" },
        })
        categoryId = cat.id
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
    //  POST /api/posts
    // ------------------------------------------------------------------ //
    describe("POST /api/posts", () => {
        it("creates a post with all fields", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Titulo valido para test",
                    description:
                        "Descripcion suficientemente larga para crear un post.",
                    imageUrl: "https://example.com/post.jpg",
                    categoryId,
                })
                .expect(201)

            expect(res.body.ok).toBe(true)
            expect(res.body.payload).toMatchObject({
                id: expect.any(String),
                title: "Titulo valido para test",
                description:
                    "Descripcion suficientemente larga para crear un post.",
                imageUrl: "https://example.com/post.jpg",
                categoryId,
            })
        })

        it("creates a post without categoryId", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post sin categoria",
                    description:
                        "Descripcion valida y larga para el post sin categoria.",
                    imageUrl: "https://example.com/no-cat.jpg",
                })
                .expect(201)

            expect(res.body.ok).toBe(true)
            expect(res.body.payload.categoryId).toBeNull()
        })

        it("rejects post with too-short title", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "AB",
                    description: "Descripcion valida y suficientemente larga.",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/título/i)]),
            )
        })

        it("rejects post with too-short description", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Titulo valido",
                    description: "Corta",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/descripción/i)]),
            )
        })

        it("rejects post with invalid imageUrl", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Titulo valido",
                    description:
                        "Descripcion suficientemente larga para el test.",
                    imageUrl: "not-a-url",
                })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/imagen/i)]),
            )
        })

        it("rejects post with HTML tags in title", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "<script>alert(1)</script>",
                    description:
                        "Descripcion suficientemente larga para el test.",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/HTML/i)]),
            )
        })

        it("rejects post blocked by moderation", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "spam", category: "SPAM" },
            })

            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Esto es spam en el title",
                    description: "Descripcion valida y suficientemente larga.",
                    imageUrl: "https://example.com/spam.jpg",
                })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida/i)
        })

        it("rejects post with blocked description", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "prohibido", category: "GENERAL" },
            })

            const res = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Titulo normal",
                    description:
                        "Este texto contiene prohibido en la descripcion.",
                    imageUrl: "https://example.com/post.jpg",
                })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida/i)
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/posts
    // ------------------------------------------------------------------ //
    describe("GET /api/posts", () => {
        it("lists all posts", async () => {
            await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Primer post",
                    description: "Descripcion del primer post para la lista.",
                    imageUrl: "https://example.com/1.jpg",
                })
                .expect(201)

            await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Segundo post",
                    description: "Descripcion del segundo post para la lista.",
                    imageUrl: "https://example.com/2.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get("/api/posts")
                .expect(200)

            expect(res.body.total).toBe(2)
            expect(res.body.items).toHaveLength(2)
        })

        it("returns empty list when no posts exist", async () => {
            const res = await request(app.getHttpServer())
                .get("/api/posts")
                .expect(200)

            expect(res.body.total).toBe(0)
            expect(res.body.items).toEqual([])
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/posts/feed
    // ------------------------------------------------------------------ //
    describe("GET /api/posts/feed", () => {
        it("returns feed with default mode", async () => {
            await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post para feed",
                    description:
                        "Descripcion suficientemente larga para el feed.",
                    imageUrl: "https://example.com/feed.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get("/api/posts/feed")
                .expect(200)

            expect(res.body.mode).toBe("latest")
            expect(res.body.rows).toHaveLength(1)
        })

        it("orders feed by mostLiked", async () => {
            const a = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post con mas likes",
                    description: "Este post recibira mas likes para el test.",
                    imageUrl: "https://example.com/a.jpg",
                })
                .expect(201)

            const b = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post con pocos likes",
                    description: "Este post recibira menos likes para el test.",
                    imageUrl: "https://example.com/b.jpg",
                })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${a.body.payload.id}/likes`)
                .send({ reactionType: "like", weight: 2 })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${a.body.payload.id}/likes`)
                .send({ reactionType: "clap", weight: 1 })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${b.body.payload.id}/likes`)
                .send({ reactionType: "like", weight: 1 })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get("/api/posts/feed?mode=mostLiked")
                .expect(200)

            expect(res.body.rows[0].id).toBe(a.body.payload.id)
            expect(res.body.rows[0].likesCount).toBe(3)
            expect(res.body.rows[1].id).toBe(b.body.id)
        })

        it("filters feed by categoryId", async () => {
            const cat = await prisma.category.findFirstOrThrow({
                where: { slug: "technology" },
            })

            await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post con categoria",
                    description:
                        "Descripcion para el post con categoria asignada.",
                    imageUrl: "https://example.com/cat.jpg",
                    categoryId: cat.id,
                })
                .expect(201)

            await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post sin categoria",
                    description:
                        "Descripcion para el post sin categoria alguna.",
                    imageUrl: "https://example.com/no-cat.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get(`/api/posts/feed?mode=latest&categoryId=${cat.id}`)
                .expect(200)

            expect(res.body.rows).toHaveLength(1)
            expect(res.body.rows[0].title).toBe("Post con categoria")
        })

        it("rejects invalid mode", async () => {
            const res = await request(app.getHttpServer())
                .get("/api/posts/feed?mode=invalid")
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/modo/i)]),
            )
        })
    })

    // ------------------------------------------------------------------ //
    //  POST /api/posts/:id/comments
    // ------------------------------------------------------------------ //
    describe("POST /api/posts/:id/comments", () => {
        it("creates a comment", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post para comentar",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/comment.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/comments`)
                .send({ content: "Comentario valido y normal" })
                .expect(201)

            expect(res.body.payload).toMatchObject({
                id: expect.any(String),
                postId: post.body.payload.id,
                content: "Comentario valido y normal",
            })
        })

        it("rejects comment with too-short content", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post para test",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/test.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/comments`)
                .send({ content: "X" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/contenido/i)]),
            )
        })

        it("rejects comment for non-existent post", async () => {
            await request(app.getHttpServer())
                .post("/api/posts/00000000-0000-0000-0000-000000000000/comments")
                .send({ content: "Comentario valido" })
                .expect(404)
        })

        it("rejects comment blocked by moderation", async () => {
            await prisma.prohibitedWord.create({
                data: { word: "malo", category: "GENERAL" },
            })

            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post para moderacion",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/mod.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/comments`)
                .send({ content: "Esto es malo y ofensivo" })
                .expect(400)

            expect(res.body.message).toMatch(/prohibida/i)
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/posts/:id/comments
    // ------------------------------------------------------------------ //
    describe("GET /api/posts/:id/comments", () => {
        it("lists comments for a post", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post con comentarios",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/comments.jpg",
                })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/comments`)
                .send({ content: "Primer comentario" })
                .expect(201)

            await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/comments`)
                .send({ content: "Segundo comentario" })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get(`/api/posts/${post.body.payload.id}/comments`)
                .expect(200)

            expect(res.body.total_comments).toBe(2)
            expect(res.body.comments).toHaveLength(2)
        })

        it("returns 404 for non-existent post", async () => {
            await request(app.getHttpServer())
                .get("/api/posts/00000000-0000-0000-0000-000000000000/comments")
                .expect(404)
        })
    })

    // ------------------------------------------------------------------ //
    //  POST /api/posts/:id/likes
    // ------------------------------------------------------------------ //
    describe("POST /api/posts/:id/likes", () => {
        it("creates a like with default values", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post para likes",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/likes.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/likes`)
                .send({})
                .expect(201)

            expect(res.body.payload).toMatchObject({
                id: expect.any(String),
                postId: post.body.payload.id,
                reactionType: "like",
                weight: 1,
                source: "likes-module",
            })
        })

        it("creates a like with custom reaction and weight", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post con reaccion",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/reaction.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/likes`)
                .send({ reactionType: "fire", weight: 3 })
                .expect(201)

            expect(res.body.payload.reactionType).toBe("fire")
            expect(res.body.payload.weight).toBe(3)
        })

        it("rejects like for non-existent post", async () => {
            await request(app.getHttpServer())
                .post("/api/posts/00000000-0000-0000-0000-000000000000/likes")
                .send({ reactionType: "like", weight: 1 })
                .expect(404)
        })

        it("rejects like with invalid reactionType", async () => {
            const post = await request(app.getHttpServer())
                .post("/api/posts")
                .send({
                    title: "Post invalido",
                    description: "Descripcion suficientemente larga del post.",
                    imageUrl: "https://example.com/invalid.jpg",
                })
                .expect(201)

            const res = await request(app.getHttpServer())
                .post(`/api/posts/${post.body.payload.id}/likes`)
                .send({ reactionType: "invalid" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/reacción/i)]),
            )
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/categories
    // ------------------------------------------------------------------ //
    describe("GET /api/categories", () => {
        it("lists all categories", async () => {
            const res = await request(app.getHttpServer())
                .get("/api/categories")
                .expect(200)

            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body.length).toBeGreaterThanOrEqual(1)

            const tech = res.body.find(
                (c: { slug: string }) => c.slug === "technology",
            )
            expect(tech).toBeDefined()
            expect(tech.name).toBe("Tecnología")
        })
    })

    // ------------------------------------------------------------------ //
    //  POST /api/admin/prohibited-words
    // ------------------------------------------------------------------ //
    describe("POST /api/admin/prohibited-words", () => {
        it("creates a prohibited word", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "spam", category: "SPAM" })
                .expect(201)

            expect(res.body).toMatchObject({
                id: expect.any(String),
                word: "spam",
                category: "SPAM",
            })
        })

        it("rejects prohibited word with empty word", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "", category: "SPAM" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/palabra/i)]),
            )
        })

        it("rejects prohibited word with empty category", async () => {
            const res = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "badword", category: "" })
                .expect(400)

            expect(res.body.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/categoría/i)]),
            )
        })
    })

    // ------------------------------------------------------------------ //
    //  GET /api/admin/prohibited-words
    // ------------------------------------------------------------------ //
    describe("GET /api/admin/prohibited-words", () => {
        it("lists prohibited words", async () => {
            await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "spam", category: "SPAM" })
                .expect(201)

            await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "malo", category: "GENERAL" })
                .expect(201)

            const res = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body).toHaveLength(2)
        })

        it("returns empty array when no words exist", async () => {
            const res = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(res.body).toEqual([])
        })
    })

    // ------------------------------------------------------------------ //
    //  DELETE /api/admin/prohibited-words/:id
    // ------------------------------------------------------------------ //
    describe("DELETE /api/admin/prohibited-words/:id", () => {
        it("deletes a prohibited word", async () => {
            const created = await request(app.getHttpServer())
                .post("/api/admin/prohibited-words")
                .send({ word: "temporal", category: "TEST" })
                .expect(201)

            await request(app.getHttpServer())
                .delete(`/api/admin/prohibited-words/${created.body.id}`)
                .expect(200)

            const list = await request(app.getHttpServer())
                .get("/api/admin/prohibited-words")
                .expect(200)

            expect(list.body).toEqual([])
        })

        it("returns 404 for non-existent word", async () => {
            await request(app.getHttpServer())
                .delete("/api/admin/prohibited-words/00000000-0000-0000-0000-000000000000")
                .expect(404)
        })
    })
})
