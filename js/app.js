/**
 * @file app.js
 * @description The main entry point for the application.
 * @version 4.0.0 - Implemented Game Lobby UI.
 */
import { AppState, resetUserProgressState } from './state.js';
import { UI } from './ui.js';
import { ApiService } from './services/api.js';
import { AuthView } from './views/auth.js';
import { CourseView } from './views/course.js';
import { AdminView } from './views/admin.js';
import { ProfileView } from './views/profile.js';
import { getFactionInfo } from './constants.js';

const App = {
    init() {
        this.bindEvents();
        ApiService.initialize();
        ApiService.db.auth.onAuthStateChange((_event, session) => {
            if (session && session.user) {
                this.handleLogin(session.user);
            } else {
                AppState.user = null;
                AppState.profile = null;
                resetUserProgressState();
                this.renderGameLobby(false);
                UI.switchTopLevelView('game-lobby');
            }
        });
    },

    bindEvents() {
        // Lobby Buttons
        UI.elements.lobby.playerInfo.addEventListener('click', () => {
            if (AppState.user) ProfileView.showProfileView();
            else UI.switchTopLevelView('auth');
        });
        UI.elements.lobby.logoutBtn.addEventListener('click', () => ApiService.signOut());
        UI.elements.lobby.plotTaskBtn.addEventListener('click', () => this.handlePlotTaskClick());
        
        // Bottom Nav
        UI.elements.lobby.bottomNav.addEventListener('click', (e) => {
            const button = e.target.closest('.lobby-nav-btn');
            if (!button) return;
            if (!AppState.user) { UI.switchTopLevelView('auth'); return; }
            
            const action = button.dataset.action;
            switch(action) {
                case 'show-all-quests':
                    UI.switchTopLevelView('main-app');
                    CourseView.showCategoryView();
                    break;
                case 'show-profile':
                    ProfileView.showProfileView();
                    break;
                case 'show-admin':
                    AdminView.showAdminView();
                    break;
            }
        });
        
        // Leaderboard Tabs
        UI.elements.lobby.leaderboardTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                UI.elements.lobby.leaderboardTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`leaderboard-content-${tabName}`).classList.add('active');
            });
        });

        // Auth Buttons
        UI.elements.auth.backToLobbyBtn.addEventListener('click', () => UI.switchTopLevelView('game-lobby'));
        UI.elements.auth.form.addEventListener('submit', (e) => AuthView.handleAuthSubmit(e));
        UI.elements.auth.switchBtn.addEventListener('click', (e) => AuthView.switchAuthMode(e));

        // Main App (Learning) Buttons
        UI.elements.mainApp.backToHubBtn.addEventListener('click', (e) => {
            e.preventDefault();
            UI.switchTopLevelView('game-lobby');
        });
        UI.elements.mainApp.profileViewBtn.addEventListener('click', () => ProfileView.showProfileView());
        UI.elements.mainApp.adminViewBtn.addEventListener('click', () => AdminView.showAdminView());
        UI.elements.mainApp.restartBtn.addEventListener('click', () => this.toggleRestartModal(true));
        UI.elements.mainApp.backToCategoriesBtn.addEventListener('click', () => CourseView.showCategoryView());
        UI.elements.mainApp.backToChaptersBtn.addEventListener('click', () => CourseView.showChapterView());

        // Profile Buttons
        UI.elements.profile.backToMainAppBtn.addEventListener('click', () => UI.switchTopLevelView('game-lobby'));

        // Other Modals and View Buttons
        UI.elements.immersiveView.closeBtn.addEventListener('click', () => CourseView.closeImmersiveViewer());
        UI.elements.restartModal.cancelBtn.addEventListener('click', () => this.toggleRestartModal(false));
        UI.elements.restartModal.confirmBtn.addEventListener('click', () => this.handleConfirmRestart());
        
        AdminView.bindAdminEvents();
        
        const factionModal = UI.elements.factionModal.container;
        factionModal.addEventListener('click', (e) => {
            const button = e.target.closest('.faction-btn');
            if (button) this.handleFactionSelection(button.dataset.faction);
        });
    },

    async handleLogin(user) {
        if (AppState.user && AppState.user.id === user.id) return;
        resetUserProgressState();
        AppState.user = user;
        try {
            const [profile, scoreInfo] = await Promise.all([
                ApiService.getProfile(user.id),
                ApiService.getScoreInfo(user.id)
            ]);
            AppState.profile = {
                ...(profile || { role: 'user', faction: null }),
                username: scoreInfo ? scoreInfo.username : null,
                points: scoreInfo ? scoreInfo.points : 0
            };
            if (!AppState.profile.faction) {
                this.showFactionSelection();
            } else {
                await this.loadMainAppData();
            }
        } catch (error) {
            console.error("Login process failed:", error);
            UI.showNotification(`登录失败: ${error.message}`, 'error');
            ApiService.signOut();
        }
    },

    async loadMainAppData() {
        try {
            const [progress, categories, challenges, personalLb, factionLb] = await Promise.all([
                ApiService.getUserProgress(AppState.user.id),
                ApiService.fetchLearningMap(),
                ApiService.fetchActiveChallenges(),
                ApiService.fetchLeaderboard(),
                ApiService.fetchFactionLeaderboard()
            ]);
            
            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            AppState.learningMap.categories = categories;
            AppState.activeChallenges = challenges;
            AppState.leaderboard = personalLb;
            AppState.factionLeaderboard = factionLb;

            this.flattenLearningStructure();
            this.renderGameLobby(true);
            UI.switchTopLevelView('game-lobby');

        } catch (error) {
            console.error("Failed to load main app data:", error);
            UI.showNotification(`加载数据失败: ${error.message}`, 'error');
        }
    },
    
    renderGameLobby(isLoggedIn) {
        const { lobby } = UI.elements;

        if (isLoggedIn) {
            const profile = AppState.profile;
            const factionInfo = getFactionInfo(profile.faction);
            const avatarChar = (profile.username || '玩家').charAt(0).toUpperCase();
            const points = profile.points || 0;
            const level = Math.floor(points / 100) + 1;

            // Top Nav
            lobby.avatar.textContent = avatarChar;
            lobby.avatar.style.borderColor = factionInfo.color;
            lobby.playerName.textContent = profile.username || '天命人';
            lobby.playerLevel.textContent = level;
            lobby.logoutBtn.classList.remove('hidden');

            // Bottom Nav
            lobby.adminNavBtn.style.display = profile.role === 'admin' ? 'flex' : 'none';

            // Main Button
            const firstUncompleted = AppState.learningMap.flatStructure.find(b => !AppState.userProgress.completedBlocks.has(b.id));
            lobby.plotTaskTitle.textContent = firstUncompleted ? '继续征途' : '已完成';

            // Leaderboards
            this.renderLeaderboards();
            
            // Faction Challenges
            this.renderFactionChallenges();

        } else {
            // Top Nav
            lobby.avatar.textContent = '?';
            lobby.avatar.style.borderColor = '#475569';
            lobby.playerName.textContent = '未登录';
            lobby.playerLevel.textContent = '??';
            lobby.logoutBtn.classList.add('hidden');
            
            // Bottom Nav
            lobby.adminNavBtn.style.display = 'none';

            // Main Button
            lobby.plotTaskTitle.textContent = '开启征途';

            // Leaderboards & Challenges
            UI.renderEmpty(lobby.personalBoard, '登录后查看排名');
            UI.renderEmpty(lobby.factionBoard, '登录后查看排名');
            UI.renderEmpty(lobby.challengeContainer, '登录后查看挑战');
        }
    },

    renderLeaderboards() {
        const { personalBoard, factionBoard } = UI.elements.lobby;

        // Personal
        if (!AppState.leaderboard || AppState.leaderboard.length === 0) {
            UI.renderEmpty(personalBoard, '暂无个人排名');
        } else {
            personalBoard.innerHTML = AppState.leaderboard.map((p, i) => {
                const rank = i + 1;
                const isCurrentUser = AppState.user && p.user_id === AppState.user.id;
                const icon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="rank-number">${rank}</span>`;
                const displayName = p.full_name || p.username.split('@')[0];
                return `<div class="personal-leaderboard-item ${isCurrentUser ? 'current-user' : ''}"><div class="rank-icon">${icon}</div><div class="player-name">${displayName}</div><div class="player-score">${p.points}</div></div>`;
            }).join('');
        }

        // Faction
        if (!AppState.factionLeaderboard || AppState.factionLeaderboard.length === 0) {
            UI.renderEmpty(factionBoard, '暂无部门排名');
        } else {
            factionBoard.innerHTML = AppState.factionLeaderboard.map(f => {
                const fInfo = getFactionInfo(f.faction);
                return `<div class="faction-leaderboard-item faction-${fInfo.color}"><div class="flex justify-between items-start"><div><h3 class="faction-name faction-name-${fInfo.color}">${fInfo.name}</h3><div class="faction-stats"><span>👥 ${f.total_members}</span><span>⭐ ${f.total_points}</span></div></div><div class="faction-score"><div class="avg-score">${parseFloat(f.average_score).toFixed(0)}</div><div class="avg-label">均分</div></div></div></div>`;
            }).join('');
        }
    },

    async renderFactionChallenges() {
        // This is a placeholder. For now, the button is static.
        // In the future, we can make this dynamic.
        const container = UI.elements.lobby.challengeContainer;
        // You can add logic here to show active challenges if needed.
    },
    
    handlePlotTaskClick() {
        if (!AppState.user) {
            UI.switchTopLevelView('auth');
            return;
        }
        UI.switchTopLevelView('main-app');
        CourseView.showCategoryView();
    },

    showFactionSelection() { UI.elements.factionModal.container.classList.remove('hidden'); UI.elements.factionModal.container.classList.add('flex'); },
    hideFactionSelection() { UI.elements.factionModal.container.classList.add('hidden'); UI.elements.factionModal.container.classList.remove('flex'); },

    async handleFactionSelection(faction) {
        try {
            const updatedProfile = await ApiService.updateProfileFaction(AppState.user.id, faction);
            AppState.profile.faction = updatedProfile.faction; 
            this.hideFactionSelection();
            const factionInfo = getFactionInfo(faction);
            UI.showNotification(`你已加入【${factionInfo.name}】！`, 'success');
            await this.loadMainAppData();
        } catch (error) {
            console.error("Error during faction selection:", error);
            UI.showNotification(error.message, 'error');
        }
    },

    flattenLearningStructure() { const flat = []; (AppState.learningMap.categories || []).forEach(cat => { (cat.chapters || []).forEach(chap => { (chap.sections || []).forEach(sec => { (sec.blocks || []).forEach(block => { flat.push({ ...block, sectionId: sec.id, chapterId: chap.id, categoryId: cat.id }); }); }); }); }); AppState.learningMap.flatStructure = flat; },
    toggleRestartModal(show) { const modal = UI.elements.restartModal.container; modal.classList.toggle('hidden', !show); modal.classList.toggle('flex', show); },
    handleRestartRequest() { this.toggleRestartModal(true); },
    async handleConfirmRestart() {
        this.toggleRestartModal(false);
        try {
            await ApiService.resetUserProgress();
            await this.loadMainAppData();
            UI.showNotification("您的学习进度已重置！", "success");
        } catch (error) { UI.showNotification(error.message, "error"); }
    },
};

window.App = App;
window.onload = () => {
    try { App.init(); } catch (error) {
        console.error("Failed to initialize application:", error);
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;"><h1>Application Failed to Start</h1><p>${error.message}</p></div>`;
    }
};
