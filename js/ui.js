/**
 * @file ui.js
 * @description Centralizes DOM element selections and generic UI manipulation functions.
 * @version 6.0.0 - [REFACTOR] Added selectors for the new landing view.
 */
import { AppState } from './state.js';

export const UI = {
    elements: {
        // --- Global Modals & Notifications ---
        notification: document.getElementById('notification'),
        factionModal: { container: document.getElementById('faction-selection-modal') },
        restartModal: { container: document.getElementById('restart-confirm-modal'), confirmBtn: document.getElementById('confirm-restart-btn'), cancelBtn: document.getElementById('cancel-restart-btn') },
        deleteConfirmModal: { container: document.getElementById('delete-confirm-modal'), message: document.getElementById('delete-confirm-message'), confirmBtn: document.getElementById('confirm-delete-btn'), cancelBtn: document.getElementById('cancel-delete-btn') },

        // --- Top-Level View Containers ---
        landingView: document.getElementById('landing-view'),
        gameLobbyView: document.getElementById('game-lobby-view'),
        authView: document.getElementById('auth-view'),
        mainAppView: document.getElementById('main-app-view'),
        adminView: document.getElementById('admin-view'),
        profileView: document.getElementById('profile-view'),
        immersiveView: { container: document.getElementById('immersive-viewer-view'), title: document.getElementById('immersive-title'), content: document.getElementById('immersive-content'), closeBtn: document.getElementById('close-immersive-view-btn') },
        
        // --- [NEW] Landing View Elements ---
        landing: {
            loginBtn: document.getElementById('landing-login-btn'),
            startJourneyBtn: document.getElementById('start-journey-btn'),
            subtitle: document.getElementById('subtitle'),
        },

        // --- Game Lobby Elements ---
        lobby: {
            playerInfo: document.getElementById('lobby-player-info'),
            avatar: document.getElementById('lobby-avatar'),
            playerName: document.getElementById('lobby-player-name'),
            playerLevel: document.getElementById('lobby-player-level'),
            logoutBtn: document.getElementById('logout-btn-lobby'),
            bottomNav: document.getElementById('lobby-bottom-nav'),
            adminNavBtn: document.querySelector('.lobby-nav-btn[data-action="show-admin"]'),
            plotTaskBtn: document.getElementById('plot-task-btn'),
            factionChallengeBtn: document.getElementById('faction-challenge-btn'),
            leaderboardTabs: document.querySelectorAll('#leaderboard-panel-lobby .tab-btn'),
            personalBoard: document.getElementById('leaderboard-content-personal'),
            factionBoard: document.getElementById('leaderboard-content-faction'),
        },

        // --- Auth View Elements ---
        auth: {
            backToLandingBtn: document.getElementById('back-to-landing-btn'),
            form: document.getElementById('auth-form'),
            title: document.getElementById('form-title'),
            submitBtn: document.getElementById('submit-btn'),
            prompt: document.getElementById('prompt-text'),
            switchBtn: document.getElementById('switch-mode-btn'),
            authInput: document.getElementById('auth-input'),
            passwordInput: document.getElementById('password-input'),
            fullNameInputContainer: document.getElementById('full-name-input-container'),
            fullNameInput: document.getElementById('full-name-input')
        },

        // --- Main App (Learning) Elements ---
        mainApp: { 
            backToHubBtn: document.getElementById('back-to-hub-btn-from-main'),
            profileViewBtn: document.getElementById('profile-view-btn'), 
            adminViewBtn: document.getElementById('main-admin-view-btn'), 
            userGreeting: document.getElementById('user-greeting'), 
            restartBtn: document.getElementById('restart-btn'), 
            categoryView: document.getElementById('category-selection-view'), 
            categoryGrid: document.getElementById('categories-grid'), 
            chapterView: document.getElementById('chapter-selection-view'), 
            chapterTitle: document.getElementById('chapter-view-title'), 
            chapterDesc: document.getElementById('chapter-view-desc'), 
            chapterGrid: document.getElementById('chapters-grid'), 
            backToCategoriesBtn: document.getElementById('back-to-categories-btn'), 
            detailView: document.getElementById('chapter-detail-view'), 
            sidebarHeader: document.getElementById('sidebar-header'), 
            sidebarNav: document.getElementById('sidebar-nav-list'), 
            contentArea: document.getElementById('content-area'), 
            backToChaptersBtn: document.getElementById('back-to-chapters-btn'), 
        },

        // --- Profile View Elements ---
        profile: {
            content: document.getElementById('profile-content'),
            backToMainAppBtn: document.getElementById('back-to-main-app-btn')
        },
        
        // --- Admin View Elements ---
        admin: {
            container: document.getElementById('admin-view'),
            breadcrumb: document.getElementById('admin-breadcrumb'),
            backToLobbyBtn: document.getElementById('admin-back-to-lobby-btn'),
            adminNav: document.querySelector('#admin-view nav'),
            categoryListView: document.getElementById('admin-category-list-view'),
            categoriesTableContainer: document.getElementById('admin-categories-table-container'),
            addCategoryBtn: document.getElementById('admin-add-category-btn'),
            chapterListView: document.getElementById('admin-chapter-list-view'),
            chapterListTitle: document.getElementById('admin-chapter-list-title'),
            chaptersTableContainer: document.getElementById('admin-chapters-table-container'),
            addChapterBtn: document.getElementById('admin-add-chapter-btn'),
            sectionListView: document.getElementById('admin-section-list-view'),
            sectionListTitle: document.getElementById('admin-section-list-title'),
            sectionsTableContainer: document.getElementById('admin-sections-table-container'),
            addSectionBtn: document.getElementById('admin-add-section-btn'),
            blockEditorView: document.getElementById('admin-block-editor-view'),
            editorSectionTitle: document.getElementById('admin-editor-section-title'),
            blocksList: document.getElementById('admin-blocks-list'),
            addNewBlockBtn: document.getElementById('admin-add-new-block-btn'),
            challengesListView: document.getElementById('admin-challenges-list-view'),
            challengesTableContainer: document.getElementById('admin-challenges-table-container'),
            addChallengeBtn: document.getElementById('admin-add-challenge-btn'),
            modal: {
                backdrop: document.getElementById('admin-modal-backdrop'),
                container: document.getElementById('form-modal'),
                form: document.getElementById('modal-form'),
                title: document.getElementById('modal-title'),
                saveBtn: document.getElementById('save-modal-btn'),
                cancelBtn: document.getElementById('cancel-modal-btn'),
            }
        },
    },
    showNotification(message, type = 'success') {
        const el = this.elements.notification;
        el.textContent = message;
        el.className = "";
        el.classList.add(type, "show");
        setTimeout(() => el.classList.remove("show"), 3500);
    },
    renderLoading(container) { container.innerHTML = `<div class="flex justify-center items-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div></div>`; },
    renderError(c, m) { c.innerHTML = `<div class="text-center p-10 text-red-400">${m}</div>`; },
    renderEmpty(c, m) { c.innerHTML = `<div class="text-center p-10 text-gray-500">${m}</div>`; },
    
    switchTopLevelView(view) {
        document.querySelectorAll('#app-container > .view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(view + '-view');
        if (targetView) {
            targetView.classList.add('active');
        }
        AppState.current.topLevelView = view;
    },

    switchCourseView(viewName) {
        const container = this.elements.mainAppView;
        container.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(viewName + '-view');
        if (targetView) {
            targetView.classList.add('active');
        }
        AppState.current.courseView = viewName;
    },
};
