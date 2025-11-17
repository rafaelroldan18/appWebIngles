import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  validateField,
  validateForm,
  clearFieldError,
  hasErrors,
  type ValidationRules,
  type ValidationMessages,
} from '@/lib/utils/formValidation';

interface UseFormValidationProps {
  initialValues: Record<string, string>;
  validationRules: Record<string, ValidationRules>;
}

export function useFormValidation({ initialValues, validationRules }: UseFormValidationProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Obtiene los mensajes de validación traducidos para un campo
   */
  const getValidationMessages = useCallback(
    (fieldName: string): ValidationMessages => {
      const rules = validationRules[fieldName];
      if (!rules) return {};

      const messages: ValidationMessages = {};

      // Mensajes específicos por campo
      switch (fieldName) {
        case 'email':
        case 'correo_electronico':
          messages.required = t.validation.emailRequired;
          messages.email = t.validation.emailInvalid;
          break;
        case 'password':
        case 'contraseña':
          messages.required = t.validation.passwordRequired;
          messages.minLength = t.validation.passwordMinLength;
          break;
        case 'nombre':
          messages.required = t.validation.nameRequired;
          messages.minLength = t.validation.nameMinLength;
          break;
        case 'apellido':
          messages.required = t.validation.lastNameRequired;
          messages.minLength = t.validation.lastNameMinLength;
          break;
        case 'cedula':
          messages.required = t.validation.idCardRequired;
          messages.minLength = t.validation.idCardMinLength;
          messages.maxLength = t.validation.idCardMaxLength;
          break;
        case 'currentPassword':
          messages.required = t.validation.currentPasswordRequired;
          messages.minLength = t.validation.passwordMinLength;
          break;
        case 'newPassword':
          messages.required = t.validation.newPasswordRequired;
          messages.minLength = t.validation.passwordMinLength;
          break;
        case 'confirmPassword':
          messages.required = t.validation.confirmPasswordRequired;
          messages.minLength = t.validation.passwordMinLength;
          messages.match = t.validation.passwordMismatch;
          break;
        default:
          messages.required = t.validation.required;
      }

      return messages;
    },
    [t]
  );

  /**
   * Valida un campo individual
   */
  const validateSingleField = useCallback(
    (fieldName: string, value: string, customRules?: ValidationRules) => {
      const rules = customRules || validationRules[fieldName];
      if (!rules) return;

      const messages = getValidationMessages(fieldName);
      const result = validateField(value, rules, messages);

      setErrors((prev) => {
        if (result.isValid) {
          return clearFieldError(prev, fieldName);
        }
        return { ...prev, [fieldName]: result.error || '' };
      });
    },
    [validationRules, getValidationMessages]
  );

  /**
   * Maneja el cambio de valor de un campo
   */
  const handleChange = useCallback(
    (fieldName: string, value: string) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));

      // Validar solo si el campo ya fue tocado
      if (touched[fieldName]) {
        validateSingleField(fieldName, value);
      }
    },
    [touched, validateSingleField]
  );

  /**
   * Maneja cuando un campo pierde el foco
   */
  const handleBlur = useCallback(
    (fieldName: string) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      validateSingleField(fieldName, values[fieldName]);
    },
    [values, validateSingleField]
  );

  /**
   * Valida todos los campos del formulario
   */
  const validateAllFields = useCallback((customRules?: Record<string, ValidationRules>) => {
    const rulesToUse = customRules || validationRules;
    const validationMessages: Record<string, ValidationMessages> = {};

    Object.keys(rulesToUse).forEach((fieldName) => {
      validationMessages[fieldName] = getValidationMessages(fieldName);
    });

    const newErrors = validateForm(values, rulesToUse, validationMessages);
    setErrors(newErrors);

    // Marcar todos los campos como tocados
    const allTouched: Record<string, boolean> = {};
    Object.keys(rulesToUse).forEach((fieldName) => {
      allTouched[fieldName] = true;
    });
    setTouched(allTouched);

    return !hasErrors(newErrors);
  }, [values, validationRules, getValidationMessages]);

  /**
   * Resetea el formulario
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Limpia los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAllFields,
    reset,
    clearErrors,
    setValues,
    hasErrors: hasErrors(errors),
  };
}
