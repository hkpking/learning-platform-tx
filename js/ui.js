/**
 * @file ui.js
 * @description Centralizes DOM element selections and generic UI manipulation functions.
 */
import { AppState } from './state.js';

export const UI = {
    elements: {
        notification: document.getElementById('notification'),
        factionModal: { container: document.getElementById('faction-selection-modal') },
        restartModal: { container: document.getElementById('restart-confirm-modal'), confirmBtn: document.getElementById('confirm-restart-btn'), cancelBtn: document.getElementById('cancel-restart-btn') },
        deleteConfirmModal: { container: document.getElementById('delete-confirm-modal'), message: document.getElementById('delete-confirm-message'), confirmBtn: document.getElementById('confirm-delete-btn'), cancelBtn: document.getElementById('cancel-delete-btn') },
        leaderboardContainer: document.getElementById('leaderboard-container'),
        leaderboardList: document.getElementById('leaderboard-list'),
        landingView: document.getElementById('landing-view'),
        authView: document.getElementById('auth-view'),
        mainAppView: document.getElementById('main-app-view'),
        immersiveView: { container: document.getElementById('immersive-viewer-view'), title: document.getElementById('immersive-title'), content: document.getElementById('immersive-content'), closeBtn: document.getElementById('close-immersive-view-btn') },
        landing: { loginBtn: document.getElementById('new-login-btn'), startBtn: document.getElementById('new-start-btn'), subtitle: document.getElementById('subtitle'), scrollIndicator: document.getElementById('scroll-indicator'), },
        auth: { backToLandingBtn: document.getElementById('back-to-landing-btn'), form: document.getElementById('auth-form'), title: document.getElementById('form-title'), submitBtn: document.getElementById('submit-btn'), prompt: document.getElementById('prompt-text'), switchBtn: document.getElementById('switch-mode-btn'), authInput: document.getElementById('auth-input'), passwordInput: document.getElementById('password-input') },
        mainApp: { header: document.getElementById('main-header'), adminViewBtn: document.getElementById('admin-view-btn'), userGreeting: document.getElementById('user-greeting'), logoutBtn: document.getElementById('logout-btn'), restartBtn: document.getElementById('restart-btn'), categoryView: document.getElementById('category-selection-view'), categoryGrid: document.getElementById('categories-grid'), chapterView: document.getElementById('chapter-selection-view'), chapterTitle: document.getElementById('chapter-view-title'), chapterDesc: document.getElementById('chapter-view-desc'), chapterGrid: document.getElementById('chapters-grid'), backToCategoriesBtn: document.getElementById('back-to-categories-btn'), detailView: document.getElementById('chapter-detail-view'), sidebarHeader: document.getElementById('sidebar-header'), sidebarNav: document.getElementById('sidebar-nav-list'), contentArea: document.getElementById('content-area'), backToChaptersBtn: document.getElementById('back-to-chapters-btn'), },
        admin: { container: document.getElementById('admin-management-view'), breadcrumb: document.getElementById('admin-breadcrumb'), backToLearningBtn: document.getElementById('back-to-learning-btn'), categoryListView: document.getElementById('admin-category-list-view'), categoriesTableContainer: document.getElementById('admin-categories-table-container'), chapterListView: document.getElementById('admin-chapter-list-view'), chapterListTitle: document.getElementById('admin-chapter-list-title'), chaptersTableContainer: document.getElementById('admin-chapters-table-container'), sectionListView: document.getElementById('admin-section-list-view'), sectionListTitle: document.getElementById('admin-section-list-title'), sectionsTableContainer: document.getElementById('admin-sections-table-container'), blockEditorView: document.getElementById('admin-block-editor-view'), editorSectionTitle: document.getElementById('admin-editor-section-title'), blocksList: document.getElementById('admin-blocks-list'), addCategoryBtn: document.getElementById('admin-add-category-btn'), addChapterBtn: document.getElementById('admin-add-chapter-btn'), addSectionBtn: document.getElementById('admin-add-section-btn'), addNewBlockBtn: document.getElementById('admin-add-new-block-btn'), modal: { backdrop: document.getElementById('admin-modal-backdrop'), container: document.getElementById('form-modal'), form: document.getElementById('modal-form'), title: document.getElementById('modal-title'), saveBtn: document.getElementById('save-modal-btn'), cancelBtn: document.getElementById('cancel-modal-btn'), } },
    },
    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = "";
        this.elements.notification.classList.add(type, "show");
        setTimeout(() => this.elements.notification.classList.remove("show"), 3500);
    },
    renderLoading(c) { c.innerHTML = `<div class="flex justify-center items-center p-10"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div></div>`; },
    renderError(c, m) { c.innerHTML = `<div class="text-center p-10 text-red-400 text-lg">加载失败：${m}</div>`; },
    renderEmpty(c, m) { c.innerHTML = `<div class="text-center p-10 text-gray-500 text-lg">${m}</div>`; },
    switchTopLevelView(view) {
        document.querySelectorAll('#app-container > .view').forEach(v => v.classList.remove('active'));
        this.elements.leaderboardContainer.style.display = 'none';
        if (view === 'landing') this.elements.landingView.classList.add('active');
        else if (view === 'auth') this.elements.authView.classList.add('active');
        else if (view === 'main') {
            this.elements.mainAppView.classList.add('active');
            this.elements.leaderboardContainer.style.display = 'block';
            this.switchCourseView(AppState.current.courseView);
        } else if (view === 'immersive') this.elements.immersiveView.container.classList.add('active');
        AppState.current.topLevelView = view;
    },
    switchCourseView(viewName) {
        const main = this.elements.mainAppView;
        main.querySelector('#category-selection-view').classList.remove('active');
        main.querySelector('#chapter-selection-view').classList.remove('active');
        main.querySelector('#chapter-detail-view').classList.remove('active');
        main.querySelector('#admin-management-view').classList.remove('active');
        if (viewName === 'admin-management') main.querySelector('#admin-management-view').classList.add('active');
        else main.querySelector('#' + viewName + '-view').classList.add('active');
        AppState.current.courseView = viewName;
    },
};
