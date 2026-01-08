/**
 * Script de prueba mejorado para el endpoint de IA
 * Ejecutar DESPUÉS de reiniciar el servidor
 */

console.log('🧪 Probando endpoint de IA con Gemini...\n');

async function testAIEndpoint() {
    const requestBody = {
        topicId: "test-topic-123",
        topicTitle: "Animals",
        gameTypeId: "word_catcher",
        count: 5,
        contextNote: "nivel básico - principiantes"
    };

    console.log('📤 Request:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('\n⏳ Llamando a Gemini AI (puede tardar 10-15 segundos)...\n');

    const startTime = Date.now();

    try {
        const response = await fetch('http://localhost:3000/api/ai/generate-game-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⏱️  Tiempo de respuesta: ${elapsed}s\n`);
        console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ ¡ÉXITO! Contenido generado correctamente\n');
            console.log('═══════════════════════════════════════════════════\n');

            console.log(`📝 Total de elementos: ${data.count}\n`);

            if (data.content && data.content.length > 0) {
                console.log('🎯 Elementos generados:\n');
                data.content.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.content_text}`);
                    if (item.metadata?.translation) {
                        console.log(`      → Traducción: ${item.metadata.translation}`);
                    }
                    console.log(`      → Correcta: ${item.is_correct ? 'Sí ✓' : 'No ✗ (distractor)'}`);
                    console.log('');
                });
            }

            console.log('═══════════════════════════════════════════════════\n');
            console.log('🎉 El endpoint de IA funciona perfectamente!');
            console.log('✨ Siguiente paso: Integrar en GameContentManager.tsx\n');

        } else {
            console.log('❌ ERROR en la respuesta:\n');
            console.log(JSON.stringify(data, null, 2));
            console.log('\n');

            if (data.error && data.error.includes('GEMINI_API_KEY')) {
                console.log('⚠️  PROBLEMA: La API Key no está configurada correctamente\n');
                console.log('SOLUCIÓN:');
                console.log('1. Verifica que el archivo .env tiene: GEMINI_API_KEY=tu_clave');
                console.log('2. Asegúrate de haber REINICIADO el servidor (Ctrl+C y npm run dev)');
                console.log('3. La clave debe empezar con "AIza..."');
            } else if (response.status === 400) {
                console.log('⚠️  PROBLEMA: Request inválido');
                console.log('Verifica que todos los campos estén presentes');
            } else if (data.error && data.error.includes('JSON')) {
                console.log('⚠️  PROBLEMA: Gemini no devolvió un JSON válido');
                console.log('Esto puede pasar ocasionalmente. Intenta ejecutar el script de nuevo.');
            }
        }
    } catch (error) {
        console.log('❌ ERROR DE CONEXIÓN:\n');
        console.log(error.message);
        console.log('\n⚠️  POSIBLES CAUSAS:');
        console.log('1. El servidor no está corriendo → Ejecuta: npm run dev');
        console.log('2. El servidor está en otro puerto → Verifica la URL');
        console.log('3. Problema de red → Verifica tu conexión a internet');
    }
}

// Ejecutar la prueba
testAIEndpoint().catch(console.error);
