/**
 * @file app.js
 * @description The main entry point for the application.
 * @version 3.0.0 - Refactored landing page into a Player Hub for logged-in users.
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
        this.initLandingPage();
        ApiService.initialize();
        ApiService.db.auth.onAuthStateChange((_event, session) => {
            if (session && session.user) {
                this.handleLogin(session.user);
            } else {
                AppState.user = null;
                AppState.profile = null;
                resetUserProgressState();
                this.showLoggedOutHub();
                UI.switchTopLevelView('landing');
            }
        });
    },
    bindEvents() {
        UI.elements.landing.loginBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.landing.startBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.auth.backToLandingBtn.addEventListener('click', () => UI.switchTopLevelView('landing'));
        UI.elements.auth.form.addEventListener('submit', (e) => AuthView.handleAuthSubmit(e));
        UI.elements.auth.switchBtn.addEventListener('click', (e) => AuthView.switchAuthMode(e));
        UI.elements.mainApp.logoutBtn.addEventListener('click', () => ApiService.signOut());
        UI.elements.mainApp.profileViewBtn.addEventListener('click', () => ProfileView.showProfileView());
        UI.elements.profile.backToMainAppBtn.addEventListener('click', () => UI.switchTopLevelView('landing'));
        UI.elements.mainApp.restartBtn.addEventListener('click', () => this.handleRestartRequest());
        UI.elements.mainApp.adminViewBtn.addEventListener('click', () => AdminView.showAdminView());
        UI.elements.mainApp.backToCategoriesBtn.addEventListener('click', () => CourseView.showCategoryView());
        UI.elements.mainApp.backToChaptersBtn.addEventListener('click', () => CourseView.showChapterView());
        UI.elements.immersiveView.closeBtn.addEventListener('click', () => CourseView.closeImmersiveViewer());
        UI.elements.restartModal.cancelBtn.addEventListener('click', () => this.toggleRestartModal(false));
        UI.elements.restartModal.confirmBtn.addEventListener('click', () => this.handleConfirmRestart());
        
        // New Hub buttons
        document.getElementById('go-to-profile-btn').addEventListener('click', () => ProfileView.showProfileView());
        document.getElementById('back-to-hub-btn').addEventListener('click', (e) => {
            e.preventDefault();
            UI.switchTopLevelView('landing');
        });


        AdminView.bindAdminEvents();
        
        const factionModal = UI.elements.factionModal.container;
        factionModal.addEventListener('click', (e) => {
            const button = e.target.closest('.faction-btn');
            if (button) {
                this.handleFactionSelection(button.dataset.faction);
            }
        });

        UI.elements.admin.adminNav.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-admin-view]');
            if (button) {
                const view = button.dataset.adminView;
                UI.elements.admin.adminNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (view === 'challenges') {
                    AdminView.showChallengesList();
                } else {
                    AdminView.showCategoryList();
                }
            }
        });
    },
    async initLandingPage() {
        const subtitle = UI.elements.landing.subtitle;
        const scrollIndicator = UI.elements.landing.scrollIndicator;
        const script = [{ t: "流程真经，曾护佑大唐盛世千年……", d: 5000 }, { t: "然大道蒙尘，秩序失落，妖魔横行。", d: 5000 }, { t: "为重归繁荣，大唐董事遍发《无字真书》，寻觅天命之人。", d: 6000 }, { t: "于机缘巧合，你，得到了它……", d: 5000 }, { t: "当你翻开《流程密码》的瞬间，亦被其选中。", d: 6000 }, { t: "欢迎你，天命人。你的旅程，由此开始。", d: 5000 }];
        let currentLine = 0;
        function playNarrative() {
            if (currentLine >= script.length) currentLine = 0;
            const scene = script[currentLine];
            subtitle.classList.remove('visible');
            setTimeout(() => {
                subtitle.textContent = scene.t;
                subtitle.classList.add('visible');
                if (currentLine === 0) scrollIndicator.classList.add('visible');
                currentLine++;
                setTimeout(playNarrative, scene.d);
            }, 1500);
        }
        playNarrative();
        const animatedElements = document.querySelectorAll('.fade-in-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('is-visible');
            });
        }, { threshold: 0.2 });
        animatedElements.forEach(el => observer.observe(el));
    },

    showLoggedOutHub() {
        document.getElementById('hub-logged-out-view').classList.remove('hidden');
        document.getElementById('hub-logged-in-view').classList.add('hidden');
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
            this.renderPlayerHub();

            UI.switchTopLevelView('landing');

            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', !AppState.profile || AppState.profile.role !== 'admin');
            const displayName = AppState.profile.username || AppState.user.email.split('@')[0];
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${displayName}`;
            
            ApiService.db.channel('public:scores').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, async () => {
                if (AppState.current.topLevelView === 'landing') {
                    const [personalLb, factionLb, scoreInfo] = await Promise.all([
                        ApiService.fetchLeaderboard(),
                        ApiService.fetchFactionLeaderboard(),
                        ApiService.getScoreInfo(AppState.user.id)
                    ]);
                    AppState.leaderboard = personalLb;
                    AppState.factionLeaderboard = factionLb;
                    AppState.profile.points = scoreInfo.points;
                    this.renderPlayerHub();
                }
            }).subscribe();

        } catch (error) {
            console.error("Failed to load main app data:", error);
            UI.showNotification(`加载数据失败: ${error.message}`, 'error');
            UI.switchTopLevelView('landing');
        }
    },

    // ==================== NEW: PLAYER HUB RENDERER ====================
    renderPlayerHub() {
        document.getElementById('hub-logged-out-view').classList.add('hidden');
        document.getElementById('hub-logged-in-view').classList.remove('hidden');

        // --- 1. Render Player Status Panel ---
        const profile = AppState.profile;
        const factionInfo = getFactionInfo(profile.faction);
        const avatarChar = (profile.username || AppState.user.email.split('@')[0]).charAt(0).toUpperCase();

        const avatarEl = document.getElementById('player-avatar');
        avatarEl.textContent = avatarChar;
        avatarEl.className = `w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl font-bold mb-4 border-4 bg-slate-700`;
        avatarEl.style.borderColor = factionInfo.color;

        document.getElementById('player-name').textContent = profile.username || AppState.user.email.split('@')[0];
        const playerFactionEl = document.getElementById('player-faction');
        playerFactionEl.textContent = factionInfo.name;
        playerFactionEl.className = `text-center font-semibold mb-6 text-${factionInfo.color}-400`;

        const points = profile.points || 0;
        const level = Math.floor(points / 100) + 1;
        const xpForNextLevel = 100;
        const currentXp = points % 100;
        const xpPercentage = (currentXp / xpForNextLevel) * 100;
        
        document.getElementById('player-level').textContent = `Lv. ${level}`;
        document.getElementById('player-xp-bar').style.width = `${xpPercentage}%`;
        document.getElementById('player-points').textContent = points;

        const totalBlocks = AppState.learningMap.flatStructure.length;
        const completedBlocks = AppState.userProgress.completedBlocks.size;
        const progressPercentage = totalBlocks > 0 ? ((completedBlocks / totalBlocks) * 100).toFixed(0) : 0;
        document.getElementById('player-progress').textContent = `${progressPercentage}%`;

        // --- 2. Render Core Tasks ---
        const firstUncompleted = AppState.learningMap.flatStructure.find(b => !AppState.userProgress.completedBlocks.has(b.id));
        const continueLearningCard = document.getElementById('continue-learning-card');
        const continueLearningTitle = document.getElementById('continue-learning-title');
        const continueLearningBtn = document.getElementById('continue-learning-btn');

        if (firstUncompleted) {
            const chapter = AppState.learningMap.categories.flatMap(c => c.chapters).find(ch => ch.id === firstUncompleted.chapterId);
            continueLearningTitle.textContent = chapter ? `${chapter.title} - ${firstUncompleted.title}` : firstUncompleted.title;
            const clickHandler = () => {
                AppState.current.categoryId = firstUncompleted.categoryId;
                UI.switchTopLevelView('main');
                CourseView.showChapterView();
                setTimeout(() => CourseView.selectBlock(firstUncompleted.id), 50);
            };
            continueLearningBtn.onclick = clickHandler;
            continueLearningCard.onclick = clickHandler;
        } else {
            continueLearningTitle.textContent = "恭喜！已完成所有主线任务！";
            continueLearningBtn.textContent = "查看成就";
            const clickHandler = () => ProfileView.showProfileView();
            continueLearningBtn.onclick = clickHandler;
            continueLearningCard.onclick = clickHandler;
        }
        
        this.renderActiveChallenges();
        this.renderHubCourseList();

        // --- 3. Render Hall of Fame ---
        const personalBoard = document.getElementById('hub-personal-board');
        const factionBoard = document.getElementById('hub-faction-board');
        
        // Personal Leaderboard
        if (!AppState.leaderboard || AppState.leaderboard.length === 0) {
            UI.renderEmpty(personalBoard, '暂无个人排名');
        } else {
            personalBoard.innerHTML = AppState.leaderboard.map((p, i) => {
                const rank = i + 1;
                const isCurrentUser = AppState.user && p.user_id === AppState.user.id;
                const icon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="rank-number">${rank}</span>`;
                const displayName = p.full_name || p.username.split('@')[0];
                return `<div class="personal-leaderboard-item rank-${rank} ${isCurrentUser ? 'current-user' : ''}">
                            <div class="rank-icon">${icon}</div>
                            <div class="player-name">${displayName}</div>
                            <div class="player-score">${p.points}</div>
                        </div>`;
            }).join('');
        }

        // Faction Leaderboard
        if (!AppState.factionLeaderboard || AppState.factionLeaderboard.length === 0) {
            UI.renderEmpty(factionBoard, '暂无部门排名');
        } else {
            factionBoard.innerHTML = AppState.factionLeaderboard.map(f => {
                const fInfo = getFactionInfo(f.faction);
                return `<div class="faction-leaderboard-item faction-${fInfo.color}">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="faction-name faction-name-${fInfo.color}">${fInfo.name}</h3>
                                    <div class="faction-stats">
                                        <span>👥 ${f.total_members} 名成员</span>
                                        <span>|</span>
                                        <span>⭐ ${f.total_points} 总分</span>
                                    </div>
                                </div>
                                <div class="faction-score">
                                    <div class="avg-score">${parseFloat(f.average_score).toFixed(0)}</div>
                                    <div class="avg-label">均分</div>
                                </div>
                            </div>
                        </div>`;
            }).join('');
        }
    },
    
    async renderActiveChallenges() {
        const container = document.getElementById('active-challenge-container');
        const section = document.getElementById('challenge-section');
        if (!container || !section) return;

        container.innerHTML = '';
        section.classList.add('hidden');

        if (!AppState.activeChallenges || AppState.activeChallenges.length === 0) {
            return;
        }

        section.classList.remove('hidden');
        
        for (const challenge of AppState.activeChallenges) {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            const progress = await ApiService.fetchFactionChallengeProgress(challenge.id, AppState.profile.faction);
            const progressPercentage = parseFloat(progress).toFixed(1);
            card.innerHTML = `
                <h3 class="challenge-title">${challenge.title}</h3>
                <p class="challenge-description">目标: 完成 <strong class="text-purple-300">${challenge.target_category_title || '指定'}</strong> 篇章</p>
                <div class="mt-4">
                    <div class="challenge-progress-bar-bg">
                        <div class="challenge-progress-bar" style="width: ${progressPercentage}%;">${progressPercentage > 5 ? progressPercentage + '%' : ''}</div>
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

    renderHubCourseList() {
        const container = document.getElementById('hub-course-grid');
        if (!container) return;
        const categories = AppState.learningMap.categories;
        if (!categories || categories.length === 0) { container.innerHTML = '<p class="text-gray-500">暂无课程篇章。</p>'; return; }
        
        container.innerHTML = categories.map(category => {
            const allBlocks = AppState.learningMap.flatStructure.filter(b => b.categoryId === category.id);
            const completedBlocks = allBlocks.filter(b => AppState.userProgress.completedBlocks.has(b.id));
            const progress = allBlocks.length > 0 ? Math.round((completedBlocks.length / allBlocks.length) * 100) : 0;
            const isLocked = !CourseView.isCategoryUnlocked(category.id);
            return `<div class="hub-course-card p-4 flex justify-between items-center ${isLocked ? 'locked' : 'cursor-pointer'}" onclick="${isLocked ? `UI.showNotification('请先完成前置篇章来解锁', 'error')` : `App.handleCourseCardClick('${category.id}')`}">
                        <div>
                            <h3 class="text-lg font-bold text-white">${category.title} ${isLocked ? '🔒' : ''}</h3>
                            <p class="text-sm text-gray-400 mt-1">${category.description}</p>
                        </div>
                        <div class="w-1/4 text-right ml-4 flex-shrink-0">
                            <p class="text-md font-bold text-sky-400">${progress}%</p>
                            <div class="w-full bg-slate-700 rounded-full h-2 mt-1">
                                <div class="bg-sky-500 h-2 rounded-full" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>`;
        }).join('');
    },

    handleCourseCardClick(categoryId) { UI.switchTopLevelView('main'); CourseView.selectCategory(categoryId); },
    flattenLearningStructure() { const flat = []; (AppState.learningMap.categories || []).forEach(cat => { (cat.chapters || []).forEach(chap => { (chap.sections || []).forEach(sec => { (sec.blocks || []).forEach(block => { flat.push({ ...block, sectionId: sec.id, chapterId: chap.id, categoryId: cat.id }); }); }); }); }); AppState.learningMap.flatStructure = flat; },
    toggleRestartModal(show) { const modal = UI.elements.restartModal.container; modal.classList.toggle('hidden', !show); modal.classList.toggle('flex', show); },
    handleRestartRequest() { this.toggleRestartModal(true); },
    async handleConfirmRestart() {
        this.toggleRestartModal(false);
        try {
            await ApiService.resetUserProgress();
            const progress = await ApiService.getUserProgress(AppState.user.id);
            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            UI.showNotification("您的学习进度已重置！", "success");
            this.renderPlayerHub();
        } catch (error) { UI.showNotification(error.message, "error"); }
    },
};

window.App = App;
window.UI = UI;

window.onload = () => {
    try {
        App.init();
    } catch (error) {
        console.error("Failed to initialize application:", error);
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;"><h1>Application Failed to Start</h1><p>${error.message}</p></div>`;
    }
};
