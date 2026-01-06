'use client';

/**
 * MissionGate - Componente que valida la misión antes de permitir jugar
 * 
 * Verifica:
 * 1. Si la misión está activa
 * 2. Si está en rango de fechas
 * 3. Cuántos intentos le quedan
 * 4. Si debe mostrar teoría
 * 
 * Solo permite pasar al juego si todas las validaciones son exitosas
 */

import { useState, useEffect } from 'react';
import { MissionValidator } from '@/lib/games/MissionValidator';
import TheoryModal from './TheoryModal';
import { AlertCircle, Lock, Calendar, Target, BookOpen } from 'lucide-react';

interface MissionGateProps {
    studentId: string;
    availabilityId: string;
    onMissionValidated: (data: {
        topicId: string;
        gameTypeId: string;
        canPlay: boolean;
    }) => void;
    children: React.ReactNode;
}

export default function MissionGate({
    studentId,
    availabilityId,
    onMissionValidated,
    children
}: MissionGateProps) {
    const [isValidating, setIsValidating] = useState(true);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [showTheory, setShowTheory] = useState(false);
    const [hasSeenTheory, setHasSeenTheory] = useState(false);

    useEffect(() => {
        validateMission();
    }, [studentId, availabilityId]);

    const validateMission = async () => {
        setIsValidating(true);

        try {
            console.log('[MissionGate] Validating mission...');
            const result = await MissionValidator.validateMission(studentId, availabilityId);

            setValidationResult(result);

            if (result.canPlay) {
                // Si debe mostrar teoría y no la ha visto aún
                if (result.showTheory && !hasSeenTheory) {
                    setShowTheory(true);
                } else {
                    // Puede jugar directamente
                    onMissionValidated({
                        topicId: result.availability.topic_id,
                        gameTypeId: result.availability.game_type_id,
                        canPlay: true
                    });
                }
            } else {
                // No puede jugar
                onMissionValidated({
                    topicId: result.availability?.topic_id || '',
                    gameTypeId: result.availability?.game_type_id || '',
                    canPlay: false
                });
            }
        } catch (error) {
            console.error('[MissionGate] Error validating mission:', error);
            setValidationResult({
                isValid: false,
                canPlay: false,
                reason: 'Error al validar la misión'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleTheoryContinue = () => {
        setShowTheory(false);
        setHasSeenTheory(true);

        // Ahora sí puede jugar
        if (validationResult?.availability) {
            onMissionValidated({
                topicId: validationResult.availability.topic_id,
                gameTypeId: validationResult.availability.game_type_id,
                canPlay: true
            });
        }
    };

    const handleTheoryClose = () => {
        setShowTheory(false);
        // Si cierra sin completar, no puede jugar
        onMissionValidated({
            topicId: validationResult?.availability?.topic_id || '',
            gameTypeId: validationResult?.availability?.game_type_id || '',
            canPlay: false
        });
    };

    // Loading state
    if (isValidating) {
        return (
            <div className="flex items-center justify-center min-h-[600px] bg-slate-900 rounded-xl">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-white font-bold text-lg">Validando misión...</p>
                    <p className="text-slate-400 text-sm mt-2">Verificando disponibilidad y requisitos</p>
                </div>
            </div>
        );
    }

    // Error or can't play
    if (!validationResult?.canPlay) {
        return (
            <div className="flex items-center justify-center min-h-[600px] bg-slate-900 rounded-xl">
                <div className="text-center max-w-md p-8">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        {validationResult?.reason?.includes('fecha') ? (
                            <Calendar className="w-10 h-10 text-red-600 dark:text-red-400" />
                        ) : validationResult?.reason?.includes('intentos') ? (
                            <Target className="w-10 h-10 text-red-600 dark:text-red-400" />
                        ) : (
                            <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
                        )}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                        Misión No Disponible
                    </h3>

                    <p className="text-slate-300 mb-6">
                        {validationResult?.reason || 'No puedes acceder a esta misión en este momento'}
                    </p>

                    {validationResult?.attemptsUsed !== undefined && (
                        <div className="bg-slate-800 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Intentos usados:</span>
                                <span className="text-white font-bold">
                                    {validationResult.attemptsUsed} / {validationResult.availability?.max_attempts || 0}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Show theory modal if needed
    if (showTheory && validationResult?.theoryContent) {
        return (
            <TheoryModal
                isOpen={showTheory}
                theoryContent={validationResult.theoryContent}
                topicTitle={validationResult.availability?.topics?.title || 'Tema'}
                onClose={handleTheoryClose}
                onContinue={handleTheoryContinue}
            />
        );
    }

    // Mission validated and theory seen (if required) - render game
    if (validationResult?.canPlay && (!validationResult.showTheory || hasSeenTheory)) {
        return (
            <>
                {/* Info banner */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                                Intentos restantes: {validationResult.attemptsRemaining} de {validationResult.availability?.max_attempts}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Render game */}
                {children}
            </>
        );
    }

    return null;
}
