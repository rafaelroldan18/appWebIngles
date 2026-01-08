import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function findWorkingModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return console.error("❌ No hay API Key");

    const genAI = new GoogleGenerativeAI(apiKey);

    // Lista de modelos a probar en orden de preferencia
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-1.0-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite"
    ];

    console.log("🔍 Escaneando modelos con cuota disponible...\n");

    for (const modelName of modelsToTest) {
        try {
            process.stdout.write(`Prueba con ${modelName}... `);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            console.log("✅ ¡FUNCIONA!");
            console.log(`\n🏆 EL MODELO SELECCIONADO ES: ${modelName}`);
            process.exit(0); // Terminamos al encontrar el primero
        } catch (e) {
            if (e.message.includes("429")) {
                console.log("❌ Sin cuota (429)");
            } else if (e.message.includes("404")) {
                console.log("❌ No encontrado (404)");
            } else {
                console.log(`❌ Error: ${e.message.substring(0, 30)}...`);
            }
        }
    }

    console.log("\n⚠️ Ningún modelo tiene cuota activa actualmente.");
    console.log("Sugerencia: Revisa en Google AI Studio si tu cuenta tiene alguna restricción.");
}

findWorkingModel();
