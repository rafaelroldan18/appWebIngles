/**
 * Game Content Loader Utilities
 * Handles loading and preparing game content with correct answers and distractors
 */

import type { GameContent, MissionConfig, CityExplorerLocationMetadata, CityExplorerChallengeMetadata } from '@/types/game.types';

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
    ruleTag?: string;       // metadata.rule_tag
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
            ruleTag: content.metadata?.rule_tag
        });

        // Carta B: tipo word, front = palabra
        cards.push({
            cardId: `card-${content.content_id}-word`,
            pairId: pairId,
            kind: 'word',
            prompt: content.content_text,
            imageUrl: null, // Word cards don't need image
            contentId: content.content_id,
            ruleTag: content.metadata?.rule_tag
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

// ============================================
// GrammarRun Loader
// ============================================

import type { GrammarQuestion, GrammarOption, GrammarSentenceMetadata, GrammarOptionMetadata, SentenceBuilderMetadata, SentenceBuilderWordMetadata } from '@/types/game.types';

/**
 * Loads and builds grammar questions from game_content
 * 
 * Structure:
 * - content_type = 'sentence' → pregunta
 * - content_type = 'option' → opciones (relacionadas por metadata.parent_sentence_id)
 * 
 * @param content - All game content from the API
 * @returns Array of GrammarQuestion objects ready for the game
 */
/**
 * Loads and builds grammar questions from game_content
 * 
 * Structure:
 * - content_type = 'sentence' → pregunta
 * - content_type = 'option' → opciones (relacionadas por metadata.parent_sentence_id)
 * - Metadata format (alternative): some sentences have options embedded in metadata (correct_option, wrong_options)
 * 
 * @param content - All game content from the API
 * @returns Array of GrammarQuestion objects ready for the game
 */
export function loadGrammarRunContent(content: GameContent[]): GrammarQuestion[] {
    console.log('[GrammarRun] Loading content:', {
        totalContent: content.length,
        sentences: content.filter(c => c.content_type === 'sentence').length,
        options: content.filter(c => c.content_type === 'option').length
    });

    const sentences = content.filter(c => c.content_type === 'sentence');
    const options = content.filter(c => c.content_type === 'option');
    const questions: GrammarQuestion[] = [];

    for (const sentence of sentences) {
        const metadata = sentence.metadata as GrammarSentenceMetadata | undefined;

        // Validate sentence metadata - support both standard and embedded formats
        const hasEmbedded = metadata?.correct_option && (metadata?.wrong_options?.length || 0) > 0;
        const isGrammarKind = metadata?.item_kind === 'grammar_question';

        if (!metadata || (!isGrammarKind && !hasEmbedded)) {
            console.warn(`[GrammarRun] Sentence ${sentence.content_id} missing valid metadata or embedded options`);
            continue;
        }

        if (!metadata.correct_option) {
            console.warn(`[GrammarRun] Sentence ${sentence.content_id} missing correct_option in metadata`);
            continue;
        }

        // 1. Try to find separate options
        let grammarOptions: GrammarOption[] = options
            .filter(opt => {
                const optMeta = opt.metadata as GrammarOptionMetadata | undefined;
                return optMeta?.parent_sentence_id === sentence.content_id;
            })
            .map(opt => {
                const optMeta = opt.metadata as GrammarOptionMetadata | undefined;
                return {
                    optionId: opt.content_id,
                    optionText: opt.content_text,
                    isCorrect: opt.is_correct,
                    parentSentenceId: sentence.content_id,
                    order: optMeta?.order
                };
            });

        // 2. If no separate options, use embedded options from metadata
        if (grammarOptions.length === 0 && hasEmbedded) {
            console.log(`[GrammarRun] Using embedded options for sentence ${sentence.content_id}`);

            // Correct option
            grammarOptions.push({
                optionId: `${sentence.content_id}-opt-correct`,
                optionText: metadata.correct_option,
                isCorrect: true,
                parentSentenceId: sentence.content_id,
                order: 0
            });

            // Wrong options
            (metadata.wrong_options || []).forEach((text, idx) => {
                grammarOptions.push({
                    optionId: `${sentence.content_id}-opt-wrong-${idx}`,
                    optionText: text,
                    isCorrect: false,
                    parentSentenceId: sentence.content_id,
                    order: idx + 1
                });
            });
        }

        if (grammarOptions.length < 2) {
            console.warn(`[GrammarRun] Sentence ${sentence.content_id} has only ${grammarOptions.length} option(s), need at least 2`);
            continue;
        }

        // Validate: at least 1 correct option
        const correctCount = grammarOptions.filter(opt => opt.isCorrect).length;
        if (correctCount === 0) {
            console.warn(`[GrammarRun] Sentence ${sentence.content_id} has no correct option`);
            continue;
        }

        // Build GrammarQuestion
        const question: GrammarQuestion = {
            questionId: sentence.content_id,
            questionText: metadata.prompt || sentence.content_text, // Support prompt in metadata
            correctOption: metadata.correct_option,
            options: grammarOptions,
            explanation: metadata.explanation,
            ruleTag: metadata.rule_tag,
            level: metadata.level,
            order: metadata.order
        };

        questions.push(question);
    }

    // Sort questions by order if available
    questions.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return 0;
    });

    console.log('[GrammarRun] Questions built:', {
        totalQuestions: questions.length,
        questionsWithExplanation: questions.filter(q => q.explanation).length,
        questionsWithRuleTag: questions.filter(q => q.ruleTag).length
    });

    return questions;
}

/**
 * Validates grammar run content before loading
 */
export function validateGrammarRunContent(content: GameContent[]): { valid: boolean; error?: string } {
    const sentences = content.filter(c => c.content_type === 'sentence');
    const options = content.filter(c => c.content_type === 'option');

    if (sentences.length === 0) {
        return {
            valid: false,
            error: 'No hay preguntas (sentences) disponibles. Agrega al menos una pregunta.'
        };
    }

    // Check if we have valid questions (with either separate OR embedded options)
    let validQuestionCount = 0;

    for (const sentence of sentences) {
        const metadata = sentence.metadata as GrammarSentenceMetadata | undefined;

        // 1. Check separate options
        const separateOptions = options.filter(opt => {
            const optMeta = opt.metadata as GrammarOptionMetadata | undefined;
            return optMeta?.parent_sentence_id === sentence.content_id;
        });

        const hasValidSeparateOptions = separateOptions.length >= 2 &&
            separateOptions.some(opt => opt.is_correct);

        // 2. Check embedded options
        const hasEmbeddedOptions = metadata?.correct_option && (metadata?.wrong_options?.length || 0) > 0;

        if (hasValidSeparateOptions || hasEmbeddedOptions) {
            validQuestionCount++;
        }
    }

    if (validQuestionCount === 0) {
        return {
            valid: false,
            error: 'No hay preguntas con suficientes opciones válidas (se requiere 1 correcta y al menos 1 incorrecta).'
        };
    }

    return { valid: true };
}

// ============================================
// Sentence Builder Loader
// ============================================

export interface SentenceBuilderToken {
    id: string;
    text: string;
    isDistractor: boolean;
}

export interface SentenceBuilderItem {
    id: string; // content_id
    prompt: string;
    targetSentence: string;
    targetTokens: string[];
    acceptedVariants: string[][];
    tokens: SentenceBuilderToken[];
    explanation?: string;
    tags?: string[];
    distractors?: string[]; // Array de palabras distractoras opcionales
    difficulty?: 'easy' | 'medium' | 'hard';
    order?: number;
}

/**
 * Loads and builds Sentence Builder items
 */
export function loadSentenceBuilderContent(content: GameContent[]): SentenceBuilderItem[] {
    const sentences = content.filter(c => c.content_type === 'sentence');
    const words = content.filter(c => c.content_type === 'word');
    const items: SentenceBuilderItem[] = [];

    // console.log('[SentenceBuilder] Loading content...', { sentences: sentences.length, words: words.length });

    for (const s of sentences) {
        const meta = s.metadata as SentenceBuilderMetadata | undefined;
        // Relaxed Content Loading: We accept ANY sentence kind (builder, grammar_question, etc.) 
        // as long as it has text/tokens. Validating by kind restricts reusing content.

        let targetTokens = meta?.target_tokens || [];

        // Auto-generate tokens from content_text if missing (Generic Sentence Support)
        if (targetTokens.length === 0 && s.content_text) {
            // Simple split by space, removing basic punctuation from ends if needed?
            // For now, simple split is robust enough for basic sentences
            targetTokens = s.content_text.trim().split(/\s+/);
        }

        // Must have tokens to be playable
        if (targetTokens.length === 0) {
            console.warn(`[SentenceBuilder] Item ${s.content_id} has no text or tokens`);
            continue;
        }

        // 1. Find child words (tokens)
        const childWords = words.filter(w => {
            const wMeta = w.metadata as SentenceBuilderWordMetadata | undefined;
            return wMeta?.parent_sentence_id === s.content_id;
        });

        let tokens: SentenceBuilderToken[] = [];

        if (childWords.length > 0) {
            // Priority: Explicit Child Words linked in DB
            tokens = childWords.map(w => ({
                id: w.content_id,
                text: w.content_text,
                isDistractor: !!(w.metadata as SentenceBuilderWordMetadata)?.is_distractor
            }));
        } else {
            // Fallback: Auto-generate tokens from target_tokens if no explicit words found
            tokens = targetTokens.map((token, idx) => ({
                id: `${s.content_id}-auto-${idx}`,
                text: token,
                isDistractor: false
            }));
        }

        // 2. Add Explicit Distractors from Metadata (Contract Requirement)
        if (meta?.distractors && Array.isArray(meta.distractors)) {
            const metaDistractors = meta.distractors.map((d, idx) => ({
                id: `${s.content_id}-dist-${idx}`,
                text: d,
                isDistractor: true
            }));
            tokens.push(...metaDistractors);
        }

        items.push({
            id: s.content_id,
            prompt: meta?.prompt || 'Arrange the sentence',
            targetSentence: targetTokens.join(' '),
            targetTokens: targetTokens,
            acceptedVariants: meta?.accepted_variants || [],
            tokens: tokens,
            explanation: meta?.explanation,
            tags: meta?.tags,
            order: meta?.order
        });
    }

    // Sort by order
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return items;
}

export function validateSentenceBuilderContent(content: GameContent[]): { valid: boolean; error?: string } {
    const items = loadSentenceBuilderContent(content);
    if (items.length === 0) {
        return { valid: false, error: 'No se encontraron oraciones válidas para Sentence Builder (asegúrate de que tengan item_kind="builder").' };
    }
    return { valid: true };
}

// ============================================
// City Explorer Loading Logic
// ============================================

export interface CityExplorerOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface CityExplorerChallenge {
    id: string;
    prompt: string;
    kind: 'mcq' | 'input';
    options: CityExplorerOption[];
    correctOptionId?: string;
    explanation?: string;
    ruleTag?: string;
}

export interface CityExplorerLocationItem {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    emoji: string;
    challenge?: CityExplorerChallenge;
}

export interface CityExplorerMapData {
    checkpoints: CityExplorerLocationItem[];
    config?: any;
}

export function loadCityExplorerContent(content: GameContent[]): CityExplorerLocationItem[] {
    const locations = content.filter(c => c.content_type === 'location');
    const sentences = content.filter(c => c.content_type === 'sentence');
    const options = content.filter(c => c.content_type === 'option');

    return locations.map(loc => {
        const meta = loc.metadata as any;

        // Extract location name from metadata (primary: location_name)
        const locationName = meta?.location_name || meta?.place_name || loc.content_text.substring(0, 15);

        // Default values if metadata missing
        const x = meta?.x || 100;
        const y = meta?.y || 100;
        const radius = meta?.radius || 50;

        // For City Explorer, the content_text IS the dialogue/challenge
        // We create a simple challenge using the content_text as the prompt
        const challenge: CityExplorerChallenge = {
            id: loc.content_id,
            prompt: loc.content_text, // The dialogue (e.g., "There isn't a police officer...")
            kind: 'mcq',
            options: [{ id: 'collect', text: 'Collect', isCorrect: true }],
            correctOptionId: 'collect',
            ruleTag: meta?.rule_tag
        };

        return {
            id: loc.content_id,
            name: locationName, // Use metadata.location_name (e.g., "Bank")
            x,
            y,
            radius,
            emoji: meta?.emoji || '📍',
            challenge
        };
    });
}

/**
 * Prepares the final payload for City Explorer Scene
 * Selects N checkpoints and formats data.
 */
export function prepareCityExplorerLevel(content: GameContent[], config: MissionConfig | undefined) {
    // 1. Try to load dedicated location content
    let items = loadCityExplorerContent(content);

    // 2. Fallback: If no dedicated locations, convert generic correct items to locations
    if (items.length === 0) {
        console.log('[CityExplorer] No dedicated locations found. Generating from generic content.');
        items = content
            .filter(c => c.is_correct)
            .map((item, index) => {
                // Infer Place Name from metadata (location_name is the primary field)
                const meta = item.metadata as any;
                let placeName = meta?.location_name || meta?.place_name || meta?.location || (meta?.tags && meta.tags[0]);

                // Fallback label if specific place name missing
                if (!placeName) placeName = `Location ${index + 1}`;

                return {
                    id: item.content_id,
                    name: placeName, // Map Label (e.g. "Restaurant")
                    x: 0, // Will be assigned by layout
                    y: 0,
                    radius: 60,
                    emoji: '📍',
                    challenge: {
                        id: item.content_id,
                        prompt: item.content_text, // Dialogue (e.g. "Can I have a menu?")
                        kind: 'mcq',
                        options: [{ id: 'collect', text: 'Collect', isCorrect: true }],
                        correctOptionId: 'collect',
                        ruleTag: meta?.rule_tag
                    }
                };
            });
    }

    // 2.5 Post-Process Items (Fix Long Names)
    // If the content text was a sentence (e.g. "Is there a hospital?"), extract the keyword for the Map Label.
    const placeKeywords = ['Park', 'School', 'Library', 'Hospital', 'Cinema', 'Theater', 'Store', 'Shop', 'Restaurant', 'Cafe', 'Bakery', 'Police', 'Station', 'Museum', 'Bank', 'Gym', 'Playground', 'Zoo', 'Hotel', 'Bar', 'Airport', 'Mall', 'Market', 'Pharmacy', 'Beach', 'Pool', 'Office', 'University', 'College', 'Doctor', 'Stadium'];

    items = items.map(item => {
        let name = item.name;

        // If name is a long sentence, try to extract a place name
        if (name.length > 15 || name.includes(' ')) {
            const found = placeKeywords.find(k => name.toLowerCase().includes(k.toLowerCase()));
            if (found) {
                name = found;
            } else if (name.length > 20) {
                // If really long and no keyword, default to generic
                name = 'LOCATION';
            }
        }

        return {
            ...item,
            name: name
        };
    });

    // 3. Select items (Limit)
    const limit = config?.city_explorer?.checkpoints_to_complete || 6;
    const selected = items.sort(() => 0.5 - Math.random()).slice(0, limit);

    if (selected.length === 0) {
        console.warn('[CityExplorer] No valid content available to build level.');
        return { checkpoints: [] };
    }

    // 4. Auto-Layout (Grid System) - Expanded for 1600x1200 World
    const margin = 120;
    const mapW = 1600; // Match World Width
    const mapH = 1200; // Match World Height

    // Define a denser grid (e.g. 6x5) to distribute points across the larger map
    const cols = 6;
    const rows = 5;
    const cellW = (mapW - 2 * margin) / cols;
    const cellH = (mapH - 2 * margin) / rows;

    const slots: { x: number, y: number }[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            slots.push({
                x: margin + c * cellW + cellW / 2,
                y: margin + r * cellH + cellH / 2
            });
        }
    }

    // Assign random slots to selected items
    const shuffledSlots = slots.sort(() => 0.5 - Math.random());

    selected.forEach((item, index) => {
        const slot = shuffledSlots[index % shuffledSlots.length];
        // Apply position with random jitter to look natural and use space
        item.x = slot.x + (Math.random() * 100 - 50);
        item.y = slot.y + (Math.random() * 100 - 50);
    });

    console.log(`[CityExplorer] Prepared Level: ${selected.length} checkpoints selected via fallback/layout.`);

    return {
        checkpoints: selected,
    };
}

