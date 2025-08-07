/**
 * @file state.js
 * @description Manages the global state of the application.
 * [v2.3.1] Added state for active challenges.
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
    activeChallenges: [], // [NEW] Added state for active challenges
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
        challenges: [], // [NEW] Added state for admin challenges list
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
