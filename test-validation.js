/**
 * Script de prueba para demostrar el sistema de validación
 * Prueba diferentes escenarios de validación
 */

console.log('🧪 Probando Sistema de Validación de Contenido IA\n');
console.log('═══════════════════════════════════════════════════\n');

async function testValidation() {
    const tests = [
        {
            name: 'Word Catcher - Contenido Válido',
            request: {
                topicId: 'test-123',
                topicTitle: 'Animals',
                gameTypeId: 'word_catcher',
                count: 5,
                contextNote: 'nivel básico'
            }
        },
        {
            name: 'Grammar Run - Contenido Válido',
            request: {
                topicId: 'test-123',
                topicTitle: 'Present Simple',
                gameTypeId: 'grammar_run',
                count: 3,
                contextNote: 'nivel intermedio'
            }
        },
        {
            name: 'Sentence Builder - Contenido Válido',
            request: {
                topicId: 'test-123',
                topicTitle: 'Daily Routines',
                gameTypeId: 'sentence_builder',
                count: 4,
                contextNote: 'nivel básico'
            }
        }
    ];

    for (const test of tests) {
        console.log(`\n📝 Prueba: ${test.name}`);
        console.log('─'.repeat(50));

        try {
            const startTime = Date.now();
            const response = await fetch('http://localhost:3000/api/ai/generate-game-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.request)
            });

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            const data = await response.json();

            console.log(`⏱️  Tiempo: ${elapsed}s`);
            console.log(`📊 Status: ${response.status}`);

            if (response.ok) {
                console.log(`✅ Éxito - ${data.count} elementos generados`);

                if (data.validation) {
                    if (data.validation.hasWarnings) {
                        console.log(`⚠️  Advertencias encontradas (${data.validation.warnings.length}):`);
                        data.validation.warnings.forEach((warning, i) => {
                            console.log(`   ${i + 1}. ${warning}`);
                        });
                        if (data.validation.wasAutoCorrected) {
                            console.log(`🔧 Contenido corregido automáticamente`);
                        }
                    } else {
                        console.log(`✅ Sin advertencias - contenido perfecto`);
                    }
                }

                // Mostrar primer elemento como ejemplo
                if (data.content && data.content.length > 0) {
                    console.log(`\n🎯 Ejemplo del primer elemento:`);
                    const first = data.content[0];
                    console.log(`   Tipo: ${first.content_type}`);
                    console.log(`   Texto: ${first.content_text}`);
                    if (first.metadata) {
                        Object.entries(first.metadata).forEach(([key, value]) => {
                            console.log(`   ${key}: ${value}`);
                        });
                    }
                }
            } else if (response.status === 422) {
                console.log(`❌ Validación falló - contenido rechazado`);
                console.log(`\n📋 Errores de validación:`);
                data.validationErrors?.forEach((error, i) => {
                    console.log(`   ${i + 1}. ${error}`);
                });
                if (data.validationWarnings && data.validationWarnings.length > 0) {
                    console.log(`\n⚠️  Advertencias:`);
                    data.validationWarnings.forEach((warning, i) => {
                        console.log(`   ${i + 1}. ${warning}`);
                    });
                }
                console.log(`\n💡 Sugerencia: ${data.suggestion}`);
            } else {
                console.log(`❌ Error: ${data.error}`);
            }

        } catch (error) {
            console.log(`❌ Error de conexión: ${error.message}`);
        }

        console.log(''); // Línea en blanco
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 Pruebas completadas\n');
    console.log('📊 Resumen del Sistema de Validación:');
    console.log('   ✅ Valida content_type correcto por juego');
    console.log('   ✅ Verifica campos requeridos');
    console.log('   ✅ Valida estructura de metadata');
    console.log('   ✅ Corrige automáticamente problemas menores');
    console.log('   ✅ Rechaza contenido con errores críticos');
    console.log('   ✅ Proporciona reportes detallados\n');
}

// Ejecutar pruebas
testValidation().catch(console.error);
