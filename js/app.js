/**
 * @file app.js
 * @description The main entry point for the application.
 * [v1.6] Adds logic to fetch and display both personal and faction leaderboards on the landing page.
 */
import { AppState } from './state.js';
import { UI } from './ui.js';
import { ApiService } from './services/api.js';
import { AuthView } from './views/auth.js';
import { CourseView } from './views/course.js';
import { AdminView } from './views/admin.js';

const App = {
    init() {
        this.bindEvents();
        this.initLandingPage();
        // Rely on onAuthStateChange to handle initial session
    },
    bindEvents() {
        UI.elements.landing.loginBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.landing.startBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.auth.backToLandingBtn.addEventListener('click', () => UI.switchTopLevelView('landing'));
        UI.elements.auth.form.addEventListener('submit', (e) => AuthView.handleAuthSubmit(e));
        UI.elements.auth.switchBtn.addEventListener('click', (e) => AuthView.switchAuthMode(e));
        UI.elements.mainApp.logoutBtn.addEventListener('click', () => ApiService.signOut());
        UI.elements.mainApp.restartBtn.addEventListener('click', () => this.handleRestartRequest());
        UI.elements.mainApp.adminViewBtn.addEventListener('click', () => AdminView.showAdminView());
        UI.elements.mainApp.backToCategoriesBtn.addEventListener('click', () => CourseView.showCategoryView());
        UI.elements.mainApp.backToChaptersBtn.addEventListener('click', () => CourseView.showChapterView());
        UI.elements.immersiveView.closeBtn.addEventListener('click', () => CourseView.closeImmersiveViewer());
        UI.elements.restartModal.cancelBtn.addEventListener('click', () => this.toggleRestartModal(false));
        UI.elements.restartModal.confirmBtn.addEventListener('click', () => this.handleConfirmRestart());
        AdminView.bindAdminEvents();
        UI.elements.landing.personalTab.addEventListener('click', () => this.switchLandingLeaderboard('personal'));
        UI.elements.landing.factionTab.addEventListener('click', () => this.switchLandingLeaderboard('faction'));
        const factionModal = UI.elements.factionModal.container;
        factionModal.addEventListener('click', (e) => {
            const button = e.target.closest('.faction-btn');
            if (button) {
                const faction = button.dataset.faction;
                this.handleFactionSelection(faction);
            }
        });

        ApiService.db.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.handleLogin(session.user);
            } else if (event === 'SIGNED_OUT') {
                AppState.user = null; AppState.profile = null;
                resetUserProgressState();
                UI.switchTopLevelView('landing');
            }
        });
    },
    initLandingPage() {
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
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.2 });
        animatedElements.forEach(el => observer.observe(el));
        this.updateLandingPageLeaderboards();
    },
    
    async updateLandingPageLeaderboards() {
        const { personalBoard, factionBoard } = UI.elements.landing;
        UI.renderLoading(personalBoard);
        UI.renderLoading(factionBoard);
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
                    const icon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="text-lg mr-5 ml-1">${rank}</span>`;
                    return `<div class="leaderboard-item flex items-center"><span class="text-2xl mr-4">${icon}</span><span class="font-semibold text-lg flex-grow">${p.username.split('@')[0]}</span><span class="text-yellow-400 font-bold">${p.points}</span></div>`;
                }).join('');
            }

            if (!factionData || factionData.length === 0) {
                UI.renderEmpty(factionBoard, '暂无阵营排名');
            } else {
                factionBoard.innerHTML = factionData.map((f, i) => {
                    const rank = i + 1;
                    const icon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="text-lg mr-5 ml-1">${rank}</span>`;
                    const factionName = f.faction === 'tianming' ? '天命' : '逆熵';
                    const factionColor = f.faction === 'tianming' ? 'text-sky-400' : 'text-red-400';
                    return `<div class="leaderboard-item flex items-center"><span class="text-2xl mr-4">${icon}</span><div class="flex-grow"><span class="font-semibold text-lg ${factionColor}">${factionName}</span><p class="text-xs text-gray-400">${f.total_members} 名成员 / 总分 ${f.total_points}</p></div><span class="text-yellow-400 font-bold text-xl">${parseFloat(f.average_score).toFixed(0)} <span class="text-sm font-normal text-gray-400">均分</span></span></div>`;
                }).join('');
            }
        } catch (error) {
            UI.renderError(personalBoard, '个人榜加载失败');
            UI.renderError(factionBoard, '阵营榜加载失败');
            console.error(error);
        }
    },

    switchLandingLeaderboard(boardType) {
        const { personalTab, factionTab, personalBoard, factionBoard } = UI.elements.landing;
        if (boardType === 'personal') {
            personalTab.classList.add('active');
            factionTab.classList.remove('active');
            personalBoard.classList.remove('hidden');
            factionBoard.classList.add('hidden');
        } else {
            personalTab.classList.remove('active');
            factionTab.classList.add('active');
            personalBoard.classList.add('hidden');
            factionBoard.classList.remove('hidden');
        }
    },

    async handleLogin(user) {
        if (AppState.user && AppState.user.id === user.id) return;
        resetUserProgressState(); 
        AppState.user = user;
        try {
            const profile = await ApiService.getProfile(user.id);
            AppState.profile = profile || { role: 'user', faction: null };
            if (!AppState.profile.faction) {
                this.showFactionSelection();
            } else {
                this.loadMainAppData();
            }
        } catch (error) {
            console.error("Login process failed:", error);
            UI.showNotification(`登录失败: ${error.message}`, 'error');
            ApiService.signOut();
        }
    },

    showFactionSelection() {
        UI.elements.factionModal.container.classList.remove('hidden');
        UI.elements.factionModal.container.classList.add('flex');
    },

    hideFactionSelection() {
        UI.elements.factionModal.container.classList.add('hidden');
        UI.elements.factionModal.container.classList.remove('flex');
    },

    async handleFactionSelection(faction) {
        try {
            const updatedProfile = await ApiService.updateProfileFaction(AppState.user.id, faction);
            AppState.profile = updatedProfile; 
            this.hideFactionSelection();
            UI.showNotification(`你已加入【${faction === 'tianming' ? '天命' : '逆熵'}】阵营！`, 'success');
            this.loadMainAppData();
        } catch (error) {
            console.error("Error during faction selection:", error);
            UI.showNotification(error.message, 'error');
        }
    },

    async loadMainAppData() {
        try {
            const [progress, categories] = await Promise.all([
                ApiService.getUserProgress(AppState.user.id),
                ApiService.fetchLearningMap()
            ]);
            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            AppState.learningMap.categories = categories;
            this.flattenLearningStructure();
            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', !AppState.profile || AppState.profile.role !== 'admin');
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${AppState.user.email.split('@')[0]}`;
            UI.switchTopLevelView('main');
            CourseView.showCategoryView();
            CourseView.updateLeaderboard();
            ApiService.db.channel('public:scores').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => CourseView.updateLeaderboard()).subscribe();
        } catch (error) {
            console.error("Failed to load main app data:", error);
            UI.showNotification(`加载数据失败: ${error.message}`, 'error');
        }
    },

    flattenLearningStructure() {
        const flat = [];
        (AppState.learningMap.categories || []).forEach(cat => { (cat.chapters || []).forEach(chap => { (chap.sections || []).forEach(sec => { (sec.blocks || []).forEach(block => { flat.push({ ...block, sectionId: sec.id, chapterId: chap.id, categoryId: cat.id }); }); }); }); });
        AppState.learningMap.flatStructure = flat;
    },
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
            CourseView.showCategoryView();
        } catch (error) { UI.showNotification(error.message, "error"); }
    },
};

window.onload = () => App.init();