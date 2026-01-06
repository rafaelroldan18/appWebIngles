/**
 * Game Type Mapping Utilities
 * Mapea entre los nombres de juegos usados en la UI y los IDs de la base de datos
 */

export type UIGameType = 'word-catcher' | 'grammar-run' | 'sentence-builder' | 'image-match' | 'city-explorer';
export type DBGameTypeId = 'word_catcher' | 'grammar_run' | 'sentence_builder' | 'image_match' | 'city_explorer';

/**
 * Mapeo de nombres de UI a IDs de base de datos
 */
export const UI_TO_DB_GAME_TYPE: Record<UIGameType, DBGameTypeId> = {
    'word-catcher': 'word_catcher',
    'grammar-run': 'grammar_run',
    'sentence-builder': 'sentence_builder',
    'image-match': 'image_match',
    'city-explorer': 'city_explorer',
};

/**
 * Mapeo de IDs de base de datos a nombres de UI
 */
export const DB_TO_UI_GAME_TYPE: Record<DBGameTypeId, UIGameType> = {
    'word_catcher': 'word-catcher',
    'grammar_run': 'grammar-run',
    'sentence_builder': 'sentence-builder',
    'image_match': 'image-match',
    'city_explorer': 'city-explorer',
};

/**
 * Convierte un nombre de juego de UI a ID de base de datos
 */
export function uiGameTypeToDb(uiType: UIGameType): DBGameTypeId {
    return UI_TO_DB_GAME_TYPE[uiType];
}

/**
 * Convierte un ID de base de datos a nombre de juego de UI
 */
export function dbGameTypeToUi(dbType: DBGameTypeId): UIGameType {
    return DB_TO_UI_GAME_TYPE[dbType];
}

/**
 * Valida si un string es un tipo de juego válido de UI
 */
export function isValidUIGameType(type: string): type is UIGameType {
    return type in UI_TO_DB_GAME_TYPE;
}

/**
 * Valida si un string es un ID de juego válido de base de datos
 */
export function isValidDBGameTypeId(type: string): type is DBGameTypeId {
    return type in DB_TO_UI_GAME_TYPE;
}
