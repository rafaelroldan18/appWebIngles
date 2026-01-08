/**
 * Script para listar los modelos disponibles en tu API Key de Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY no está configurada en el archivo .env');
    process.exit(1);
}

console.log('🔍 Listando modelos disponibles en tu API Key de Gemini...\n');

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Intentar con diferentes modelos conocidos
        const modelsToTry = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.0-pro',
            'gemini-1.0-pro-latest'
        ];

        console.log('📋 Probando modelos conocidos:\n');

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Test');
                console.log(`✅ ${modelName} - DISPONIBLE`);
            } catch (error) {
                if (error.message.includes('404')) {
                    console.log(`❌ ${modelName} - No disponible`);
                } else if (error.message.includes('API key')) {
                    console.log(`⚠️  ${modelName} - Problema con API Key`);
                } else {
                    console.log(`⚠️  ${modelName} - Error: ${error.message.substring(0, 50)}...`);
                }
            }
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('\n💡 Usa el primer modelo marcado con ✅ en tu código\n');

    } catch (error) {
        console.error('❌ Error al listar modelos:', error.message);
    }
}

listModels();
