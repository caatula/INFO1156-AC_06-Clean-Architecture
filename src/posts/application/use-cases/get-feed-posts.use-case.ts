import { Injectable } from '@nestjs/common';
import { IPostRepository, PostFilters } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/entities/post.entity';

/**
 * Use Case: Obtener el feed de posts
 * 
 * Responsabilidades:
 * - Recuperar posts del repositorio
 * - Aplicar filtros si es necesario
 * - Retornar la lista de posts
 * 
 * Sigue Clean Architecture: solo inyecta repositorios, no servicios
 */
@Injectable()
export class GetFeedPostsUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(filters?: PostFilters): Promise<Post[]> {
    // Aquí iría la lógica de negocio del feed
    // Por ejemplo: ordenamiento, paginación, ranking, etc.
    
    // Recuperamos los posts del repositorio
    const posts = await this.postRepository.findMany(filters);
    
    return posts;
  }
}
