/**
 * @file app.js
 * @description The main entry point for the application.
 * [v2.3.1] Updated to handle admin challenge view.
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
    _latestLeaderboardRequest: 0,
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
        UI.elements.mainApp.profileViewBtn.addEventListener('click', () => ProfileView.showProfileView());
        UI.elements.profile.backToMainAppBtn.addEventListener('click', () => UI.switchTopLevelView('main'));
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

        // [NEW] Admin View Navigation
        UI.elements.admin.adminNav.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-admin-view]');
            if (button) {
                const view = button.dataset.adminView;
                UI.elements.admin.adminNav.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (view === 'challenges') {
                    AdminView.showChallengesList();
                } else {
                    AdminView.showCategoryList(); // Default to category list
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
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger the animation by adding a delay based on the element's order
                    entry.target.style.animationDelay = `${index * 100}ms`;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
        
        try {
            const challenges = await ApiService.fetchActiveChallenges();
            AppState.activeChallenges = challenges;
        } catch (error) {
            console.error('获取活跃挑战失败:', error);
        }

        this.updateLandingPageLeaderboards();
    },
    
    async updateLandingPageLeaderboards() {
        const requestId = ++this._latestLeaderboardRequest;
        const { personalBoard, factionBoard } = UI.elements.landing;
        UI.renderLoading(personalBoard, 'leaderboard');
        UI.renderLoading(factionBoard, 'faction-leaderboard');
        
        const challengeContainer = document.getElementById('active-challenge-container');
        const challengeSection = document.getElementById('challenge-section');
        challengeContainer.innerHTML = '';
        if (AppState.activeChallenges && AppState.activeChallenges.length > 0) {
            challengeSection.classList.remove('hidden');
            AppState.activeChallenges.forEach(challenge => {
                const challengeCard = document.createElement('div');
                challengeCard.className = 'bg-slate-800/50 p-6 rounded-lg text-center';
                challengeCard.innerHTML = `
                    <h3 class="text-2xl font-bold text-amber-300 mb-2">${challenge.title}</h3>
                    <p class="text-gray-400 mb-4">${challenge.description}</p>
                    <p class="text-sm text-gray-500">挑战时间: ${new Date(challenge.start_date).toLocaleDateString()} - ${new Date(challenge.end_date).toLocaleDateString()}</p>
                `;
                challengeContainer.appendChild(challengeCard);
            });
        } else {
            challengeSection.classList.add('hidden');
        }

        try {
            const [personalData, factionData] = await Promise.all([
                ApiService.fetchLeaderboard(),
                ApiService.fetchFactionLeaderboard()
            ]);

            if (requestId !== this._latestLeaderboardRequest) {
                return;
            }

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

            // New logic for Smart Nav
            this.setupSmartNavigation();
            this.renderCourseList();

            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', !AppState.profile || AppState.profile.role !== 'admin');
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${AppState.profile.full_name || AppState.user.email.split('@')[0]}`;
            UI.switchTopLevelView('main'); // This might need to change if the user lands on a different default view
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

    setupSmartNavigation() {
        const smartNavContainer = document.getElementById('smart-nav-container');
        const mainHubTitle = document.getElementById('main-hub-title');
        const startBtn = document.getElementById('new-start-btn');
        const continueLearningBtn = document.getElementById('continue-learning-btn');
        const continueLearningTitle = document.getElementById('continue-learning-title');
        const smartNavUsername = document.getElementById('smart-nav-username');

        const firstUncompleted = AppState.learningMap.flatStructure.find(b => !AppState.userProgress.completedBlocks.has(b.id));

        if (AppState.user && AppState.profile) {
            smartNavUsername.textContent = AppState.profile.full_name || AppState.user.email.split('@')[0];
            smartNavContainer.classList.remove('hidden');
            mainHubTitle.classList.add('hidden');
            startBtn.classList.add('hidden');

            if (firstUncompleted) {
                const chapter = AppState.learningMap.categories
                    .flatMap(c => c.chapters)
                    .find(ch => ch.id === firstUncompleted.chapterId);

                continueLearningTitle.textContent = `${chapter.title} - ${firstUncompleted.title}`;

                const clickHandler = () => {
                    CourseView.selectChapter(firstUncompleted.chapterId);
                    // A small delay to allow the view to switch before selecting the block
                    setTimeout(() => {
                        CourseView.selectBlock(firstUncompleted.id);
                    }, 100);
                };

                continueLearningBtn.onclick = clickHandler;
                document.getElementById('continue-learning-card').onclick = clickHandler;

            } else {
                continueLearningTitle.textContent = "恭喜你，已完成所有课程！";
                continueLearningBtn.textContent = "重新学习";
                continueLearningBtn.onclick = () => this.handleRestartRequest();
            }
        } else {
            smartNavContainer.classList.add('hidden');
            mainHubTitle.classList.remove('hidden');
            startBtn.classList.remove('hidden');
        }
    },

    renderCourseList() {
        const container = document.getElementById('course-list-container');
        if (!container || !AppState.user) {
            if(container) container.innerHTML = '';
            return;
        };

        const categories = AppState.learningMap.categories;
        if (!categories || categories.length === 0) {
            container.innerHTML = '<p class="text-gray-500">暂无课程篇章。</p>';
            return;
        }

        let html = '<h2 class="text-3xl text-amber-100 font-calligraphy tracking-wider mb-6">我的学习路径</h2>';

        html += categories.map(category => {
            const allBlocks = AppState.learningMap.flatStructure.filter(b => b.categoryId === category.id);
            const completedBlocks = allBlocks.filter(b => AppState.userProgress.completedBlocks.has(b.id));
            const progress = allBlocks.length > 0 ? Math.round((completedBlocks.length / allBlocks.length) * 100) : 0;

            return `
                <div class="course-card hub-card p-6 mb-4 flex justify-between items-center transition-all duration-300 hover:shadow-lg hover:border-sky-500/50 cursor-pointer" onclick="CourseView.selectCategory('${category.id}')">
                    <div>
                        <h3 class="text-xl font-bold text-white">${category.title}</h3>
                        <p class="text-sm text-gray-400 mt-1">${category.description}</p>
                    </div>
                    <div class="w-1/4 text-right ml-4">
                        <p class="text-lg font-bold text-sky-400">${progress}%</p>
                        <div class="w-full bg-slate-700 rounded-full h-2.5 mt-1">
                            <div class="bg-sky-500 h-2.5 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
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

window.onload = () => {
    try {
        ApiService.initialize();
        App.init();
    } catch (error) {
        console.error("Failed to initialize application:", error);
        document.body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;"><h1>Application Failed to Start</h1><p>${error.message}</p></div>`;
    }
};
