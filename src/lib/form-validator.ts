/**
 * Validador de formularios en el frontend
 * Valida que el contenido cumpla con el contrato pedagógico antes de guardar
 */

import { GameTypeId } from './game-content-contracts';

export interface FormRowError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface FormValidationResult {
    isValid: boolean;
    errors: FormRowError[];
    errorsByRow: Map<number, FormRowError[]>;
}

/**
 * Valida todas las filas del formulario según el tipo de juego
 */
export function validateFormRows(
    rows: Record<string, any>[],
    gameTypeId: GameTypeId
): FormValidationResult {
    const errors: FormRowError[] = [];
    const errorsByRow = new Map<number, FormRowError[]>();

    if (rows.length === 0) {
        return {
            isValid: false,
            errors: [{ rowIndex: -1, field: 'general', message: 'Debe haber al menos una fila' }],
            errorsByRow
        };
    }

    rows.forEach((row, index) => {
        const rowErrors: FormRowError[] = [];

        switch (gameTypeId) {
            case 'word_catcher':
                validateWordCatcherRow(row, index, rowErrors);
                break;
            case 'grammar_run':
                validateGrammarRunRow(row, index, rowErrors);
                break;
            case 'sentence_builder':
                validateSentenceBuilderRow(row, index, rowErrors);
                break;
            case 'image_match':
                validateImageMatchRow(row, index, rowErrors);
                break;
            case 'city_explorer':
                validateCityExplorerRow(row, index, rowErrors);
                break;
        }

        if (rowErrors.length > 0) {
            errorsByRow.set(index, rowErrors);
            errors.push(...rowErrors);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        errorsByRow
    };
}

/**
 * Validación para Word Catcher
 */
function validateWordCatcherRow(row: Record<string, any>, index: number, errors: FormRowError[]) {
    // content_text es obligatorio
    if (!row.content_text || row.content_text.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'La palabra es obligatoria'
        });
    } else {
        // Debe ser una palabra única (sin espacios)
        const trimmed = row.content_text.trim();
        if (trimmed.includes(' ')) {
            errors.push({
                rowIndex: index,
                field: 'content_text',
                message: 'Debe ser una palabra única (sin espacios)'
            });
        }

        // No debe ser muy larga
        if (trimmed.length > 30) {
            errors.push({
                rowIndex: index,
                field: 'content_text',
                message: 'La palabra es demasiado larga'
            });
        }
    }
}

/**
 * Validación para Grammar Run
 */
function validateGrammarRunRow(row: Record<string, any>, index: number, errors: FormRowError[]) {
    // content_text es obligatorio y debe contener ___
    if (!row.content_text || row.content_text.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'La frase es obligatoria'
        });
    } else if (!row.content_text.includes('___')) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'La frase debe contener ___ para el espacio en blanco'
        });
    }

    // correct_option es obligatorio
    if (!row.correct_option || row.correct_option.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'correct_option',
            message: 'La opción correcta es obligatoria'
        });
    }

    // wrong_option_1 es obligatorio
    if (!row.wrong_option_1 || row.wrong_option_1.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'wrong_option_1',
            message: 'La primera opción incorrecta es obligatoria'
        });
    }

    // wrong_option_2 es obligatorio
    if (!row.wrong_option_2 || row.wrong_option_2.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'wrong_option_2',
            message: 'La segunda opción incorrecta es obligatoria'
        });
    }

    // Validar que las 3 opciones sean diferentes
    if (row.correct_option && row.wrong_option_1 && row.wrong_option_2) {
        const options = [
            row.correct_option.trim().toLowerCase(),
            row.wrong_option_1.trim().toLowerCase(),
            row.wrong_option_2.trim().toLowerCase()
        ];
        const uniqueOptions = new Set(options);

        if (uniqueOptions.size !== 3) {
            errors.push({
                rowIndex: index,
                field: 'correct_option',
                message: 'Las 3 opciones deben ser diferentes entre sí'
            });
        }
    }
}

/**
 * Validación para Sentence Builder
 */
function validateSentenceBuilderRow(row: Record<string, any>, index: number, errors: FormRowError[]) {
    // content_text es obligatorio
    if (!row.content_text || row.content_text.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'La oración es obligatoria'
        });
    } else {
        // Debe tener al menos 3 palabras
        const wordCount = row.content_text.trim().split(/\s+/).length;
        if (wordCount < 3) {
            errors.push({
                rowIndex: index,
                field: 'content_text',
                message: 'La oración debe tener al menos 3 palabras'
            });
        }
    }

    // difficulty debe ser válida si está presente
    if (row.difficulty && !['easy', 'medium', 'hard'].includes(row.difficulty)) {
        errors.push({
            rowIndex: index,
            field: 'difficulty',
            message: 'La dificultad debe ser easy, medium o hard'
        });
    }
}

/**
 * Validación para Image Match
 */
function validateImageMatchRow(row: Record<string, any>, index: number, errors: FormRowError[]) {
    // content_text es obligatorio
    if (!row.content_text || row.content_text.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'La palabra o frase es obligatoria'
        });
    } else {
        // No debe ser muy larga (máximo 5 palabras)
        const wordCount = row.content_text.trim().split(/\s+/).length;
        if (wordCount > 5) {
            errors.push({
                rowIndex: index,
                field: 'content_text',
                message: 'El texto debe ser corto (máximo 5 palabras)'
            });
        }
    }

    // image_url es obligatorio para este juego
    // Nota: En la generación con IA viene null, pero el docente debe subirla
    // Por ahora solo advertimos si falta
}

/**
 * Validación para City Explorer
 */
function validateCityExplorerRow(row: Record<string, any>, index: number, errors: FormRowError[]) {
    // location_name es obligatorio
    if (!row.location_name || row.location_name.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'location_name',
            message: 'El nombre del lugar es obligatorio'
        });
    }

    // content_text es obligatorio
    if (!row.content_text || row.content_text.trim().length === 0) {
        errors.push({
            rowIndex: index,
            field: 'content_text',
            message: 'El diálogo o frase es obligatorio'
        });
    }
}

/**
 * Obtiene un mensaje de error amigable para mostrar al usuario
 */
export function getValidationSummary(validation: FormValidationResult): string {
    if (validation.isValid) {
        return '';
    }

    const errorCount = validation.errors.length;
    const rowCount = validation.errorsByRow.size;

    let summary = `Se encontraron ${errorCount} error${errorCount > 1 ? 'es' : ''} en ${rowCount} fila${rowCount > 1 ? 's' : ''}:\n\n`;

    validation.errorsByRow.forEach((rowErrors, rowIndex) => {
        summary += `Fila ${rowIndex + 1}:\n`;
        rowErrors.forEach(error => {
            summary += `  • ${error.message}\n`;
        });
        summary += '\n';
    });

    summary += 'Por favor, corrige los errores antes de guardar.';

    return summary;
}

/**
 * Verifica si una fila específica tiene errores
 */
export function hasRowErrors(validation: FormValidationResult, rowIndex: number): boolean {
    return validation.errorsByRow.has(rowIndex);
}

/**
 * Verifica si un campo específico tiene errores
 */
export function hasFieldError(validation: FormValidationResult, rowIndex: number, fieldName: string): boolean {
    const rowErrors = validation.errorsByRow.get(rowIndex);
    if (!rowErrors) return false;
    return rowErrors.some(error => error.field === fieldName);
}

/**
 * Obtiene el mensaje de error para un campo específico
 */
export function getFieldError(validation: FormValidationResult, rowIndex: number, fieldName: string): string | null {
    const rowErrors = validation.errorsByRow.get(rowIndex);
    if (!rowErrors) return null;
    const error = rowErrors.find(error => error.field === fieldName);
    return error ? error.message : null;
}
