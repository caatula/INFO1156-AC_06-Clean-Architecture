import { Injectable } from '@nestjs/common';

export interface ModerateTextInput {
  text: string;
}

export interface ModerateTextOutput {
  isModerated: boolean;
  flaggedWords: string[];
  reason?: string;
}

/**
 * Use Case: Moderar texto (verificar palabras prohibidas)
 * 
 * Responsabilidades:
 * - Analizar el texto para detectar palabras prohibidas
 * - Retornar si el contenido debe ser moderado
 * - Listar las palabras que lo requieren
 * 
 * Sigue Clean Architecture: solo inyecta repositorios, no servicios
 */
@Injectable()
export class ModerateTextUseCase {
  constructor() {}

  async execute(input: ModerateTextInput): Promise<ModerateTextOutput> {
    // Aquí iría la lógica de negocio de moderación
    // Por ejemplo:
    // - Búsqueda de palabras prohibidas
    // - Análisis de contenido
    // - Aplicación de reglas de negocio

    // Por ahora, retornamos un resultado básico
    const flaggedWords: string[] = [];
    const isModerated = flaggedWords.length > 0;

    return {
      isModerated,
      flaggedWords,
      reason: isModerated ? 'Contenido contiene palabras prohibidas' : undefined,
    };
  }
}
