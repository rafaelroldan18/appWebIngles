import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY no encontrada en .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
 
        const models = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent('hi');
                console.log(`✅ ${modelName}: DISPONIBLE`);
            } catch (e) {
                console.log(`❌ ${modelName}: ${e.message.includes('404') ? 'No encontrado (404)' : e.message}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
