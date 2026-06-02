import { DomainException } from './domain.exception';

/**
 * Excepción lanzada cuando no se encuentra un post en la base de datos
 */
export class PostNotFoundException extends DomainException {
  constructor(postId: string) {
    super(`Post with ID "${postId}" not found`);
    this.name = 'PostNotFoundException';
  }
}
