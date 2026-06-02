/**
 * Excepción base para errores del dominio
 * Siguiendo Clean Architecture, todas las excepciones de negocio heredan de esta clase
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}
