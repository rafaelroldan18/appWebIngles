/**
 * Validador de contenido generado por IA
 * Asegura que el contenido cumpla con los requisitos de cada juego
 */

import { GameTypeId } from './game-content-contracts';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    correctedContent?: any[];
}

export interface GeneratedItem {
    content_type: string;
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
}

/**
 * Valida el contenido generado según el tipo de juego
 */
export function validateGeneratedContent(
    content: any[],
    gameTypeId: GameTypeId
): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    // Validación básica
    if (!Array.isArray(content)) {
        result.isValid = false;
        result.errors.push('El contenido no es un array');
        return result;
    }

    if (content.length === 0) {
        result.isValid = false;
        result.errors.push('El contenido está vacío');
        return result;
    }

    // Validación específica por juego
    switch (gameTypeId) {
        case 'word_catcher':
            return validateWordCatcher(content);
        case 'grammar_run':
            return validateGrammarRun(content);
        case 'sentence_builder':
            return validateSentenceBuilder(content);
        case 'image_match':
            return validateImageMatch(content);
        case 'city_explorer':
            return validateCityExplorer(content);
        default:
            result.isValid = false;
            result.errors.push(`Tipo de juego desconocido: ${gameTypeId}`);
            return result;
    }
}

/**
 * Validación para Word Catcher
 * - Debe ser tipo 'word'
 * - content_text debe ser una palabra (sin espacios)
 * - Debe tener traducción en metadata
 * - is_correct debe ser boolean
 */
function validateWordCatcher(content: any[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    content.forEach((item, index) => {
        const correctedItem = { ...item };
        let itemHasErrors = false;

        // Validar content_type
        if (item.content_type !== 'word') {
            result.errors.push(`Elemento ${index + 1}: content_type debe ser 'word', recibido '${item.content_type}'`);
            correctedItem.content_type = 'word';
            itemHasErrors = true;
        }

        // Validar content_text
        if (!item.content_text || typeof item.content_text !== 'string') {
            result.errors.push(`Elemento ${index + 1}: content_text es requerido y debe ser string`);
            itemHasErrors = true;
        } else {
            const trimmed = item.content_text.trim();
            if (trimmed.includes(' ')) {
                result.warnings.push(`Elemento ${index + 1}: "${trimmed}" contiene espacios, debería ser una palabra única`);
            }
            if (trimmed.length === 0) {
                result.errors.push(`Elemento ${index + 1}: content_text está vacío`);
                itemHasErrors = true;
            }
            correctedItem.content_text = trimmed;
        }

        // Validar is_correct
        if (typeof item.is_correct !== 'boolean') {
            result.warnings.push(`Elemento ${index + 1}: is_correct debe ser boolean, asumiendo true`);
            correctedItem.is_correct = true;
        }

        // Validar metadata.translation
        if (!item.metadata || !item.metadata.translation) {
            result.warnings.push(`Elemento ${index + 1}: falta traducción en metadata`);
            correctedItem.metadata = { ...item.metadata, translation: null };
        }

        if (itemHasErrors) {
            result.isValid = false;
        }

        result.correctedContent!.push(correctedItem);
    });

    return result;
}

/**
 * Validación para Grammar Run
 * - Debe ser tipo 'sentence'
 * - content_text debe contener '___' (espacio en blanco)
 * - metadata debe tener correct_option y wrong_options (array de 2)
 * - Las opciones no deben estar vacías
 */
function validateGrammarRun(content: any[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    content.forEach((item, index) => {
        const correctedItem = { ...item };
        let itemHasErrors = false;

        // Validar content_type
        if (item.content_type !== 'sentence') {
            result.errors.push(`Elemento ${index + 1}: content_type debe ser 'sentence'`);
            correctedItem.content_type = 'sentence';
            itemHasErrors = true;
        }

        // Validar content_text contiene '___'
        if (!item.content_text || typeof item.content_text !== 'string') {
            result.errors.push(`Elemento ${index + 1}: content_text es requerido`);
            itemHasErrors = true;
        } else if (!item.content_text.includes('___')) {
            result.errors.push(`Elemento ${index + 1}: la frase debe contener '___' para el espacio en blanco`);
            itemHasErrors = true;
        }

        // Validar metadata
        if (!item.metadata) {
            result.errors.push(`Elemento ${index + 1}: falta metadata`);
            itemHasErrors = true;
        } else {
            // Validar correct_option
            if (!item.metadata.correct_option || typeof item.metadata.correct_option !== 'string') {
                result.errors.push(`Elemento ${index + 1}: falta correct_option en metadata`);
                itemHasErrors = true;
            }

            // Validar wrong_options
            if (!Array.isArray(item.metadata.wrong_options)) {
                result.errors.push(`Elemento ${index + 1}: wrong_options debe ser un array`);
                itemHasErrors = true;
            } else if (item.metadata.wrong_options.length !== 2) {
                result.errors.push(`Elemento ${index + 1}: debe haber exactamente 2 opciones incorrectas, encontradas ${item.metadata.wrong_options.length}`);
                itemHasErrors = true;
            } else {
                // Validar que las opciones no estén vacías
                item.metadata.wrong_options.forEach((opt: any, optIndex: number) => {
                    if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
                        result.errors.push(`Elemento ${index + 1}: opción incorrecta ${optIndex + 1} está vacía`);
                        itemHasErrors = true;
                    }
                });
            }

            // Validar que las 3 opciones sean diferentes
            if (item.metadata.correct_option && item.metadata.wrong_options) {
                const allOptions = [item.metadata.correct_option, ...item.metadata.wrong_options];
                const uniqueOptions = new Set(allOptions.map((o: string) => o.toLowerCase().trim()));
                if (uniqueOptions.size !== 3) {
                    result.warnings.push(`Elemento ${index + 1}: las opciones deben ser diferentes entre sí`);
                }
            }
        }

        // is_correct siempre debe ser true para Grammar Run
        correctedItem.is_correct = true;

        if (itemHasErrors) {
            result.isValid = false;
        }

        result.correctedContent!.push(correctedItem);
    });

    return result;
}

/**
 * Validación para Sentence Builder
 * - Debe ser tipo 'sentence'
 * - content_text debe ser una oración completa
 * - metadata debe tener difficulty (easy/medium/hard)
 * - Debe tener traducción
 */
function validateSentenceBuilder(content: any[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    const validDifficulties = ['easy', 'medium', 'hard'];

    content.forEach((item, index) => {
        const correctedItem = { ...item };
        let itemHasErrors = false;

        // Validar content_type
        if (item.content_type !== 'sentence') {
            result.errors.push(`Elemento ${index + 1}: content_type debe ser 'sentence'`);
            correctedItem.content_type = 'sentence';
            itemHasErrors = true;
        }

        // Validar content_text
        if (!item.content_text || typeof item.content_text !== 'string') {
            result.errors.push(`Elemento ${index + 1}: content_text es requerido`);
            itemHasErrors = true;
        } else {
            const trimmed = item.content_text.trim();
            const wordCount = trimmed.split(/\s+/).length;

            if (wordCount < 3) {
                result.warnings.push(`Elemento ${index + 1}: la oración es muy corta (${wordCount} palabras)`);
            }

            correctedItem.content_text = trimmed;
        }

        // Validar metadata
        if (!item.metadata) {
            result.warnings.push(`Elemento ${index + 1}: falta metadata, usando valores por defecto`);
            correctedItem.metadata = { difficulty: 'medium', translation: null };
        } else {
            // Validar difficulty
            if (!item.metadata.difficulty || !validDifficulties.includes(item.metadata.difficulty)) {
                result.warnings.push(`Elemento ${index + 1}: difficulty inválida, usando 'medium'`);
                correctedItem.metadata = { ...item.metadata, difficulty: 'medium' };
            }

            // Validar translation
            if (!item.metadata.translation) {
                result.warnings.push(`Elemento ${index + 1}: falta traducción`);
            }
        }

        // is_correct siempre debe ser true
        correctedItem.is_correct = true;

        if (itemHasErrors) {
            result.isValid = false;
        }

        result.correctedContent!.push(correctedItem);
    });

    return result;
}

/**
 * Validación para Image Match
 * - Debe ser tipo 'image-word-pair'
 * - content_text debe ser una palabra o frase corta
 * - image_url debe ser null (se sube después)
 * - Debe tener traducción
 */
function validateImageMatch(content: any[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    content.forEach((item, index) => {
        const correctedItem = { ...item };
        let itemHasErrors = false;

        // Validar content_type
        if (item.content_type !== 'image-word-pair') {
            result.errors.push(`Elemento ${index + 1}: content_type debe ser 'image-word-pair'`);
            correctedItem.content_type = 'image-word-pair';
            itemHasErrors = true;
        }

        // Validar content_text
        if (!item.content_text || typeof item.content_text !== 'string') {
            result.errors.push(`Elemento ${index + 1}: content_text es requerido`);
            itemHasErrors = true;
        } else {
            const trimmed = item.content_text.trim();
            const wordCount = trimmed.split(/\s+/).length;

            if (wordCount > 5) {
                result.warnings.push(`Elemento ${index + 1}: el texto es muy largo (${wordCount} palabras), debería ser corto`);
            }

            correctedItem.content_text = trimmed;
        }

        // image_url debe ser null (se sube manualmente)
        correctedItem.image_url = null;

        // Validar metadata.translation
        if (!item.metadata || !item.metadata.translation) {
            result.warnings.push(`Elemento ${index + 1}: falta traducción`);
            correctedItem.metadata = { ...item.metadata, translation: null };
        }

        // is_correct siempre debe ser true
        correctedItem.is_correct = true;

        if (itemHasErrors) {
            result.isValid = false;
        }

        result.correctedContent!.push(correctedItem);
    });

    return result;
}

/**
 * Validación para City Explorer
 * - Debe ser tipo 'location'
 * - content_text debe ser un diálogo o frase
 * - metadata debe tener location_name
 * - Debe tener traducción
 */
function validateCityExplorer(content: any[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        correctedContent: []
    };

    content.forEach((item, index) => {
        const correctedItem = { ...item };
        let itemHasErrors = false;

        // Validar content_type
        if (item.content_type !== 'location') {
            result.errors.push(`Elemento ${index + 1}: content_type debe ser 'location'`);
            correctedItem.content_type = 'location';
            itemHasErrors = true;
        }

        // Validar content_text
        if (!item.content_text || typeof item.content_text !== 'string') {
            result.errors.push(`Elemento ${index + 1}: content_text es requerido`);
            itemHasErrors = true;
        } else {
            correctedItem.content_text = item.content_text.trim();
        }

        // Validar metadata
        if (!item.metadata) {
            result.errors.push(`Elemento ${index + 1}: falta metadata`);
            itemHasErrors = true;
        } else {
            // Validar location_name
            if (!item.metadata.location_name || typeof item.metadata.location_name !== 'string') {
                result.errors.push(`Elemento ${index + 1}: falta location_name en metadata`);
                itemHasErrors = true;
            }

            // Validar translation
            if (!item.metadata.translation) {
                result.warnings.push(`Elemento ${index + 1}: falta traducción`);
            }
        }

        // image_url es opcional
        correctedItem.image_url = item.image_url || null;

        // is_correct siempre debe ser true
        correctedItem.is_correct = true;

        if (itemHasErrors) {
            result.isValid = false;
        }

        result.correctedContent!.push(correctedItem);
    });

    return result;
}

/**
 * Genera un reporte legible de los errores de validación
 */
export function formatValidationReport(validation: ValidationResult): string {
    let report = '';

    if (validation.errors.length > 0) {
        report += '❌ ERRORES CRÍTICOS:\n';
        validation.errors.forEach(error => {
            report += `   • ${error}\n`;
        });
        report += '\n';
    }

    if (validation.warnings.length > 0) {
        report += '⚠️  ADVERTENCIAS:\n';
        validation.warnings.forEach(warning => {
            report += `   • ${warning}\n`;
        });
        report += '\n';
    }

    if (validation.isValid && validation.warnings.length === 0) {
        report += '✅ Validación exitosa: Todo el contenido cumple con los requisitos\n';
    }

    return report;
}
