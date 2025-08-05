/**
 * @file app.js
 * @description The main entry point for the application.
 * [v2.1] Updated with new department-based factions.
 */
import { AppState, resetUserProgressState } from './state.js';
import { UI } from './ui.js';
import { ApiService } from './services/api.js';
import { AuthView } from './views/auth.js';
import { CourseView } from './views/course.js';
import { AdminView } from './views/admin.js';

// [NEW] Centralized faction information for scalability
const FACTION_MAP = {
    it_dept: { name: 'IT技术部', color: 'blue' },
    im_dept: { name: '信息管理部', color: 'cyan' },
    pmo_dept: { name: '项目综合管理部', color: 'indigo' },
    dm_dept: { name: '数据管理部', color: 'emerald' },
    strategy_dept: { name: '战略管理部', color: 'amber' },
    logistics_dept: { name: '物流IT部', color: 'orange' },
    aoc_dept: { name: '项目AOC', color: 'rose' },
    '3333_dept': { name: '3333', color: 'purple' },
    // Fallback for old data or any unknown factions
    tianming: { name: 'IT技术部', color: 'blue' }, // For smooth transition
    nishang: { name: '项目综合管理部', color: 'indigo' }, // For smooth transition
    default: { name: '未知部门', color: 'gray' }
};

const getFactionInfo = (factionId) => {
    return FACTION_MAP[factionId] || FACTION_MAP.default;
};

const App = {
    init() {
        this.bindEvents();
        this.initLandingPage();
        ApiService.db.auth.onAuthStateChange((_, session) => {
            if (session) {
                this.handleLogin(session.user);
            } else {
                AppState.user = null; AppState.profile = null;
                resetUserProgressState();
                UI.switchTopLevelView('landing');
                this.updateLandingPageLeaderboards();
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
                if (entry.isIntersecting) entry.target.classList.add('is-visible');
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
                    const isCurrentUser = AppState.user && p.user_id === AppState.user.id;
                    const icon = ['🥇', '🥈', '🥉'][rank - 1] || `<span class="rank-number">${rank}</span>`;
                    return `<div class="personal-leaderboard-item rank-${rank} ${isCurrentUser ? 'current-user' : ''}">
                                <div class="rank-icon">${icon}</div>
                                <div class="player-name">${p.username.split('@')[0]}</div>
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
            const factionInfo = getFactionInfo(faction);
            UI.showNotification(`你已加入【${factionInfo.name}】！`, 'success');
            this.loadMainAppData();
        } catch (error) {
            console.error("Error during faction selection:", error);
            UI.showNotification(error.message, 'error');
        }
    },

    async loadMainAppData() {
        try {
            this.updateLandingPageLeaderboards();
            
            const [progress, categories] = await Promise.all([
                ApiService.getUserProgress(AppState.user.id),
                ApiService.fetchLearningMap(),
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
            ApiService.db.channel('public:scores').on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
                CourseView.updateLeaderboard();
                this.updateLandingPageLeaderboards();
            }).subscribe();
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
