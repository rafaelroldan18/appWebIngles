'use client';

import UniversalGameCanvas from '@/components/features/gamification/UniversalGameCanvas';

export default function DebugSentenceBuilder() {
    // Mock data based on what SentenceBuilderScene expects
    const mockContent = [
        {
            id: 'test-1',
            prompt: 'The cat is on the mat.',
            targetSentence: 'The cat is on the mat.',
            tokens: [
                { text: 'The', id: '1' },
                { text: 'cat', id: '2' },
                { text: 'is', id: '3' },
                { text: 'on', id: '4' },
                { text: 'the', id: '5' },
                { text: 'mat.', id: '6' }
            ],
            targetTokens: ['The', 'cat', 'is', 'on', 'the', 'mat.']
        }
    ];

    const missionConfig = {
        sentence_builder: {
            hint_cost: 5,
            max_hints_per_item: 3
        },
        ui: {
            show_timer: true,
            allow_undo: true,
            allow_clear: true,
            show_hint_button: true
        }
    };

    // Mock fetch for GameLoader
    if (typeof window !== 'undefined') {
        (window as any).fetch = async (url: string) => {
            if (url.includes('/api/games/content')) {
                return {
                    ok: true,
                    json: async () => mockContent
                } as any;
            }
            if (url.includes('/api/games/session/start')) {
                return {
                    ok: true,
                    json: async () => ({ session_id: 'test-session' })
                } as any;
            }
            return { ok: true, json: async () => ({}) } as any;
        };
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
            <h1 className="text-white text-2xl font-bold mb-4">Sentence Builder Debug</h1>
            <div className="w-full max-w-[1280px]">
                <UniversalGameCanvas
                    gameType="sentence-builder"
                    topicId="test-topic"
                    gameTypeId="sentence-builder"
                    studentId="test-student"
                    missionTitle="Validation Mission"
                    missionInstructions="Build the sentence correctly."
                    missionConfig={missionConfig as any}
                    onGameEnd={(result) => {
                        console.log('Game Ended Debug:', result);
                        alert('Game Session Ended! Redirecting...');
                        window.location.href = '/';
                    }}
                />
            </div>
        </div>
    );
}
