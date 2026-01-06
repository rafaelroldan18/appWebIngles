/**
 * Game Content Contracts
 * Define qué tipo de contenido consume cada juego (contrato pedagógico)
 * Esto evita confusiones y garantiza coherencia en la experiencia de aprendizaje
 */

export type GameTypeId = 'word_catcher' | 'grammar_run' | 'sentence_builder' | 'image_match' | 'city_explorer';

export type ContentType = 'word' | 'sentence' | 'location' | 'image-word-pair' | 'option';

export interface GameContentContract {
    gameTypeId: GameTypeId;
    gameName: string;
    description: string;
    icon: string; // Emoji o nombre de icono
    color: string; // Color temático del juego
    requiredContentTypes: ContentType[];
    formFields: FormField[];
    pedagogicalPurpose: string;
}

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'checkbox' | 'image' | 'select';
    placeholder?: string;
    required: boolean;
    helpText?: string;
    options?: { value: string; label: string }[];
}

/**
 * Contratos de contenido por juego
 * Cada juego define exactamente qué contenido necesita
 */
export const GAME_CONTENT_CONTRACTS: Record<GameTypeId, GameContentContract> = {
    word_catcher: {
        gameTypeId: 'word_catcher',
        gameName: 'Word Catcher',
        description: 'Vocabulario: captura palabras que caen del cielo',
        icon: '🎯',
        color: 'blue',
        requiredContentTypes: ['word'],
        pedagogicalPurpose: 'Reforzar vocabulario mediante reconocimiento rápido de palabras',
        formFields: [
            {
                name: 'content_text',
                label: 'Palabra en inglés',
                type: 'text',
                placeholder: 'Ej: cat, dog, play, happy',
                required: true,
                helpText: 'Escribe una palabra individual que el estudiante debe capturar'
            },
            {
                name: 'translation',
                label: 'Traducción (opcional)',
                type: 'text',
                placeholder: 'Ej: gato, perro, jugar, feliz',
                required: false,
                helpText: 'Ayuda visual para el estudiante'
            },
            {
                name: 'is_correct',
                label: '¿Es palabra correcta?',
                type: 'checkbox',
                required: false,
                helpText: 'Desmarca si es un distractor (palabra incorrecta que no debe capturarse)'
            },
            {
                name: 'image_url',
                label: 'Imagen de apoyo',
                type: 'image',
                required: false,
                helpText: 'Imagen que refuerza el significado de la palabra'
            }
        ]
    },

    grammar_run: {
        gameTypeId: 'grammar_run',
        gameName: 'Grammar Run',
        description: 'Gramática: elige la opción correcta mientras corres',
        icon: '🏃',
        color: 'green',
        requiredContentTypes: ['sentence', 'option'],
        pedagogicalPurpose: 'Practicar estructuras gramaticales en contexto',
        formFields: [
            {
                name: 'content_text',
                label: 'Frase para completar',
                type: 'text',
                placeholder: 'Ej: I ___ football every day',
                required: true,
                helpText: 'Usa ___ para marcar el espacio donde va la respuesta'
            },
            {
                name: 'correct_option',
                label: 'Opción correcta',
                type: 'text',
                placeholder: 'Ej: play',
                required: true,
                helpText: 'La respuesta correcta que completa la oración'
            },
            {
                name: 'wrong_option_1',
                label: 'Opción incorrecta 1',
                type: 'text',
                placeholder: 'Ej: plays',
                required: true,
                helpText: 'Primera opción incorrecta (distractor)'
            },
            {
                name: 'wrong_option_2',
                label: 'Opción incorrecta 2',
                type: 'text',
                placeholder: 'Ej: playing',
                required: true,
                helpText: 'Segunda opción incorrecta (distractor)'
            }
        ]
    },

    sentence_builder: {
        gameTypeId: 'sentence_builder',
        gameName: 'Sentence Builder',
        description: 'Construcción: ordena palabras para formar oraciones',
        icon: '🏗️',
        color: 'purple',
        requiredContentTypes: ['sentence'],
        pedagogicalPurpose: 'Desarrollar comprensión de estructura sintáctica',
        formFields: [
            {
                name: 'content_text',
                label: 'Oración completa',
                type: 'text',
                placeholder: 'Ej: The cat is sleeping on the sofa',
                required: true,
                helpText: 'La oración que el estudiante debe construir ordenando palabras'
            },
            {
                name: 'difficulty',
                label: 'Dificultad',
                type: 'select',
                required: false,
                options: [
                    { value: 'easy', label: 'Fácil (3-5 palabras)' },
                    { value: 'medium', label: 'Media (6-8 palabras)' },
                    { value: 'hard', label: 'Difícil (9+ palabras)' }
                ],
                helpText: 'Nivel de complejidad de la oración'
            },
            {
                name: 'translation',
                label: 'Traducción de referencia',
                type: 'text',
                placeholder: 'Ej: El gato está durmiendo en el sofá',
                required: false,
                helpText: 'Ayuda para que el estudiante comprenda el significado'
            }
        ]
    },

    image_match: {
        gameTypeId: 'image_match',
        gameName: 'Image Match',
        description: 'Asociación: conecta imágenes con palabras',
        icon: '🖼️',
        color: 'pink',
        requiredContentTypes: ['image-word-pair'],
        pedagogicalPurpose: 'Asociar vocabulario con representaciones visuales',
        formFields: [
            {
                name: 'content_text',
                label: 'Palabra o frase',
                type: 'text',
                placeholder: 'Ej: apple, red car, happy family',
                required: true,
                helpText: 'El texto que debe coincidir con la imagen'
            },
            {
                name: 'image_url',
                label: 'Imagen',
                type: 'image',
                required: true,
                helpText: 'La imagen que representa la palabra o frase (OBLIGATORIA para este juego)'
            },
            {
                name: 'translation',
                label: 'Traducción',
                type: 'text',
                placeholder: 'Ej: manzana, carro rojo, familia feliz',
                required: false,
                helpText: 'Traducción de apoyo'
            }
        ]
    },

    city_explorer: {
        gameTypeId: 'city_explorer',
        gameName: 'City Explorer',
        description: 'Exploración: navega la ciudad y aprende en contexto',
        icon: '🏙️',
        color: 'orange',
        requiredContentTypes: ['location', 'sentence'],
        pedagogicalPurpose: 'Aprender vocabulario y frases en contextos situacionales',
        formFields: [
            {
                name: 'location_name',
                label: 'Nombre del lugar',
                type: 'text',
                placeholder: 'Ej: Restaurant, Park, School, Hospital',
                required: true,
                helpText: 'El lugar de la ciudad donde ocurre la interacción'
            },
            {
                name: 'content_text',
                label: 'Diálogo o frase',
                type: 'textarea',
                placeholder: 'Ej: Can I have a menu, please?',
                required: true,
                helpText: 'La frase o diálogo que el estudiante aprenderá en este lugar'
            },
            {
                name: 'translation',
                label: 'Traducción',
                type: 'text',
                placeholder: 'Ej: ¿Puedo tener un menú, por favor?',
                required: false,
                helpText: 'Traducción de la frase'
            },
            {
                name: 'image_url',
                label: 'Imagen del lugar',
                type: 'image',
                required: false,
                helpText: 'Imagen representativa del lugar (opcional)'
            }
        ]
    }
};

/**
 * Obtener el color de Tailwind según el juego
 */
export function getGameColor(gameTypeId: GameTypeId): {
    bg: string;
    text: string;
    hover: string;
    border: string;
} {
    const colors: Record<string, { bg: string; text: string; hover: string; border: string }> = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
            hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
            border: 'border-blue-200 dark:border-blue-800'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            text: 'text-green-600 dark:text-green-400',
            hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
            border: 'border-green-200 dark:border-green-800'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-600 dark:text-purple-400',
            hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
            border: 'border-purple-200 dark:border-purple-800'
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-900/20',
            text: 'text-pink-600 dark:text-pink-400',
            hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30',
            border: 'border-pink-200 dark:border-pink-800'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            text: 'text-orange-600 dark:text-orange-400',
            hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
            border: 'border-orange-200 dark:border-orange-800'
        }
    };

    const contract = GAME_CONTENT_CONTRACTS[gameTypeId];
    return colors[contract.color] || colors.blue;
}
