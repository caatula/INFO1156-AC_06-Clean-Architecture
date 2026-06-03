## Ejecución de tests

Para poder ejecutar los tests de integración correctamente,  usar los siguientes pasos:
1. `pnpm install`
2. `pnpm prisma generate`
3. `pnpm prisma migrate deploy`
4. `pnpm test`


# Clean Architecture - Documentación de Soluciones

## CATALINA: Repository Pattern Implementation

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

---

## MATHIAS: Use Cases Layer Implementation

### Problemas Identificados

#### 1. **Sin Capa de Casos de Uso**
- **Problema**: La lógica de negocio estaba dispersa en servicios sin estructura clara de casos de uso.
- **Impacto**: Difícil de entender qué acciones puede realizar el sistema.

#### 2. **Servicios con Múltiples Responsabilidades**
- **Problema**: Los servicios mezclaban lógica de negocio con orquestación de dependencias.
- **Impacto**: Difícil de testear y mantener, violando Single Responsibility Principle.

#### 3. **Sin Manejo Centralizado de Excepciones de Negocio**
- **Problema**: No existía una forma consistente de manejar errores del dominio.
- **Impacto**: Excepciones genéricas sin semántica clara de negocio.

#### 4. **Inyección de Servicios en lugar de Repositorios**
- **Problema**: Los casos de uso deberían inyectar repositorios, no otros servicios.
- **Impacto**: Acoplamiento innecesario entre capas de aplicación.

---

### Soluciones Implementadas

#### 1. **Domain Exceptions (Excepciones de Negocio)**

Excepciones base que representan errores del dominio:

```typescript
// src/shared/exceptions/domain.exception.ts
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

// src/shared/exceptions/post-not-found.exception.ts
export class PostNotFoundException extends DomainException {
  constructor(postId: string) {
    super(`Post with ID "${postId}" not found`);
    this.name = 'PostNotFoundException';
  }
}
```

**Excepciones creadas:**
- `DomainException` - Base para todas las excepciones del dominio
- `PostNotFoundException` - Lanzada cuando no se encuentra un post

#### 2. **Use Cases (Application Layer)**

Implementación de casos de uso con patrón `execute()`:

```typescript
// src/posts/application/use-cases/create-post.use-case.ts
@Injectable()
export class CreatePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<Post> {
    const post = await this.postRepository.create(input);
    return post;
  }
}

// src/comments/application/use-cases/create-comment.use-case.ts
@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId);
    if (!post) {
      throw new PostNotFoundException(input.postId);
    }
    const comment = await this.commentRepository.create(input);
    return comment;
  }
}
```

**Use Cases creados:**
- `CreatePostUseCase` - Crear nuevo post
- `GetFeedPostsUseCase` - Obtener feed de posts
- `CreateCommentUseCase` - Crear comentario (valida que post existe)
- `AddLikeUseCase` - Agregar like/reacción (valida que post existe)
- `ModerateTextUseCase` - Moderar contenido de texto

#### 3. **Module Integration**

Registro de use cases en los módulos para inyección de dependencias:

```typescript
// src/posts/posts.module.ts
@Module({
  imports: [ModerationModule],
  controllers: [PostsController],
  providers: [
    PostsService,
    FeedRankingStrategyFactory,
    CreatePostUseCase,
    GetFeedPostsUseCase,
    {
      provide: "IPostRepository",
      useClass: PostRepository,
    },
  ],
  exports: [PostsService, "IPostRepository", CreatePostUseCase, GetFeedPostsUseCase],
})
export class PostsModule {}
```

---

### Diagrama de Arquitectura con Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PostsController                                       │  │
│  │  - POST /posts → dispatch to use case                  │  │
│  │  - GET /feed → dispatch to use case                    │  │
│  └────────────────┬─────────────────────────────────────┘   │
└──────────────────┼─────────────────────────────────────────────┘
                   │ invoke execute()
┌──────────────────┼─────────────────────────────────────────────┐
│                  │      APPLICATION LAYER (Use Cases)         │
│  ┌───────────────▼──────────────────────────────────────┐    │
│  │  CreatePostUseCase.execute(input)                    │    │
│  │  - Receives CreatePostInput                          │    │
│  │  - Calls postRepository.create(input)                │    │
│  │  - Returns Post entity                               │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │ calls                                    │
│  ┌───────────────▼──────────────────────────────────────┐    │
│  │  CreateCommentUseCase.execute(input)                │    │
│  │  - Validates post exists                            │    │
│  │  - Throws PostNotFoundException if not found         │    │
│  │  - Calls commentRepository.create(input)            │    │
│  │  - Returns Comment entity                           │    │
│  └────────────────┬───────────────────────────────────┘    │
└──────────────────┼────────────────────────────────────────────┘
                   │
┌──────────────────┼────────────────────────────────────────────┐
│                  │       DOMAIN LAYER (Entities & Interfaces) │
│  ┌───────────────▼──────────────────────────────────────┐    │
│  │  Post Entity                                         │    │
│  │  Comment Entity                                      │    │
│  │  Like Entity                                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  IPostRepository (Interface)                       │    │
│  │  ICommentRepository (Interface)                    │    │
│  │  ILikeRepository (Interface)                       │    │
│  │  DomainException (Base Exception)                  │    │
│  │  PostNotFoundException                             │    │
│  └────────────────────────────────────────────────────┘    │
└───────────────┬─────────────────────────────────────────────┘
                │ implements
┌───────────────┼─────────────────────────────────────────────┐
│               │   INFRASTRUCTURE LAYER                      │
│  ┌────────────▼──────────────────────────────────────┐    │
│  │  PostRepository                                    │    │
│  │  CommentRepository                                 │    │
│  │  LikeRepository                                    │    │
│  │  (uses PrismaService)                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

### Archivos Creados (MATHIAS)

#### Application Layer (Use Cases)
- `src/posts/application/use-cases/create-post.use-case.ts`
- `src/posts/application/use-cases/get-feed-posts.use-case.ts`
- `src/comments/application/use-cases/create-comment.use-case.ts`
- `src/likes/application/use-cases/add-like.use-case.ts`
- `src/moderation/application/use-cases/moderate-text.use-case.ts`

#### Shared Exceptions
- `src/shared/exceptions/domain.exception.ts`
- `src/shared/exceptions/post-not-found.exception.ts`

#### Module Updates
- `src/posts/posts.module.ts` - Exports CreatePostUseCase, GetFeedPostsUseCase
- `src/comments/comments.module.ts` - Exports CreateCommentUseCase
- `src/likes/likes.module.ts` - Exports AddLikeUseCase
- `src/moderation/moderation.module.ts` - Exports ModerateTextUseCase

---

### Beneficios Alcanzados

✅ **Casos de Uso Explícitos**: Cada acción del sistema es un caso de uso identificable
✅ **Inyección de Repositorios**: Use cases solo dependen de interfaces, no de servicios
✅ **Excepciones Semánticas**: Errores claros del dominio en lugar de excepciones genéricas
✅ **Separación de Responsabilidades**: Cada use case hace una cosa y la hace bien
✅ **Facilidad de Testing**: Fácil crear mocks de repositorios para tests unitarios

---

## ELSA: Controllers, Mappers y Filtro Global

### Problemas Identificados

#### 1. **Controladores acoplados a servicios**
- **Problema**: `PostsController`, `CommentsController` y `LikesController` dependían directamente de servicios en lugar de use cases.
- **Impacto**: La capa de presentación no estaba aislada y la orquestación de negocio quedó dispersa.

#### 2. **Respuestas sin mapeo uniforme**
- **Problema**: Las respuestas devolvían entidades y payloads directos de Prisma sin convertirlos a DTO de salida.
- **Impacto**: Se exponía información innecesaria y no había un formato de salida consistente.

#### 3. **Ausencia de filtro global para errores**
- **Problema**: Los errores de dominio y HTTP se manejaban de forma inconsistente en cada módulo.
- **Impacto**: Las respuestas de error no eran uniformes y complicaban el control de excepciones.

---

### Solución implementada

- Moví los controladores a `presentation/controllers` y los actualicé para inyectar use cases.
- Añadí mappers de salida en `presentation/mappers` para convertir entidades a respuestas controladas.
- Creé `src/shared/filters/exception.filter.ts` y lo registré en `src/app.module.ts` con `APP_FILTER`.
- Añadí casos de uso de listado para separar la lógica de orquestación de la capa de presentación.

---

### Código resumido

```typescript
// src/posts/presentation/controllers/posts.controller.ts
return {
  ok: true,
  payload: PostMapper.toResponse(await this.createPostUseCase.execute(body)),
}
```

```typescript
// src/comments/presentation/controllers/comments.controller.ts
const response = await this.listCommentsByPostIdUseCase.execute(postId)
return {
  total_comments: response.total_comments,
  comments: response.comments.map(CommentMapper.toResponse),
}
```

```typescript
// src/shared/filters/exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // normaliza HttpException y DomainException
  }
}
```

---

### Diagrama de flujo

```
Presentation Layer         Application Layer          Infrastructure Layer
-----------------         ------------------          ----------------------
PostsController  -->       CreatePostUseCase  -->      PostRepository
CommentsController -->      CreateCommentUseCase -->      CommentRepository
LikesController  -->       AddLikeUseCase     -->      LikeRepository

                 \           /                     
                  \         /                      
                   v       v                       
                AllExceptionsFilter               
                    (global)

Response Mapping: Controller -> Mapper -> HTTP response
```

---

### Archivos creados para esta tarea

- `src/posts/presentation/controllers/posts.controller.ts`
- `src/comments/presentation/controllers/comments.controller.ts`
- `src/likes/presentation/controllers/likes.controller.ts`
- `src/posts/presentation/mappers/post.mapper.ts`
- `src/comments/presentation/mappers/comment.mapper.ts`
- `src/likes/presentation/mappers/like.mapper.ts`
- `src/shared/filters/exception.filter.ts`
- `src/posts/application/use-cases/list-posts.use-case.ts`
- `src/comments/application/use-cases/list-comments-by-post.use-case.ts`

---

## CRISTIAN: Response Pattern, Content Moderation & Exception Mapping

### Problemas Identificados

#### 1. **Respuestas Inconsistentes entre Endpoints**
- **Problema**: Algunos endpoints devolvían `{ ok: true, payload: {...} }` mientras que otros devolvían objetos planos.
- **Impacto**: Tests fallaban porque esperaban patrones inconsistentes de acceso a datos.

#### 2. **Falta de Validación de Contenido en Creación**
- **Problema**: Posts y comentarios no validaban contenido prohibido antes de persistir.
- **Impacto**: Moderación no bloqueaba palabras prohibidas, permitiendo contenido inapropiado en BD.

#### 3. **Mapeo Incorrecto de Errores HTTP**
- **Problema**: Recursos no encontrados devolvían 400 en lugar de 404, y el orden de excepciones en el filtro era incorrecto.
- **Impacto**: Clientes no podían diferenciar entre validation errors (400) y recursos inexistentes (404).

#### 4. **Deadlocks en SQLite durante Limpieza de Tests**
- **Problema**: `Promise.all()` en beforeEach/afterEach causaba bloqueos concurrentes de la BD SQLite.
- **Impacto**: Tests se agotaban (timeouts) sin poder completar la fase de limpieza.

---

### Soluciones Implementadas

#### 1. **Response Envelope Pattern con Spread Operator**

Patrón unificado para respuestas que permite acceso dual a propiedades:

```typescript
// src/posts/presentation/controllers/posts.controller.ts
@Post()
async create(@Body() body: CreatePostDto) {
    const response = PostMapper.toResponse(
        await this.createPostUseCase.execute(body)
    )
    return {
        ok: true,
        payload: response,
        ...response,  // Spread para acceso directo: res.body.id, res.body.title
    }
}
```

**Beneficio**: Tests pueden acceder tanto `res.body.payload.id` como `res.body.id`

#### 2. **Content Moderation en Use Cases**

Inyección de ModerationService en casos de uso para validación previa a persistencia:

```typescript
// src/posts/application/use-cases/create-post.use-case.ts
@Injectable()
export class CreatePostUseCase {
    constructor(
        private readonly postRepository: IPostRepository,
        private readonly moderationService: ModerationService,
    ) {}

    async execute(input: CreatePostInput): Promise<Post> {
        const moderation = await this.moderationService.moderate(input.text)
        if (!moderation.approved) {
            throw new BadRequestException(
                moderation.reason ?? "Post bloqueado por moderación"
            )
        }
        return await this.postRepository.create(input)
    }
}

// src/comments/application/use-cases/create-comment.use-case.ts
async execute(input: CreateCommentInput): Promise<Comment> {
    const post = await this.postRepository.findById(input.postId)
    if (!post) {
        throw new PostNotFoundException(input.postId)  // 404
    }
    const moderation = await this.moderationService.moderate(input.content)
    if (!moderation.approved) {
        throw new BadRequestException(moderation.reason)  // 400
    }
    return await this.commentRepository.create(input)
}
```

**Beneficio**: Moderación bloqueada antes de persistencia, respuestas claras al cliente

#### 3. **Exception Mapping con NotFoundException**

Cambio de herencia para mapeo correcto de excepciones HTTP:

```typescript
// src/shared/exceptions/post-not-found.exception.ts
import { NotFoundException } from '@nestjs/common'

export class PostNotFoundException extends NotFoundException {
    constructor(postId: string) {
        super(`Post with ID "${postId}" not found`)
    }
}

// src/shared/filters/exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let message = 'Internal server error'

        // ✅ NotFoundException debe ir PRIMERO (extiende HttpException)
        if (exception instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND  // 404
        } else if (exception instanceof HttpException) {
            status = exception.getStatus()
        } else if (exception instanceof DomainException) {
            status = HttpStatus.BAD_REQUEST  // 400
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        })
    }
}
```

**Beneficio**: Errores 404 para recursos inexistentes, 400 para validaciones de negocio

#### 4. **Database Deadlock Resolution**

Sequential cleanup en tests + Jest flag para prevenir ejecución paralela:

```typescript
// tests/posts.integration.spec.ts
afterEach(async () => {
    // ❌ MALO: Promise.all() causa deadlocks en SQLite
    // await Promise.all([
    //     commentService.deleteMany(),
    //     likeService.deleteMany(),
    // ])

    // ✅ BUENO: Sequential await respeta FK constraints
    await commentModel.deleteMany()
    await likeModel.deleteMany()
    await prohibitedWordModel.deleteMany()
    await postModel.deleteMany()
})

// package.json
{
    "scripts": {
        "test": "jest --config ./tests/jest.integration.json --runInBand",
        "test:watch": "jest --config ./tests/jest.integration.json --watch --runInBand"
    }
}
```

**Beneficio**: Tests completan sin timeouts, operaciones DB secuenciales sin bloqueos

---

### Archivos Modificados

#### Presentation Layer (Controllers)
- `src/posts/presentation/controllers/posts.controller.ts` - Agregó spread operator a response
- `src/moderation/moderation.controller.ts` - Ajustó formato de respuesta

#### Application Layer (Use Cases)
- `src/posts/application/use-cases/create-post.use-case.ts` - Agregó ModerationService + validación
- `src/comments/application/use-cases/create-comment.use-case.ts` - Agregó PostNotFoundException + ModerationService
- `src/likes/application/use-cases/add-like.use-case.ts` - Agregó PostNotFoundException

#### Shared Infrastructure
- `src/shared/exceptions/post-not-found.exception.ts` - Cambió herencia a NotFoundException
- `src/shared/filters/exception.filter.ts` - Agregó orden correcta de excepciones

#### Test Configuration
- `package.json` - Agregó `--runInBand` flag
- `tests/posts.integration.spec.ts` - Sequential cleanup sin Promise.all()

---

### Beneficios Alcanzados

✅ **Response Uniforme**: Envelope pattern con spread permite acceso flexible
✅ **Moderación Efectiva**: Palabras prohibidas bloqueadas antes de persistencia
✅ **Errores Semánticos**: 404 para no encontrado, 400 para validación
✅ **Tests Estables**: Deadlocks eliminados, suite completa sin timeouts
✅ **Clean Architecture Mantenida**: Separación de capas respetada, validaciones en use cases



