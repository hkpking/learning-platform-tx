/**
 * @file state.js
 * @description Manages the global state of the application.
 * [v1.2] Adds state for the faction leaderboard.
 */
export const AppState = {
    user: null, 
    profile: null,
    learningMap: {
        categories: [],
        flatStructure: [] 
    },
    leaderboard: [],
    factionLeaderboard: [],
    userProgress: { 
        completedBlocks: new Set(),
        awardedPointsBlocks: new Set()
    },
    current: { 
        topLevelView: 'landing',
        courseView: 'category-selection',
        categoryId: null, 
        chapterId: null, 
        sectionId: null, 
        blockId: null,
        activePlayer: null 
    },
    authMode: 'login',
    admin: {
        view: 'categories', 
        categories: [],
        selectedCategory: null,
        selectedChapter: null,
        selectedSection: null,
        editingItem: null,
        editingType: null
    }
};

export function resetUserProgressState() {
    AppState.userProgress = {
        completedBlocks: new Set(),
        awardedPointsBlocks: new Set()
    };
}
