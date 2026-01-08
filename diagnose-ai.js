/**
 * Script de diagnóstico para verificar la configuración del endpoint de IA
 */

console.log('🔍 Diagnóstico del Endpoint de IA\n');
console.log('═══════════════════════════════════════════════════\n');

async function diagnose() {
    console.log('1️⃣ Verificando que el servidor esté corriendo...');

    try {
        const healthCheck = await fetch('http://localhost:3000/api/health');
        if (healthCheck.ok) {
            console.log('   ✅ Servidor corriendo en http://localhost:3000\n');
        }
    } catch (error) {
        console.log('   ❌ Servidor no responde');
        console.log('   💡 Asegúrate de que "npm run dev" esté corriendo\n');
        return;
    }

    console.log('2️⃣ Probando el endpoint de IA...');

    const testRequest = {
        topicId: "test-123",
        topicTitle: "Animals",
        gameTypeId: "word_catcher",
        count: 3,
        contextNote: "nivel básico"
    };

    console.log('   📤 Enviando request de prueba...\n');

    try {
        const response = await fetch('http://localhost:3000/api/ai/generate-game-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testRequest)
        });

        console.log(`   📊 Status: ${response.status} ${response.statusText}\n`);

        const data = await response.json();

        if (response.ok) {
            console.log('   ✅ ¡Endpoint funcionando correctamente!\n');
            console.log('   📝 Contenido generado:', data.count, 'elementos\n');
            console.log('═══════════════════════════════════════════════════');
            console.log('✨ Todo está configurado correctamente');
            console.log('El sistema está listo para usar\n');
        } else {
            console.log('   ❌ Error en el endpoint\n');
            console.log('   📋 Detalles del error:');
            console.log('   ', JSON.stringify(data, null, 2));
            console.log('\n═══════════════════════════════════════════════════');

            if (data.error && data.error.includes('GEMINI_API_KEY')) {
                console.log('\n🔑 PROBLEMA DETECTADO: API Key no configurada\n');
                console.log('SOLUCIÓN:');
                console.log('1. Obtén tu API Key de Gemini:');
                console.log('   https://aistudio.google.com/app/apikey\n');
                console.log('2. Abre el archivo .env en la raíz del proyecto\n');
                console.log('3. Agrega esta línea:');
                console.log('   GEMINI_API_KEY=tu_clave_aqui\n');
                console.log('4. IMPORTANTE: Reinicia el servidor:');
                console.log('   - Presiona Ctrl+C en la terminal donde corre npm run dev');
                console.log('   - Ejecuta de nuevo: npm run dev\n');
                console.log('5. Vuelve a ejecutar este script para verificar\n');
            } else {
                console.log('\n⚠️  Error desconocido');
                console.log('Revisa los logs del servidor para más detalles\n');
            }
        }
    } catch (error) {
        console.log('   ❌ Error de conexión:', error.message);
        console.log('\n   💡 Posibles causas:');
        console.log('   - El servidor no está corriendo');
        console.log('   - El endpoint no existe');
        console.log('   - Problema de red\n');
    }
}

diagnose().catch(console.error);
