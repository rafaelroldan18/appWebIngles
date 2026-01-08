/**
 * POST /api/ai/generate-game-content
 * Genera contenido de juego usando Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GameTypeId, GAME_CONTENT_CONTRACTS } from '@/lib/game-content-contracts';
import { validateGeneratedContent, formatValidationReport } from '@/lib/ai-content-validator';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateContentRequest {
    topicId: string;
    topicTitle: string;
    gameTypeId: GameTypeId;
    count: number;
    contextNote?: string; // Ej: "nivel 1ro BGU", "principiantes", etc.
}

export async function POST(request: NextRequest) {
    console.log('🚀 [AI Endpoint] Iniciando generación de contenido con IA...');

    try {
        // Validar que existe la API Key
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ [AI Endpoint] GEMINI_API_KEY no está configurada');
            return NextResponse.json(
                { error: 'GEMINI_API_KEY no está configurada en las variables de entorno' },
                { status: 500 }
            );
        }

        console.log('✅ [AI Endpoint] API Key encontrada');

        const body: GenerateContentRequest = await request.json();
        const { topicId, topicTitle, gameTypeId, count, contextNote } = body;

        console.log('📥 [AI Endpoint] Request recibido:', {
            topicId,
            topicTitle,
            gameTypeId,
            count,
            contextNote
        });

        // Validaciones
        if (!topicId || !topicTitle || !gameTypeId || !count) {
            console.error('❌ [AI Endpoint] Faltan campos requeridos');
            return NextResponse.json(
                { error: 'Faltan campos requeridos: topicId, topicTitle, gameTypeId, count' },
                { status: 400 }
            );
        }

        if (count < 1 || count > 20) {
            console.error('❌ [AI Endpoint] Count fuera de rango:', count);
            return NextResponse.json(
                { error: 'El count debe estar entre 1 y 20' },
                { status: 400 }
            );
        }

        const contract = GAME_CONTENT_CONTRACTS[gameTypeId];
        if (!contract) {
            console.error('❌ [AI Endpoint] Tipo de juego inválido:', gameTypeId);
            return NextResponse.json(
                { error: `Tipo de juego inválido: ${gameTypeId}` },
                { status: 400 }
            );
        }

        console.log('✅ [AI Endpoint] Validaciones pasadas');

        // Construir el prompt específico para cada juego
        const prompt = buildPromptForGame(gameTypeId, topicTitle, count, contextNote, contract);
        console.log('📝 [AI Endpoint] Prompt construido para:', contract.gameName);

        // Llamar a Gemini
        console.log('🤖 [AI Endpoint] Generando con Gemini 2.0 Flash (Modelo verificado)...');

        // Usamos el modelo que tienes disponible con alta cuota
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ [AI Endpoint] Respuesta recibida de Gemini');
        console.log('📄 [AI Endpoint] Longitud de respuesta:', text.length, 'caracteres');

        // Parsear la respuesta JSON
        let generatedContent;
        try {
            // Limpiar el texto de posibles markdown code blocks
            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            generatedContent = JSON.parse(cleanedText);
            console.log('✅ [AI Endpoint] JSON parseado correctamente');
        } catch (parseError) {
            console.error('❌ [AI Endpoint] Error parseando JSON:', parseError);
            console.error('📄 [AI Endpoint] Respuesta de Gemini:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'La IA no devolvió un JSON válido', rawResponse: text },
                { status: 500 }
            );
        }

        // Validar que la respuesta tenga el formato esperado
        if (!Array.isArray(generatedContent)) {
            console.error('❌ [AI Endpoint] La respuesta no es un array');
            return NextResponse.json(
                { error: 'La respuesta de la IA no es un array', rawResponse: generatedContent },
                { status: 500 }
            );
        }

        console.log('✅ [AI Endpoint] Contenido generado:', generatedContent.length, 'elementos');

        // ========================================
        // VALIDACIÓN DE CONTENIDO POR TIPO DE JUEGO
        // ========================================
        console.log('🔍 [AI Endpoint] Validando contenido para:', contract.gameName);

        const validation = validateGeneratedContent(generatedContent, gameTypeId);
        const validationReport = formatValidationReport(validation);

        console.log('📋 [AI Endpoint] Reporte de validación:');
        console.log(validationReport);

        // Si hay errores críticos, rechazar el contenido
        if (!validation.isValid) {
            console.error('❌ [AI Endpoint] Validación falló - contenido rechazado');
            return NextResponse.json({
                error: 'El contenido generado no cumple con los requisitos del juego',
                validationErrors: validation.errors,
                validationWarnings: validation.warnings,
                suggestion: 'Intenta generar el contenido de nuevo. Si el problema persiste, ajusta el contexto o reduce la cantidad de elementos.'
            }, { status: 422 }); // 422 Unprocessable Entity
        }

        // Si solo hay advertencias, usar el contenido corregido
        let finalContent = generatedContent;
        if (validation.warnings.length > 0) {
            console.log('⚠️  [AI Endpoint] Hay advertencias, usando contenido corregido automáticamente');
            finalContent = validation.correctedContent || generatedContent;
        }

        console.log('✅ [AI Endpoint] Validación exitosa');

        // Agregar el topicId y target_game_type_id a cada item
        const enrichedContent = finalContent.map(item => ({
            ...item,
            topic_id: topicId,
            target_game_type_id: gameTypeId,
        }));

        console.log('🎉 [AI Endpoint] Generación completada exitosamente');

        return NextResponse.json({
            success: true,
            content: enrichedContent,
            count: enrichedContent.length,
            validation: {
                hasWarnings: validation.warnings.length > 0,
                warnings: validation.warnings,
                wasAutoCorrected: validation.warnings.length > 0
            }
        });

    } catch (error) {
        console.error('❌ [AI Endpoint] Error crítico:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Construye el prompt específico para cada tipo de juego
 */
function buildPromptForGame(
    gameTypeId: GameTypeId,
    topicTitle: string,
    count: number,
    contextNote: string | undefined,
    contract: any
): string {
    const baseContext = `Eres un asistente pedagógico experto en enseñanza de inglés. 
Tema: "${topicTitle}"
${contextNote ? `Contexto adicional: ${contextNote}` : ''}
Juego: ${contract.gameName}
Propósito pedagógico: ${contract.pedagogicalPurpose}

Genera EXACTAMENTE ${count} elementos de contenido educativo en formato JSON.`;

    let specificInstructions = '';
    let jsonExample = '';

    switch (gameTypeId) {
        case 'word_catcher':
            specificInstructions = `
Cada elemento debe ser una palabra en inglés relacionada con el tema.
Incluye palabras correctas (que el estudiante debe capturar) y algunas incorrectas como distractores.
Proporciona traducciones al español.`;
            jsonExample = `[
  {
    "content_type": "word",
    "content_text": "cat",
    "is_correct": true,
    "metadata": { "translation": "gato" }
  },
  {
    "content_type": "word",
    "content_text": "elephant",
    "is_correct": false,
    "metadata": { "translation": "elefante" }
  }
]`;
            break;

        case 'grammar_run':
            specificInstructions = `
Cada elemento debe ser una frase con un espacio en blanco (___) para completar.
Proporciona 1 opción correcta y 2 opciones incorrectas (distractores).
Las frases deben practicar estructuras gramaticales apropiadas para el nivel.`;
            jsonExample = `[
  {
    "content_type": "sentence",
    "content_text": "I ___ football every day",
    "is_correct": true,
    "metadata": {
      "correct_option": "play",
      "wrong_options": ["plays", "playing"]
    }
  }
]`;
            break;

        case 'sentence_builder':
            specificInstructions = `
Cada elemento debe ser una oración completa en inglés.
Varía la dificultad: fácil (3-5 palabras), media (6-8 palabras), difícil (9+ palabras).
Incluye traducción al español.`;
            jsonExample = `[
  {
    "content_type": "sentence",
    "content_text": "The cat is sleeping on the sofa",
    "is_correct": true,
    "metadata": {
      "difficulty": "medium",
      "translation": "El gato está durmiendo en el sofá"
    }
  }
]`;
            break;

        case 'image_match':
            specificInstructions = `
Cada elemento debe ser una palabra o frase corta en inglés.
IMPORTANTE: NO incluyas URLs de imágenes reales. Deja image_url como null.
El docente subirá las imágenes manualmente después.
Incluye traducción al español.`;
            jsonExample = `[
  {
    "content_type": "image-word-pair",
    "content_text": "apple",
    "is_correct": true,
    "image_url": null,
    "metadata": { "translation": "manzana" }
  }
]`;
            break;

        case 'city_explorer':
            specificInstructions = `
Cada elemento debe incluir un lugar de la ciudad y un diálogo o frase apropiada para ese contexto.
Los lugares deben ser variados: restaurant, park, school, hospital, etc.
Incluye traducciones al español.`;
            jsonExample = `[
  {
    "content_type": "location",
    "content_text": "Can I have a menu, please?",
    "is_correct": true,
    "image_url": null,
    "metadata": {
      "location_name": "Restaurant",
      "translation": "¿Puedo tener un menú, por favor?"
    }
  }
]`;
            break;
    }

    return `${baseContext}

${specificInstructions}

IMPORTANTE:
- Devuelve SOLO un array JSON válido, sin texto adicional.
- NO uses markdown code blocks.
- Asegúrate de que el JSON sea válido y parseable.
- Genera contenido apropiado para estudiantes de inglés.
- Sé creativo pero pedagógicamente relevante.

Ejemplo del formato JSON esperado:
${jsonExample}

Genera ahora ${count} elementos siguiendo este formato exacto:`;
}
