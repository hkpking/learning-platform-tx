/**
 * @file app.js
 * @description The main entry point for the application.
 * @version 4.0.3 - [FIX] Added logic to show admin button and updated main app header upon data load.
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
        UI.elements.lobby.factionChallengeBtn.addEventListener('click', () => this.showLobbyModal('faction-challenges'));

        // Bottom Nav
        UI.elements.lobby.bottomNav.addEventListener('click', (e) => {
            const button = e.target.closest('.lobby-nav-btn');
            if (!button) return;
            if (!AppState.user) { UI.switchTopLevelView('auth'); return; }
            
            const action = button.dataset.action;
            switch(action) {
                case 'show-all-quests':
                    this.showLobbyModal('all-quests');
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

        // Lobby Modal Backdrop for closing
        document.getElementById('lobby-modal-backdrop').addEventListener('click', (e) => {
            if (e.target.id === 'lobby-modal-backdrop') {
                this.hideLobbyModal();
            }
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

            // [FIX] Update the main app header with user info and admin button visibility
            // This ensures it's correct before the user even navigates to the main learning view.
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${AppState.profile.username || AppState.user.email.split('@')[0]}`;
            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', AppState.profile.role !== 'admin');

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

            lobby.avatar.textContent = avatarChar;
            lobby.avatar.style.borderColor = factionInfo.color;
            lobby.playerName.textContent = profile.username || '天命人';
            lobby.playerLevel.textContent = level;
            lobby.logoutBtn.classList.remove('hidden');
            lobby.adminNavBtn.style.display = profile.role === 'admin' ? 'flex' : 'none';

            const firstUncompleted = AppState.learningMap.flatStructure.find(b => !AppState.userProgress.completedBlocks.has(b.id));
            lobby.plotTaskTitle.textContent = firstUncompleted ? '继续征途' : '已完成';

            this.renderLeaderboards();
        } else {
            lobby.avatar.textContent = '?';
            lobby.avatar.style.borderColor = '#475569';
            lobby.playerName.textContent = '未登录';
            lobby.playerLevel.textContent = '??';
            lobby.logoutBtn.classList.add('hidden');
            lobby.adminNavBtn.style.display = 'none';
            lobby.plotTaskTitle.textContent = '开启征途';

            UI.renderEmpty(lobby.personalBoard, '登录后查看排名');
            UI.renderEmpty(lobby.factionBoard, '登录后查看排名');
        }
    },

    renderLeaderboards() {
        const { personalBoard, factionBoard } = UI.elements.lobby;

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

        if (!AppState.factionLeaderboard || AppState.factionLeaderboard.length === 0) {
            UI.renderEmpty(factionBoard, '暂无部门排名');
        } else {
            factionBoard.innerHTML = AppState.factionLeaderboard.map(f => {
                const fInfo = getFactionInfo(f.faction);
                return `<div class="faction-leaderboard-item faction-${fInfo.color}"><div class="flex justify-between items-start"><div><h3 class="faction-name faction-name-${fInfo.color}">${fInfo.name}</h3><div class="faction-stats"><span>👥 ${f.total_members}</span><span>⭐ ${f.total_points}</span></div></div><div class="faction-score"><div class="avg-score">${parseFloat(f.average_score).toFixed(0)}</div><div class="avg-label">均分</div></div></div></div>`;
            }).join('');
        }
    },
    
    handlePlotTaskClick() {
        if (!AppState.user) {
            UI.switchTopLevelView('auth');
            return;
        }
        UI.switchTopLevelView('main-app');
        CourseView.showCategoryView();
    },

    showLobbyModal(modalType) {
        const backdrop = document.getElementById('lobby-modal-backdrop');
        document.querySelectorAll('.lobby-modal-content').forEach(m => m.classList.add('hidden'));

        const modal = document.getElementById(`${modalType}-modal`);
        const content = document.getElementById(`${modalType}-content`);
        
        if (modalType === 'all-quests') {
            content.innerHTML = ''; // Clear previous content
            const categories = AppState.learningMap.categories;
            if (!categories || categories.length === 0) {
                UI.renderEmpty(content, '暂无任务篇章');
            } else {
                categories.forEach(c => content.appendChild(ComponentFactory.createCategoryCard(c, !CourseView.isCategoryUnlocked(c.id))));
            }
        } else if (modalType === 'faction-challenges') {
            this.renderFactionChallenges(content);
        }

        backdrop.classList.remove('hidden');
        backdrop.classList.add('active');
        modal.classList.remove('hidden');
    },

    hideLobbyModal() {
        const backdrop = document.getElementById('lobby-modal-backdrop');
        backdrop.classList.add('hidden');
        backdrop.classList.remove('active');
    },

    async renderFactionChallenges(container) {
        if (!AppState.activeChallenges || AppState.activeChallenges.length === 0) {
            UI.renderEmpty(container, '当前没有阵营挑战');
            return;
        }

        container.innerHTML = '';
        for (const challenge of AppState.activeChallenges) {
            const card = document.createElement('div');
            card.className = 'challenge-card mb-4';
            const progress = await ApiService.fetchFactionChallengeProgress(challenge.id, AppState.profile.faction);
            const progressPercentage = parseFloat(progress).toFixed(1);
            card.innerHTML = `
                <h3 class="challenge-title">${challenge.title}</h3>
                <p class="challenge-description">目标: 完成 <strong class="text-purple-300">${challenge.target_category_title || '指定'}</strong> 篇章</p>
                <div class="mt-2">
                    <div class="challenge-progress-bar-bg">
                        <div class="challenge-progress-bar" style="width: ${progressPercentage}%;"></div>
                    </div>
                    <div class="challenge-meta">
                        <span class="challenge-reward">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span>${challenge.reward_points} 团队积分</span>
                        </span>
                        <span class="challenge-deadline">截止: ${new Date(challenge.end_date).toLocaleDateString()}</span>
                    </div>
                </div>`;
            container.appendChild(card);
        }
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
