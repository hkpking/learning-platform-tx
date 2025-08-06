import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { ComponentFactory } from '../components/factory.js';

export const CourseView = {
    async showCategoryView() {
        UI.switchCourseView('category-selection');
        const grid = UI.elements.mainApp.categoryGrid;
        const categories = AppState.learningMap.categories;
        grid.innerHTML = '';
        if (!categories || categories.length === 0) { UI.renderEmpty(grid, '暂无课程篇章，敬请期待！'); return; }
        categories.forEach(c => grid.appendChild(ComponentFactory.createCategoryCard(c, !this.isCategoryUnlocked(c.id))));
    },

    isCategoryUnlocked(categoryId) {
        const cats = AppState.learningMap.categories;
        const catIdx = cats.findIndex(c => c.id === categoryId);
        if (catIdx <= 0) return true;
        const prevCat = cats[catIdx - 1];
        if (!prevCat) return true;
        const prevCatBlocks = AppState.learningMap.flatStructure.filter(b => b.categoryId === prevCat.id);
        if (prevCatBlocks.length === 0) return false;
        return prevCatBlocks.every(b => AppState.userProgress.completedBlocks.has(b.id));
    },

    showChapterView() {
        const cat = AppState.learningMap.categories.find(c => c.id === AppState.current.categoryId);
        if (!cat) return;
        UI.switchCourseView('chapter-selection');
        UI.elements.mainApp.chapterTitle.textContent = cat.title;
        UI.elements.mainApp.chapterDesc.textContent = cat.description;
        const grid = UI.elements.mainApp.chapterGrid;
        grid.innerHTML = '';
        if (!cat.chapters || cat.chapters.length === 0) { UI.renderEmpty(grid, '本篇章下暂无章节。'); return; }
        cat.chapters.forEach(ch => grid.appendChild(ComponentFactory.createChapterCard(ch)));
    },

    async updateLeaderboard() {
        const { leaderboardList, leaderboardFactionList, leaderboardPersonalTab, leaderboardFactionTab, personalBoardContent, factionBoardContent } = UI.elements;

        // 添加Tab切换事件监听 (如果尚未添加)
        if (!leaderboardPersonalTab.hasAttribute('data-listener')) {
            leaderboardPersonalTab.setAttribute('data-listener', 'true');
            leaderboardPersonalTab.addEventListener('click', () => {
                leaderboardPersonalTab.classList.add('active');
                leaderboardFactionTab.classList.remove('active');
                personalBoardContent.classList.add('active');
                factionBoardContent.classList.remove('active');
            });
        }
        if (!leaderboardFactionTab.hasAttribute('data-listener')) {
            leaderboardFactionTab.setAttribute('data-listener', 'true');
            leaderboardFactionTab.addEventListener('click', () => {
                leaderboardFactionTab.classList.add('active');
                leaderboardPersonalTab.classList.remove('active');
                factionBoardContent.classList.add('active');
                personalBoardContent.classList.remove('active');
            });
        }
        
        // 同时获取个人和部门榜数据
        try {
            const [personalData, factionData] = await Promise.all([
                ApiService.fetchLeaderboard(),
                ApiService.fetchFactionLeaderboard()
            ]);

            // 渲染个人榜
            leaderboardList.innerHTML = "";
            if (!personalData || personalData.length === 0) {
                leaderboardList.innerHTML = `<p class="text-center text-sm text-gray-400">暂无个人排名</p>`;
            } else {
                personalData.forEach((p, i) => {
                    const rank = i + 1;
                    const item = document.createElement("div");
                    item.className = `rank-item rank-${rank} flex items-center p-2 rounded-md ${AppState.user && AppState.user.email === p.username ? "bg-blue-500/30" : ""}`;
                    let rankBadge = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `<div class="rank-badge flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg mr-3">${rank}</div>`;
                    item.innerHTML = `<div class="w-10 text-center text-xl">${rankBadge}</div><div class="flex-grow"><div class="font-bold text-white truncate">${p.username.split("@")[0]}</div><div class="text-sm text-gray-400">${p.points} 分</div></div>`;
                    leaderboardList.appendChild(item);
                });
            }

            // 渲染部门榜
            const FACTION_MAP = {
                it_dept: { name: 'IT技术部', color: 'blue' },
                im_dept: { name: '信息管理部', color: 'cyan' },
                pmo_dept: { name: '项目综合管理部', color: 'indigo' },
                dm_dept: { name: '数据管理部', color: 'emerald' },
                strategy_dept: { name: '战略管理部', color: 'amber' },
                logistics_dept: { name: '物流IT部', color: 'orange' },
                aoc_dept: { name: '项目AOC', color: 'rose' },
                '3333_dept': { name: '3333', color: 'purple' },
                tianming: { name: 'IT技术部', color: 'blue' },
                nishang: { name: '项目综合管理部', color: 'indigo' },
                default: { name: '未知部门', color: 'gray' }
            };
            const getFactionInfo = (factionId) => FACTION_MAP[factionId] || FACTION_MAP.default;

            leaderboardFactionList.innerHTML = "";
            if (!factionData || factionData.length === 0) {
                leaderboardFactionList.innerHTML = `<p class="text-center text-sm text-gray-400">暂无部门排名</p>`;
            } else {
                factionData.forEach(f => {
                    const factionInfo = getFactionInfo(f.faction);
                    const item = document.createElement("div");
                    item.className = `faction-leaderboard-item faction-${factionInfo.color} p-3`;
                    item.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="faction-name faction-name-${factionInfo.color} text-base font-bold">${factionInfo.name}</h3>
                                <div class="faction-stats text-xs">
                                    <span>👥 ${f.total_members}人</span> | <span>⭐ ${f.total_points}分</span>
                                </div>
                            </div>
                            <div class="faction-score text-right">
                                <div class="avg-score text-lg">${parseFloat(f.average_score).toFixed(0)}</div>
                                <div class="avg-label text-xs">均分</div>
                            </div>
                        </div>`;
                    leaderboardFactionList.appendChild(item);
                });
            }

        } catch (e) {
            console.error("Failed to update leaderboards:", e);
            UI.renderError(leaderboardList, "无法加载排名");
            UI.renderError(leaderboardFactionList, "无法加载排名");
        }
    },

    selectCategory(id) { AppState.current.categoryId = id; this.showChapterView(); },

    selectChapter(id) { AppState.current.chapterId = id; this.showDetailView(); },

    showDetailView() {
        UI.switchCourseView("chapter-detail");
        this.closeImmersiveViewer();
        const { contentArea, sidebarHeader, sidebarNav } = UI.elements.mainApp;
        UI.renderLoading(contentArea); sidebarNav.innerHTML = ""; sidebarHeader.innerHTML = "";
        try {
            const chap = AppState.learningMap.categories.find(c => c.id === AppState.current.categoryId)?.chapters.find(ch => ch.id === AppState.current.chapterId);
            if (!chap) throw new Error("章节未找到");
            sidebarHeader.innerHTML = `<h2 class="text-xl font-bold text-white">${chap.title}</h2><p class="text-sm text-gray-400 mt-1">${chap.description || ''}</p>`;
            if (!chap.sections || chap.sections.length === 0) { UI.renderEmpty(sidebarNav, "暂无小节"); UI.renderEmpty(contentArea, "本章节暂无内容！"); return; }
            chap.sections.forEach(sec => {
                const group = document.createElement('div');
                group.className = 'section-group';
                group.innerHTML = `<h3 class="section-group-title">${sec.title}</h3>`;
                const ul = document.createElement('ul');
                (sec.blocks || []).forEach(b => ul.appendChild(ComponentFactory.createBlockItem(b, !this.isBlockUnlocked(b.id), AppState.userProgress.completedBlocks.has(b.id))));
                group.appendChild(ul);
                sidebarNav.appendChild(group);
            });
            const firstUncompleted = AppState.learningMap.flatStructure.find(b => b.chapterId === AppState.current.chapterId && this.isBlockUnlocked(b.id) && !AppState.userProgress.completedBlocks.has(b.id));
            const firstBlock = AppState.learningMap.flatStructure.find(b => b.chapterId === AppState.current.chapterId);
            if (firstUncompleted || firstBlock) this.selectBlock((firstUncompleted || firstBlock).id);
            else UI.renderEmpty(contentArea, "恭喜你，已完成所有内容！");
        } catch (e) { console.error("Error loading detail view:", e); UI.renderError(contentArea, "加载章节内容失败: " + e.message); }
    },

    selectBlock(blockId) {
        this.closeImmersiveViewer();
        AppState.current.blockId = blockId;
        UI.elements.mainApp.sidebarNav.querySelectorAll("a.block-item").forEach(item => item.classList.toggle("active", item.dataset.blockId == blockId));
        this.renderBlockContent(blockId);
    },

    renderBlockContent(blockId) {
        const block = AppState.learningMap.flatStructure.find(b => b.id === blockId);
        if (!block) return;
        const area = UI.elements.mainApp.contentArea;
        area.innerHTML = "";
        let mediaRendered = false;
        if (block.video_url) { area.innerHTML += this.createMediaPlaceholder('video', block); mediaRendered = true; }
        if (block.document_url) { area.innerHTML += this.createMediaPlaceholder('document', block); mediaRendered = true; }
        if (block.content_markdown) {
            const mdDiv = document.createElement('div');
            mdDiv.className = `markdown-content ${mediaRendered ? 'mt-6' : ''}`;
            mdDiv.innerHTML = marked.parse(block.content_markdown);
            area.appendChild(mdDiv);
        }
        if (block.quiz_question) {
            if (area.innerHTML.trim() !== '') area.appendChild(document.createElement("hr")).className = "my-8 border-slate-700";
            area.appendChild(ComponentFactory.createQuiz(block, AppState.userProgress.completedBlocks.has(block.id)));
        } else {
            const btn = document.createElement('button');
            if (AppState.userProgress.completedBlocks.has(blockId)) { btn.textContent = '已完成'; btn.disabled = true; btn.className = 'mt-8 w-full md:w-auto px-8 py-3 rounded-lg btn bg-green-600 font-bold text-lg opacity-70'; }
            else { btn.textContent = '标记为已完成'; btn.className = 'mt-8 w-full md:w-auto px-8 py-3 rounded-lg btn btn-primary font-bold text-lg'; btn.onclick = () => this.completeBlock(blockId); }
            const div = document.createElement('div');
            div.className = 'mt-8 pt-8 border-t border-slate-700';
            div.appendChild(btn);
            area.appendChild(div);
        }
    },

    createMediaPlaceholder(type, block) {
        const icon = type === 'video' ? `<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm8 6l-4 3V7l4 3z"></path></svg>` : `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;
        return `<div onclick="CourseView.openImmersiveViewer('${type}', '${block[`${type}_url`]}', '${block.title.replace(/'/g, "\\'")}')" class="relative rounded-lg overflow-hidden cursor-pointer group mb-6"><div class="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors flex items-center justify-center"><div class="text-center"><div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">${icon}</div><h4 class="text-white text-xl font-bold">${block.title}</h4><p class="text-gray-300">${type === 'video' ? '点击播放视频' : '点击打开文档'}</p></div></div><img src="https://placehold.co/800x450/0f172a/38bdf8?text=${encodeURIComponent(block.title)}" alt="${block.title}" class="w-full h-auto"></div>`;
    },

    async completeBlock(blockId) {
        AppState.userProgress.completedBlocks.add(blockId);
        try {
            await ApiService.saveUserProgress(AppState.user.id, { completed: Array.from(AppState.userProgress.completedBlocks), awarded: Array.from(AppState.userProgress.awardedPointsBlocks) });
            this.showDetailView();
        } catch (e) { UI.showNotification(e.message, "error"); AppState.userProgress.completedBlocks.delete(blockId); }
    },

    isBlockUnlocked(blockId) {
        const flat = AppState.learningMap.flatStructure;
        const idx = flat.findIndex(b => b.id === blockId);
        if (idx <= 0) return true;
        return AppState.userProgress.completedBlocks.has(flat[idx - 1].id);
    },

    openImmersiveViewer(type, url, title) {
        const { title: vTitle, content: vContent } = UI.elements.immersiveView;
        vTitle.textContent = title; vContent.innerHTML = '';
        if (type === 'document') vContent.innerHTML = `<iframe src="${url}" allowfullscreen loading="lazy" title="嵌入的在线文档"></iframe>`;
        else if (type === 'video') ComponentFactory.createVideoJsPlayer(vContent, url, { autoplay: true });
        UI.switchTopLevelView('immersive');
    },

    closeImmersiveViewer() {
        if (AppState.current.topLevelView !== 'immersive') return;
        if (AppState.current.activePlayer) AppState.current.activePlayer.dispose();
        UI.elements.immersiveView.content.innerHTML = ''; 
        UI.switchTopLevelView('main');
    }
};

window.CourseView = CourseView;

