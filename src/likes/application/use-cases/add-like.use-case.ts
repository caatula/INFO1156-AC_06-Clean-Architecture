import { Injectable } from '@nestjs/common';
import { ILikeRepository, CreateLikeInput } from '../../domain/repositories/like.repository.interface';
import { IPostRepository } from '../../../posts/domain/repositories/post.repository.interface';
import { Like } from '../../domain/entities/like.entity';
import { PostNotFoundException } from '../../../shared/exceptions/post-not-found.exception';

/**
 * Use Case: Agregar un like (reacción) a un post
 * 
 * Responsabilidades:
 * - Validar que el post existe
 * - Validar la lógica de negocio del like
 * - Delegarle al repositorio la persistencia
 * - Retornar el like creado
 * 
 * Sigue Clean Architecture: solo inyecta repositorios, no servicios
 */
@Injectable()
export class AddLikeUseCase {
  constructor(
    private readonly likeRepository: ILikeRepository,
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(input: CreateLikeInput): Promise<Like> {
    // Validación: verificar que el post existe
    const post = await this.postRepository.findById(input.postId);
    
    if (!post) {
      throw new PostNotFoundException(input.postId);
    }

    // Aquí iría la lógica de negocio específica del like
    // Por ejemplo: validación del tipo de reacción, cálculo de peso, etc.

    // Delegamos la persistencia al repositorio
    const like = await this.likeRepository.create(input);
    
    return like;
  }
}
