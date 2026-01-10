/**
 * Game Content Loader Utilities
 * Handles loading and preparing game content with correct answers and distractors
 */

import type { GameContent, MissionConfig } from '@/types/game.types';

export interface PreparedGameItem {
    content_id: string;
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
}

export interface GameDataset {
    items: PreparedGameItem[];
    correctCount: number;
    distractorCount: number;
    totalCount: number;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Builds the final game dataset with correct items and distractors
 * 
 * @param content - All available game content from the API
 * @param missionConfig - Mission configuration with content constraints
 * @returns Prepared and shuffled game dataset
 */
export function buildGameDataset(
    content: GameContent[],
    missionConfig: MissionConfig
): GameDataset {
    const { items: totalItems, distractors_percent } = missionConfig.content_constraints;

    // Separate correct and distractor items
    const correctItems = content.filter(item => item.is_correct);
    const distractorItems = content.filter(item => !item.is_correct);

    // Calculate how many of each type we need
    const targetDistractorCount = Math.floor(totalItems * (distractors_percent / 100));
    const targetCorrectCount = totalItems - targetDistractorCount;

    console.log('[GameLoader] Building dataset:', {
        totalItems,
        distractors_percent,
        targetCorrectCount,
        targetDistractorCount,
        availableCorrect: correctItems.length,
        availableDistractors: distractorItems.length
    });

    // Build the final set
    let finalCorrect: GameContent[] = [];
    let finalDistractors: GameContent[] = [];

    // Get correct items
    if (correctItems.length >= targetCorrectCount) {
        // We have enough correct items, shuffle and take what we need
        finalCorrect = shuffle(correctItems).slice(0, targetCorrectCount);
    } else {
        // Not enough correct items, use all available
        finalCorrect = [...correctItems];
        console.warn('[GameLoader] Not enough correct items. Requested:', targetCorrectCount, 'Available:', correctItems.length);
    }

    // Get distractor items
    if (distractorItems.length >= targetDistractorCount) {
        // We have enough distractors, shuffle and take what we need
        finalDistractors = shuffle(distractorItems).slice(0, targetDistractorCount);
    } else if (distractorItems.length > 0) {
        // We have some distractors but not enough, use all available
        finalDistractors = [...distractorItems];

        // Fill remaining slots with correct items if available
        const remaining = targetDistractorCount - distractorItems.length;
        const extraCorrect = correctItems
            .filter(item => !finalCorrect.includes(item))
            .slice(0, remaining);

        finalCorrect = [...finalCorrect, ...extraCorrect];

        console.warn('[GameLoader] Not enough distractors. Requested:', targetDistractorCount, 'Available:', distractorItems.length);
    } else {
        // No distractors available, fill with more correct items
        const extraCorrect = correctItems
            .filter(item => !finalCorrect.includes(item))
            .slice(0, targetDistractorCount);

        finalCorrect = [...finalCorrect, ...extraCorrect];

        console.warn('[GameLoader] No distractors available. Using only correct items.');
    }

    // Combine and shuffle
    const allItems: PreparedGameItem[] = [
        ...finalCorrect.map(item => ({
            content_id: item.content_id,
            content_text: item.content_text,
            is_correct: item.is_correct,
            image_url: item.image_url,
            metadata: item.metadata
        })),
        ...finalDistractors.map(item => ({
            content_id: item.content_id,
            content_text: item.content_text,
            is_correct: item.is_correct,
            image_url: item.image_url,
            metadata: item.metadata
        }))
    ];

    const shuffledItems = shuffle(allItems);

    const dataset: GameDataset = {
        items: shuffledItems,
        correctCount: finalCorrect.length,
        distractorCount: finalDistractors.length,
        totalCount: shuffledItems.length
    };

    console.log('[GameLoader] Dataset built:', {
        totalItems: dataset.totalCount,
        correctItems: dataset.correctCount,
        distractorItems: dataset.distractorCount,
        ratio: `${Math.round((dataset.distractorCount / dataset.totalCount) * 100)}% distractors`
    });

    return dataset;
}

/**
 * Validates that we have enough content to run the game
 */
export function validateGameContent(
    content: GameContent[],
    missionConfig: MissionConfig
): { valid: boolean; error?: string } {
    const { items: requiredItems } = missionConfig.content_constraints;

    if (content.length === 0) {
        return {
            valid: false,
            error: 'No hay contenido disponible para este tema. Agrega palabras/preguntas primero.'
        };
    }

    const correctItems = content.filter(item => item.is_correct);

    if (correctItems.length === 0) {
        return {
            valid: false,
            error: 'No hay ítems correctos disponibles. Marca al menos algunos ítems como correctos.'
        };
    }

    if (content.length < requiredItems) {
        return {
            valid: false,
            error: `Se requieren al menos ${requiredItems} ítems, pero solo hay ${content.length} disponibles.`
        };
    }

    return { valid: true };
}

/**
 * Gets a random item from the dataset (for spawning)
 */
export function getRandomItem(dataset: GameDataset): PreparedGameItem | null {
    if (dataset.items.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * dataset.items.length);
    return dataset.items[randomIndex];
}

/**
 * Gets items in sequence (useful for non-random spawning)
 */
export function* itemIterator(dataset: GameDataset): Generator<PreparedGameItem> {
    let index = 0;
    while (true) {
        yield dataset.items[index % dataset.items.length];
        index++;
    }
}

/**
 * Card interface for ImageMatch game
 */
export interface ImageMatchCard {
    cardId: string;         // único por carta
    pairId: string;         // mismo para las 2 cartas del par
    kind: 'image' | 'word';
    prompt: string;         // palabra o texto corto
    imageUrl?: string | null;
    contentId: string;      // game_content.content_id del par
}

/**
 * Builds card pairs for ImageMatch game
 * 
 * @param content - All available game content (should have content_type = 'image-word-pair')
 * @param grid - Grid configuration with cols and rows
 * @param shuffle - Whether to shuffle the cards
 * @returns Array of cards ready for the Scene
 */
export function buildImageMatchCards(
    content: GameContent[],
    grid: { cols: number; rows: number },
    shuffle: boolean = true
): ImageMatchCard[] {
    // Calculate pairs needed
    const pairsNeeded = (grid.cols * grid.rows) / 2;

    console.log('[ImageMatch] Building cards:', {
        grid: `${grid.cols}x${grid.rows}`,
        pairsNeeded,
        totalCards: grid.cols * grid.rows,
        availableContent: content.length
    });

    // Filter content: prefer image-word-pair, fallback to any with image_url
    const imageWordPairs = content.filter(item => 
        item.content_type === 'image-word-pair' && item.is_correct
    );

    // Fallback: use any content with image_url and content_text
    const fallbackPairs = content.filter(item => 
        item.is_correct && 
        item.image_url && 
        item.content_text &&
        !imageWordPairs.includes(item)
    );

    const availablePairs = [...imageWordPairs, ...fallbackPairs];

    if (availablePairs.length === 0) {
        console.warn('[ImageMatch] No image-word-pair content found. Using fallback.');
        // Fallback: use any correct content
        const anyCorrect = content.filter(item => item.is_correct);
        if (anyCorrect.length === 0) {
            throw new Error('[ImageMatch] No correct content available for ImageMatch');
        }
        return buildCardsFromContent(anyCorrect.slice(0, pairsNeeded), grid, shuffle);
    }

    // Select pairsNeeded pairs (random/shuffle)
    const selectedPairs = shuffle
        ? shuffleArray(availablePairs).slice(0, pairsNeeded)
        : availablePairs.slice(0, pairsNeeded);

    if (selectedPairs.length < pairsNeeded) {
        console.warn(
            `[ImageMatch] Only ${selectedPairs.length} pairs available, but ${pairsNeeded} needed. ` +
            `Grid will have empty slots or will be adjusted.`
        );
    }

    // Build cards from selected pairs
    return buildCardsFromContent(selectedPairs, grid, shuffle);
}

/**
 * Helper: Builds cards array from content items
 */
function buildCardsFromContent(
    contentItems: GameContent[],
    grid: { cols: number; rows: number },
    shuffle: boolean
): ImageMatchCard[] {
    const cards: ImageMatchCard[] = [];

    contentItems.forEach((content, index) => {
        const pairId = `pair-${content.content_id}`;

        // Carta A: tipo image, front = image
        cards.push({
            cardId: `card-${content.content_id}-image`,
            pairId: pairId,
            kind: 'image',
            prompt: content.content_text,
            imageUrl: content.image_url || null,
            contentId: content.content_id,
        });

        // Carta B: tipo word, front = palabra
        cards.push({
            cardId: `card-${content.content_id}-word`,
            pairId: pairId,
            kind: 'word',
            prompt: content.content_text,
            imageUrl: null, // Word cards don't need image
            contentId: content.content_id,
        });
    });

    // Shuffle cards if enabled
    const finalCards = shuffle ? shuffleArray(cards) : cards;

    console.log('[ImageMatch] Cards built:', {
        totalCards: finalCards.length,
        pairs: contentItems.length,
        shuffled: shuffle
    });

    return finalCards;
}

/**
 * Shuffles an array (reusable helper)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
