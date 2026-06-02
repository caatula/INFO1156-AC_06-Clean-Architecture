import { Injectable } from '@nestjs/common';
import { IPostRepository, CreatePostInput } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/entities/post.entity';

/**
 * Use Case: Crear un nuevo post
 * 
 * Responsabilidades:
 * - Recibir los datos del post
 * - Validar la lógica de negocio
 * - Delegarle al repositorio la persistencia
 * - Retornar el post creado
 * 
 * Sigue Clean Architecture: solo inyecta repositorios, no servicios
 */
@Injectable()
export class CreatePostUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: CreatePostInput): Promise<Post> {
    // Aquí iría la lógica de negocio específica del caso de uso
    // Por ejemplo: validaciones, cálculos, etc.
    
    // Delegamos la persistencia al repositorio
    const post = await this.postRepository.create(input);
    
    return post;
  }
}
