/**
 * @file app.js
 * @description The main entry point for the application.
 * @version 2.8.0 - Show public challenges to logged-out users and redirect to main app on login.
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
                UI.switchTopLevelView('landing');
                this.updateLandingPageLeaderboards();
                this.setupSmartNavigation();
                this.renderCourseList();
                this.renderActiveChallenges(); // Now shows public challenges
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
        UI.elements.profile.backToMainAppBtn.addEventListener('click', () => {
            // This now correctly returns to the main app view, not the landing hub
            UI.switchTopLevelView('main');
            CourseView.showCategoryView();
        });
        UI.elements.mainApp.restartBtn.addEventListener('click', () => this.handleRestartRequest());
        UI.elements.mainApp.adminViewBtn.addEventListener('click', () => AdminView.showAdminView());
        UI.elements.mainApp.backToCategoriesBtn.addEventListener('click', () => CourseView.showCategoryView());
        UI.elements.mainApp.backToChaptersBtn.addEventListener('click', () => CourseView.showChapterView());
        UI.elements.immersiveView.closeBtn.addEventListener('click', () => CourseView.closeImmersiveViewer());
        UI.elements.restartModal.cancelBtn.addEventListener('click', () => this.toggleRestartModal(false));
        UI.elements.restartModal.confirmBtn.addEventListener('click', () => this.handleConfirmRestart());
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
        
        try {
            // Fetch challenges on initial load for everyone
            const challenges = await ApiService.fetchActiveChallenges();
            AppState.activeChallenges = challenges;
            this.renderActiveChallenges(); // Render for logged-out users
        } catch (error) {
            console.error('获取活跃挑战失败:', error);
        }

        this.updateLandingPageLeaderboards();
    },
    
    async updateLandingPageLeaderboards() {
        const personalBoard = document.getElementById('landing-personal-board');
        const factionBoard = document.getElementById('landing-faction-board');
        if (!personalBoard || !factionBoard) return;

        UI.renderLoading(personalBoard, 'leaderboard');
        UI.renderLoading(factionBoard, 'faction-leaderboard');
        
        try {
            const [personalData, factionData] = await Promise.all([
                ApiService.fetchLeaderboard(),
                ApiService.fetchFactionLeaderboard()
            ]);
            AppState.leaderboard = personalData;
            AppState.factionLeaderboard = factionData;

            if (!personalData || personalData.length === 0) {
                UI.renderEmpty(personalBoard, '暂无个人排名');
            } else {
                personalBoard.innerHTML = personalData.map((p, i) => {
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

            if (!factionData || factionData.length === 0) {
                UI.renderEmpty(factionBoard, '暂无部门排名');
            } else {
                factionBoard.innerHTML = factionData.map(f => {
                    const factionInfo = getFactionInfo(f.faction);
                    return `<div class="faction-leaderboard-item faction-${factionInfo.color}">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="faction-name faction-name-${factionInfo.color}">${factionInfo.name}</h3>
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
        } catch (error) {
            UI.renderError(personalBoard, '个人榜加载失败');
            UI.renderError(factionBoard, '部门榜加载失败');
            console.error(error);
        }
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
            AppState.profile = updatedProfile; 
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
            const [progress, categories] = await Promise.all([
                ApiService.getUserProgress(AppState.user.id),
                ApiService.fetchLearningMap(),
            ]);
            
            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            AppState.learningMap.categories = categories;
            this.flattenLearningStructure();

            // ==================== UPDATED PART START ====================
            // Directly switch to the main application view
            UI.switchTopLevelView('main');
            // Render the content for the main view
            this.renderContinueLearningCard();
            CourseView.showCategoryView();
            // ===================== UPDATED PART END =====================

            // Update header and other dynamic elements
            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', !AppState.profile || AppState.profile.role !== 'admin');
            const displayName = AppState.profile.username || AppState.user.email.split('@')[0];
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${displayName}`;
            
            // Also update landing page content in the background for when user logs out
            this.setupSmartNavigation();
            this.renderCourseList();
            this.renderActiveChallenges();
            this.updateLandingPageLeaderboards();

            ApiService.db.channel('public:scores').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
                if (AppState.current.topLevelView === 'main') {
                    CourseView.updateLeaderboard();
                }
                this.updateLandingPageLeaderboards();
            }).subscribe();

        } catch (error) {
            console.error("Failed to load main app data:", error);
            UI.showNotification(`加载数据失败: ${error.message}`, 'error');
            UI.switchTopLevelView('landing');
        }
    },
    
    renderContinueLearningCard() {
        const container = document.getElementById('main-continue-learning-container');
        if (!container) return;
        const lastViewedBlockId = localStorage.getItem('lastViewedBlockId');
        if (!lastViewedBlockId) { container.innerHTML = ''; return; }
        const block = AppState.learningMap.flatStructure.find(b => b.id === lastViewedBlockId);
        if (!block || AppState.userProgress.completedBlocks.has(block.id)) { container.innerHTML = ''; return; }
        const chapter = AppState.learningMap.categories.flatMap(c => c.chapters).find(ch => ch.id === block.chapterId);
        const cardTitle = chapter ? `${chapter.title} - ${block.title}` : block.title;
        container.innerHTML = `<div class="continue-learning-card"><div><p class="text-gray-400 text-sm">继续上次的征途</p><h3 class="text-xl font-bold text-sky-300 mt-1">${cardTitle}</h3></div><button id="main-continue-btn" class="btn bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">马上开始 &rarr;</button></div>`;
        document.getElementById('main-continue-btn').addEventListener('click', () => {
            AppState.current.categoryId = block.categoryId;
            UI.switchTopLevelView('main');
            CourseView.selectChapter(block.chapterId);
            setTimeout(() => CourseView.selectBlock(block.id), 50);
        });
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
        
        // Check if user is logged in and has a faction
        const isLoggedInWithFaction = AppState.user && AppState.profile && AppState.profile.faction;

        for (const challenge of AppState.activeChallenges) {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            let cardContent = '';

            if (isLoggedInWithFaction) {
                // Logged-in view with progress
                const progress = await ApiService.fetchFactionChallengeProgress(challenge.id, AppState.profile.faction);
                const progressPercentage = parseFloat(progress).toFixed(1);
                cardContent = `
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
            } else {
                // Logged-out (public) view
                cardContent = `
                    <h3 class="challenge-title">${challenge.title}</h3>
                    <p class="challenge-description">目标: 完成 <strong class="text-purple-300">${challenge.target_category_title || '指定'}</strong> 篇章</p>
                    <div class="mt-4 text-center bg-slate-800/50 p-3 rounded-md">
                        <p class="text-sm text-sky-300">登录并加入部门以查看挑战进度！</p>
                    </div>
                    <div class="challenge-meta mt-3">
                         <span class="challenge-reward">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span>${challenge.reward_points} 团队积分</span>
                        </span>
                        <span class="challenge-deadline">截止: ${new Date(challenge.end_date).toLocaleDateString()}</span>
                    </div>`;
            }
            card.innerHTML = cardContent;
            container.appendChild(card);
        }
    },

    setupSmartNavigation() {
        const smartNavContainer = document.getElementById('smart-nav-container');
        const mainHubTitle = document.getElementById('main-hub-title');
        
        if (!smartNavContainer || !mainHubTitle) return;

        if (AppState.user && AppState.profile) {
            const smartNavUsername = document.getElementById('smart-nav-username');
            const continueLearningBtn = document.getElementById('continue-learning-btn');
            const continueLearningTitle = document.getElementById('continue-learning-title');
            
            smartNavUsername.textContent = AppState.profile.username || AppState.user.email.split('@')[0];
            smartNavContainer.classList.remove('hidden');
            mainHubTitle.classList.add('hidden');

            const firstUncompleted = AppState.learningMap.flatStructure.find(b => !AppState.userProgress.completedBlocks.has(b.id));

            if (firstUncompleted) {
                const chapter = AppState.learningMap.categories.flatMap(c => c.chapters).find(ch => ch.id === firstUncompleted.chapterId);
                continueLearningTitle.textContent = chapter ? `${chapter.title} - ${firstUncompleted.title}` : firstUncompleted.title;
                const clickHandler = () => {
                    AppState.current.categoryId = firstUncompleted.categoryId;
                    UI.switchTopLevelView('main');
                    CourseView.selectChapter(firstUncompleted.chapterId);
                    setTimeout(() => CourseView.selectBlock(firstUncompleted.id), 100);
                };
                continueLearningBtn.onclick = clickHandler;
                document.getElementById('continue-learning-card').onclick = clickHandler;
            } else {
                continueLearningTitle.textContent = "恭喜你，已完成所有课程！";
                continueLearningBtn.textContent = "查看成就";
                continueLearningBtn.onclick = () => ProfileView.showProfileView();
                document.getElementById('continue-learning-card').onclick = () => ProfileView.showProfileView();
            }
        } else {
            smartNavContainer.classList.add('hidden');
            mainHubTitle.classList.remove('hidden');
        }
    },

    renderCourseList() {
        const container = document.getElementById('course-list-container');
        if (!container) return;
        if (!AppState.user) { container.innerHTML = ''; return; }
        const categories = AppState.learningMap.categories;
        if (!categories || categories.length === 0) { container.innerHTML = '<p class="text-gray-500">暂无课程篇章。</p>'; return; }
        let html = '<h2 class="text-3xl text-amber-100 font-calligraphy tracking-wider mb-6">我的学习路径</h2>';
        html += categories.map(category => {
            const allBlocks = AppState.learningMap.flatStructure.filter(b => b.categoryId === category.id);
            const completedBlocks = allBlocks.filter(b => AppState.userProgress.completedBlocks.has(b.id));
            const progress = allBlocks.length > 0 ? Math.round((completedBlocks.length / allBlocks.length) * 100) : 0;
            const isLocked = !CourseView.isCategoryUnlocked(category.id);
            return `<div class="course-card hub-card p-6 mb-4 flex justify-between items-center transition-all duration-300 ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-sky-500/50 cursor-pointer'}" onclick="${isLocked ? `UI.showNotification('请先完成前置篇章来解锁', 'error')` : `App.handleCourseCardClick('${category.id}')`}"><div><h3 class="text-xl font-bold text-white">${category.title} ${isLocked ? '🔒' : ''}</h3><p class="text-sm text-gray-400 mt-1">${category.description}</p></div><div class="w-1/4 text-right ml-4 flex-shrink-0"><p class="text-lg font-bold text-sky-400">${progress}%</p><div class="w-full bg-slate-700 rounded-full h-2.5 mt-1"><div class="bg-sky-500 h-2.5 rounded-full" style="width: ${progress}%"></div></div></div></div>`;
        }).join('');
        container.innerHTML = html;
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
            this.renderCourseList();
            this.renderActiveChallenges();
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
