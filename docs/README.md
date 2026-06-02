# Clean Architecture - Documentación de Soluciones

## Persona 1: Repository Pattern Implementation

### Problemas Identificados

#### 1. **Acceso Directo a Prisma en Servicios**
- **Problema**: Los servicios accedían directamente al cliente de Prisma, violando la separación de capas.
- **Impacto**: Acoplamiento alto entre la capa de aplicación y la infraestructura.

#### 2. **Sin Abstracción de Datos**
- **Problema**: No existía una interfaz de repositorio para abstraer el acceso a datos.
- **Impacto**: Imposible cambiar la base de datos sin modificar toda la lógica de negocio.

#### 3. **DTOs Mezclados entre Capas**
- **Problema**: DTOs de entrada/salida estaban juntos, sin separación clara por capa.
- **Impacto**: Confusión entre DTOs de presentación y modelos de dominio.

#### 4. **Violación del Single Responsibility Principle**
- **Problema**: Los servicios hacían tanto acceso a datos como lógica de negocio.
- **Impacto**: Código difícil de testear y mantener.

---

### Soluciones Implementadas

#### 1. **Domain Entities (Capa de Dominio)**

Creación de entidades puras que representan objetos de negocio sin dependencias externas:

```typescript
// src/posts/domain/entities/post.entity.ts
export class Post {
    private constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly description: string,
        public readonly imageUrl: string,
        public readonly categoryId: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static create(data: {
        id: string
        title: string
        description: string
        imageUrl: string
        categoryId: string
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
            data.updatedAt
        )
    }
}
```

**Entidades creadas:**
- `Post` (id, title, description, imageUrl, categoryId, timestamps)
- `Comment` (id, postId, content, source, timestamps)
- `Like` (id, postId, reactionType, weight, source, timestamp)

#### 2. **Repository Interfaces (Contrato)**

Definición de interfaces que actúan como contrato entre capas:

```typescript
// src/posts/domain/repositories/post.repository.interface.ts
export interface IPostRepository {
    create(input: CreatePostInput): Promise<Post>
    findById(id: string): Promise<Post | null>
    findMany(filters?: PostFilters): Promise<Post[]>
    findByCategoryId(categoryId: string): Promise<Post[]>
}
```

**Interfaces creadas:**
- `IPostRepository` - CRUD + búsqueda por categoría
- `ICommentRepository` - CRUD + búsqueda por post
- `ILikeRepository` - CRUD + búsqueda por post + agregación de peso

#### 3. **Repository Implementations (Infraestructura)**

Implementación con Prisma que transforma modelos de BD en entidades de dominio:

```typescript
// src/posts/infrastructure/repositories/post.repository.ts
@Injectable()
export class PostRepository implements IPostRepository {
    constructor(private prisma: PrismaService) {}

    async create(input: CreatePostInput): Promise<Post> {
        const post = await this.prisma.post.create({
            data: input,
        })
        return Post.create(post)
    }

    async findById(id: string): Promise<Post | null> {
        const post = await this.prisma.post.findUnique({
            where: { id },
        })
        return post ? Post.create(post) : null
    }
}
```

**Implementaciones creadas:**
- `PostRepository` - Gestiona posts en Prisma
- `CommentRepository` - Gestiona comentarios con búsqueda por post
- `LikeRepository` - Gestiona likes con agregación de peso

#### 4. **Presentation DTOs (Capa de Presentación)**

Validación de entrada con decoradores de `class-validator`:

```typescript
// src/posts/presentation/dtos/posts.dto.ts
export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsString()
    @IsNotEmpty()
    imageUrl: string

    @IsOptional()
    @IsUUID()
    categoryId?: string
}
```

**DTOs creados:**
- `CreatePostDto` - Validación de creación de posts
- `FeedQueryDto` - Filtros para obtener feed
- `CreateCommentDto` - Validación de comentarios
- `AddLikeDto` - Validación de likes

---

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostsController                                     │   │
│  │  - POST /posts (CreatePostDto validation)           │   │
│  │  - GET /feed (FeedQueryDto validation)              │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │ DTO validation                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
┌─────────────────┼─────────────────────────────────────────────┐
│                 │         APPLICATION LAYER                  │
│  ┌──────────────▼───────────────────────────────────────┐    │
│  │  PostsService                                        │    │
│  │  - Inject repositories                              │    │
│  │  - Call business logic                              │    │
│  └──────────────┬───────────────────────────────────────┘    │
│                 │ calls interface methods                     │
└─────────────────┼────────────────────────────────────────────┘
                  │
┌─────────────────┼────────────────────────────────────────────┐
│                 │    DOMAIN LAYER (Pure Business)            │
│  ┌──────────────▼──────────────┐                            │
│  │  Post Entity                │  (no external deps)        │
│  │  - Immutable properties     │                            │
│  │  - Factory method (create)  │                            │
│  └─────────────────────────────┘                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IPostRepository (Interface)                         │   │
│  │  - create(input): Promise<Post>                      │   │
│  │  - findById(id): Promise<Post | null>                │   │
│  │  - findMany(filters?): Promise<Post[]>               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                  ▲
                  │ implements
┌─────────────────┼────────────────────────────────────────────┐
│                 │      INFRASTRUCTURE LAYER                  │
│  ┌──────────────▼──────────────┐                            │
│  │  PostRepository             │                            │
│  │  (implements IPostRepository)                            │
│  │  - Uses PrismaService                                    │
│  │  - Converts Prisma models to Entities                   │
│  └──────────────┬──────────────┘                            │
│                 │ uses                                       │
│  ┌──────────────▼──────────────┐                            │
│  │  PrismaService              │                            │
│  │  - Database access          │                            │
│  │  - SQLite connection        │                            │
│  └─────────────────────────────┘                            │
└────────────────────────────────────────────────────────────┘
```

---

### Diagrama de Clases

```
┌──────────────────────────────┐
│         Post Entity          │
├──────────────────────────────┤
│ - id: string                 │
│ - title: string              │
│ - description: string        │
│ - imageUrl: string           │
│ - categoryId: string         │
│ - createdAt: Date            │
│ - updatedAt: Date            │
├──────────────────────────────┤
│ + create(data): Post         │
└──────────────────────────────┘
           △
           │ implements
           │
┌──────────────────────────────────┐
│   IPostRepository (Interface)    │
├──────────────────────────────────┤
│ + create(input): Promise<Post>   │
│ + findById(id): Promise<Post?>   │
│ + findMany(filters?): Post[]     │
│ + findByCategoryId(id): Post[]   │
└──────────────────────────────────┘
           △
           │ implements
           │
┌──────────────────────────────────┐
│      PostRepository              │
├──────────────────────────────────┤
│ - prisma: PrismaService          │
├──────────────────────────────────┤
│ + create(input): Promise<Post>   │
│ + findById(id): Promise<Post?>   │
│ + findMany(filters?): Post[]     │
│ + findByCategoryId(id): Post[]   │
└──────────────────────────────────┘
```

---

### Archivos Creados

#### Domain Layer
- `src/posts/domain/entities/post.entity.ts`
- `src/posts/domain/repositories/post.repository.interface.ts`
- `src/comments/domain/entities/comment.entity.ts`
- `src/comments/domain/repositories/comment.repository.interface.ts`
- `src/likes/domain/entities/like.entity.ts`
- `src/likes/domain/repositories/like.repository.interface.ts`

#### Infrastructure Layer
- `src/posts/infrastructure/repositories/post.repository.ts`
- `src/comments/infrastructure/repositories/comment.repository.ts`
- `src/likes/infrastructure/repositories/like.repository.ts`

#### Presentation Layer
- `src/posts/presentation/dtos/posts.dto.ts`
- `src/comments/presentation/dtos/comments.dto.ts`
- `src/likes/presentation/dtos/likes.dto.ts`

#### Module Updates
- `src/posts/posts.module.ts` - Registra PostRepository con token "IPostRepository"
- `src/comments/comments.module.ts` - Registra CommentRepository con token "ICommentRepository"
- `src/likes/likes.module.ts` - Registra LikeRepository con token "ILikeRepository"

---

### Beneficios Alcanzados

✅ **Separación de Capas**: Cada capa tiene responsabilidades claras
✅ **Testabilidad**: Interfaces permiten mockear repositorios
✅ **Flexibilidad**: Cambiar BD sin afectar lógica de negocio
✅ **DTOs Organizados**: Separados por capa (presentación vs dominio)
✅ **Type Safety**: Entidades puras garantizan tipos correctos


