# Tareas por Integrante - Clean Architecture

## PERSONA 1 - Repositories Pattern

### Qué vas a crear:
- **Domain Entities** (clases puras con propiedades)
  - `src/posts/domain/entities/post.entity.ts`
  - `src/comments/domain/entities/comment.entity.ts`
  - `src/likes/domain/entities/like.entity.ts`

- **Repository Interfaces** (contratos)
  - `src/posts/domain/repositories/post.repository.interface.ts`
  - `src/comments/domain/repositories/comment.repository.interface.ts`
  - `src/likes/domain/repositories/like.repository.interface.ts`

- **Repository Implementations** (con Prisma)
  - `src/posts/infrastructure/repositories/post.repository.ts`
  - `src/comments/infrastructure/repositories/comment.repository.ts`
  - `src/likes/infrastructure/repositories/like.repository.ts`

### Pasos:
1. Crea carpetas: `domain/entities/`, `domain/repositories/`, `infrastructure/repositories/`
2. Para cada entidad: crea entity, interface, y repository con Prisma
3. Reemplaza acceso directo a Prisma con repositories
4. Actualiza módulos para inyectar repositories

### Verificación:
```bash
npm run build    # Sin errores
npm run lint     # Sin errores
git push origin feat/person1-repositories
```

---

## PERSONA 2 - Use Cases (ESPERA A PERSONA 1)

### Qué vas a crear:
- **Use Cases** (lógica de negocio)
  - `src/posts/application/use-cases/create-post.use-case.ts`
  - `src/posts/application/use-cases/get-feed-posts.use-case.ts`
  - `src/comments/application/use-cases/create-comment.use-case.ts`
  - `src/likes/application/use-cases/add-like.use-case.ts`
  - `src/moderation/application/use-cases/moderate-text.use-case.ts`

- **Excepciones personalizadas**
  - `src/shared/exceptions/domain.exception.ts`
  - `src/shared/exceptions/post-not-found.exception.ts`

### Pasos:
1. Crea carpeta: `application/use-cases/`
2. Cada use case inyecta repositories (NO servicios)
3. Cada use case tiene método `execute()` con lógica de negocio
4. Crea excepciones personalizadas
5. Actualiza módulos para inyectar use cases

### Verificación:
```bash
npm run build    # Sin errores
npm run lint     # Sin errores
git push origin feat/person2-use-cases
```

---

## PERSONA 3 - Controllers & Mappers (ESPERA A PERSONA 2)

### Qué vas a crear:
- **Mappers** (convertir Entity → DTO)
  - `src/posts/presentation/mappers/post.mapper.ts`
  - `src/comments/presentation/mappers/comment.mapper.ts`
  - `src/likes/presentation/mappers/like.mapper.ts`

- **Excepciones para HTTP**
  - `src/shared/exceptions/app.exception.ts`
  - `src/shared/filters/exception.filter.ts`

### Qué vas a modificar:
- **Controllers** (cambiar servicios por use cases)
  - `src/posts/presentation/controllers/posts.controller.ts`
  - `src/comments/presentation/controllers/comments.controller.ts`
  - `src/likes/presentation/controllers/likes.controller.ts`
  - `src/app.module.ts` - agregar exception filter

### Pasos:
1. Crea mappers que conviertan Entity a DTO para respuestas
2. Refactoriza controllers:
   - Inyecta use cases en lugar de servicios
   - Llama use cases en lugar de servicios
   - Usa mappers para respuestas
3. Crea exception filter global
4. Registra exception filter en AppModule

### Verificación:
```bash
npm run build    # Sin errores
npm run lint     # Sin errores
git push origin feat/person3-controllers
```

---

## PERSONA 4 - Tests & Validación (ESPERA A PERSONA 3)

### Qué vas a crear:
- **Tests de integración actualizados**
  - `tests/posts.integration.spec.ts` - actualizar para usar use cases
  - `tests/comments.integration.spec.ts` - crear nuevos tests
  - `tests/likes.integration.spec.ts` - crear nuevos tests
  - `tests/moderation.integration.spec.ts` - crear nuevos tests

- **Tests unitarios** (opcional, si hay tiempo)
  - Tests para use cases
  - Tests para repositories
  - Tests para mappers

### Pasos:
1. Actualiza tests existentes para que usen use cases en lugar de servicios
2. Crea tests para comentarios, likes y moderación
3. Verifica que `npm test` pase completamente
4. Valida que `npm run build` compila sin errores
5. Valida que `npm run lint` pase
6. Verifica que GitHub Actions esté en verde

### Verificación:
```bash
npm run build    # Sin errores
npm run lint     # Sin errores
npm test         # TODOS los tests pasan ✓
git push origin feat/person4-tests
```


## Reglas Importantes

1. **No mergees si GitHub Actions falla** (lint, format, test)
2. **Cada persona solo trabaja en su rama** (feat/personX-*)
3. **El siguiente espera a que el anterior termine**
4. **Verifica que npm run build funcione** antes de hacer push
5. **Los tests DEBEN pasar** (especialmente Persona 4)

---

## Git Workflow

### Cada persona:
```bash
# Empieza
git checkout feat/personX-[tarea]

# Trabaja y crea archivos...

# Termina
git add .
git commit -m "feat: description"
git push origin feat/personX-[tarea]

# El líder hace PR en GitHub y mergea a develop
```

---

## Archivos Clave a Modificar

- `src/app.module.ts` - Persona 3: agregar exception filter
- `src/*/posts.module.ts` (y otros) - Persona 1: registrar repositories; Persona 2: registrar use cases
- `src/*/*.controller.ts` - Persona 3: refactorizar

---

## Falencias a Solucionar

1. Sin Repository Pattern → Persona 1 soluciona
2. Servicios hacen todo (SRP) → Persona 2 soluciona
3. Sin capa de Use Cases → Persona 2 soluciona
4. Controllers con lógica de negocio → Persona 3 soluciona
5. DTOs mezclados entre capas → Persona 1 + 3 solucionan
6. Sin manejo de errores consistente → Persona 3 soluciona
7. Acceso directo a Prisma → Persona 1 soluciona
8. Sin tests actualizados → Persona 4 soluciona
