/**
 * Utilidades de validación de formularios
 * Proporciona funciones de validación reutilizables con mensajes personalizados
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  match?: string; // Para comparar con otro valor (ej: confirmar contraseña)
  custom?: (value: string) => ValidationResult;
}

export interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  email?: string;
  match?: string;
}

/**
 * Valida un campo según las reglas proporcionadas
 */
export function validateField(
  value: string,
  rules: ValidationRules,
  messages: ValidationMessages
): ValidationResult {
  // Validar campo requerido
  if (rules.required && (!value || value.trim() === '')) {
    return {
      isValid: false,
      error: messages.required || 'Este campo es obligatorio',
    };
  }

  // Si el campo está vacío y no es requerido, es válido
  if (!value || value.trim() === '') {
    return { isValid: true };
  }

  // Validar longitud mínima
  if (rules.minLength && value.length < rules.minLength) {
    return {
      isValid: false,
      error: messages.minLength || `Debe tener al menos ${rules.minLength} caracteres`,
    };
  }

  // Validar longitud máxima
  if (rules.maxLength && value.length > rules.maxLength) {
    return {
      isValid: false,
      error: messages.maxLength || `No debe exceder ${rules.maxLength} caracteres`,
    };
  }

  // Validar email
  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        error: messages.email || 'Ingresa un correo electrónico válido',
      };
    }
  }

  // Validar patrón personalizado
  if (rules.pattern && !rules.pattern.test(value)) {
    return {
      isValid: false,
      error: messages.pattern || 'El formato no es válido',
    };
  }

  // Validar coincidencia (para confirmar contraseña)
  if (rules.match !== undefined && value !== rules.match) {
    return {
      isValid: false,
      error: messages.match || 'Los valores no coinciden',
    };
  }

  // Validación personalizada
  if (rules.custom) {
    return rules.custom(value);
  }

  return { isValid: true };
}

/**
 * Valida múltiples campos de un formulario
 */
export function validateForm(
  fields: Record<string, string>,
  rules: Record<string, ValidationRules>,
  messages: Record<string, ValidationMessages>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(fields).forEach((fieldName) => {
    const fieldRules = rules[fieldName];
    const fieldMessages = messages[fieldName];

    if (fieldRules) {
      const result = validateField(fields[fieldName], fieldRules, fieldMessages);
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
      }
    }
  });

  return errors;
}

/**
 * Validaciones comunes predefinidas
 */
export const commonValidations = {
  email: {
    email: true,
    required: true,
  },
  password: {
    required: true,
    minLength: 8,
  },
  name: {
    required: true,
    minLength: 2,
  },
  idCard: {
    required: true,
    minLength: 6,
    maxLength: 20,
  },
};

/**
 * Limpia los errores de un campo específico
 */
export function clearFieldError(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}

/**
 * Verifica si hay errores en el formulario
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}
