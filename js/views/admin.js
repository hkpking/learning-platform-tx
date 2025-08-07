import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { CourseView } from './course.js';

export const AdminView = {
    _currentDeletion: { type: null, id: null },
    bindAdminEvents() {
        const { admin, deleteConfirmModal } = UI.elements;
        // 绑定主管理视图的事件
        admin.backToLearningBtn.addEventListener('click', () => CourseView.showCategoryView());
        admin.categoriesTableContainer.addEventListener('click', (e) => this.handleCategoryListAction(e));
        admin.chaptersTableContainer.addEventListener('click', (e) => this.handleChapterListAction(e));
        admin.sectionsTableContainer.addEventListener('click', (e) => this.handleSectionListAction(e));
        admin.blocksList.addEventListener('click', (e) => this.handleBlockListAction(e));
        admin.addCategoryBtn.addEventListener('click', () => this.openModal('category'));
        admin.addChapterBtn.addEventListener('click', () => this.openModal('chapter'));
        admin.addSectionBtn.addEventListener('click', () => this.openModal('section'));
        admin.addNewBlockBtn.addEventListener('click', () => this.openModal('block'));
        admin.breadcrumb.addEventListener('click', (e) => this.handleBreadcrumbClick(e));
        
        // 绑定模态窗口事件
        admin.modal.saveBtn.addEventListener('click', () => this.handleSave());
        admin.modal.cancelBtn.addEventListener('click', () => this.closeModal());
        
        // 绑定删除确认模态窗口事件
        deleteConfirmModal.confirmBtn.addEventListener('click', () => this.confirmDeletion());
        deleteConfirmModal.cancelBtn.addEventListener('click', () => this.hideDeleteConfirmation());

        // 部门挑战管理事件绑定
        admin.challengesTableContainer.addEventListener('click', (e) => this.handleChallengeListAction(e));
        admin.addChallengeBtn.addEventListener('click', () => this.openModal('challenge'));
    },
    async showAdminView() { 
        UI.switchCourseView('admin-management'); 
        this.showCategoryList(); 
        const navButtons = UI.elements.admin.adminNav.querySelectorAll('button[data-admin-view]');
        if (navButtons.length > 0) {
            navButtons[0].classList.add('active');
        }
    },
    switchAdminView(view) {
        const { categoryListView, chapterListView, sectionListView, blockEditorView, challengesListView } = UI.elements.admin;
        [categoryListView, chapterListView, sectionListView, blockEditorView, challengesListView].forEach(v => v.classList.add('hidden'));
        switch(view) {
            case 'categories': categoryListView.classList.remove('hidden'); break;
            case 'chapters': chapterListView.classList.remove('hidden'); break;
            case 'sections': sectionListView.classList.remove('hidden'); break;
            case 'blocks': blockEditorView.classList.remove('hidden'); break;
            case 'challenges': challengesListView.classList.remove('hidden'); break;
        }
        AppState.admin.view = view; this.updateBreadcrumb();
    },
    async showCategoryList() {
        this.switchAdminView('categories');
        AppState.admin.selectedCategory = AppState.admin.selectedChapter = AppState.admin.selectedSection = null;
        const container = UI.elements.admin.categoriesTableContainer;
        UI.renderLoading(container);
        try {
            AppState.admin.categories = await ApiService.fetchAllCategoriesForAdmin();
            this.renderCategoryList();
        } catch (error) { UI.renderError(container, error.message); }
    },
    renderCategoryList() {
        const container = UI.elements.admin.categoriesTableContainer;
        const cats = AppState.admin.categories;
        if (!cats || cats.length === 0) { UI.renderEmpty(container, '没有篇章。请添加一个新篇章。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${cats.map(c => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${c.order}</td><td class="px-6 py-4 font-medium text-gray-900">${c.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-chapters" data-id="${c.id}" class="font-medium text-blue-600 hover:underline">管理章节</button><button data-action="edit" data-id="${c.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="category" data-id="${c.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showChapterList(cat) { AppState.admin.selectedCategory = cat; this.switchAdminView('chapters'); UI.elements.admin.chapterListTitle.textContent = `章节管理: ${cat.title}`; this.renderChapterList(); },
    renderChapterList() {
        const container = UI.elements.admin.chaptersTableContainer;
        const chapters = AppState.admin.selectedCategory.chapters || [];
        if (chapters.length === 0) { UI.renderEmpty(container, '没有章节。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${chapters.map(c => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${c.order}</td><td class="px-6 py-4 font-medium text-gray-900">${c.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-sections" data-id="${c.id}" class="font-medium text-blue-600 hover:underline">管理小节</button><button data-action="edit" data-id="${c.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="chapter" data-id="${c.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showSectionList(chap) { AppState.admin.selectedChapter = chap; this.switchAdminView('sections'); UI.elements.admin.sectionListTitle.textContent = `小节管理: ${chap.title}`; this.renderSectionList(); },
    renderSectionList() {
        const container = UI.elements.admin.sectionsTableContainer;
        const sections = AppState.admin.selectedChapter.sections || [];
        if (sections.length === 0) { UI.renderEmpty(container, '没有小节。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${sections.map(s => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${s.order}</td><td class="px-6 py-4 font-medium text-gray-900">${s.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-blocks" data-id="${s.id}" class="font-medium text-blue-600 hover:underline">管理内容块</button><button data-action="edit" data-id="${s.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="section" data-id="${s.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showBlockEditor(sec) { AppState.admin.selectedSection = sec; this.switchAdminView('blocks'); UI.elements.admin.editorSectionTitle.textContent = `内容块管理: ${sec.title}`; this.renderBlockList(); },
    renderBlockList() {
        const container = UI.elements.admin.blocksList;
        const blocks = AppState.admin.selectedSection.blocks || [];
        container.innerHTML = '';
        if (blocks.length === 0) { UI.renderEmpty(container, '没有内容块。'); return; }
        blocks.forEach(block => {
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-lg shadow flex justify-between items-start';
            let type = '内容';
            if(block.quiz_question) type = '测验'; else if(block.document_url) type = '文档'; else if(block.video_url) type = '视频';
            el.innerHTML = `<div><div class="font-bold text-lg text-gray-800">${block.order}. ${block.title}</div><div class="text-sm text-gray-500 mt-1">类型: ${type}</div></div><div class="flex-shrink-0 ml-4 space-x-2"><button data-action="edit" data-id="${block.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="block" data-id="${block.id}" class="font-medium text-red-600 hover:underline">删除</button></div>`;
            container.appendChild(el);
        });
    },
    async showChallengesList() {
        this.switchAdminView('challenges');
        const container = UI.elements.admin.challengesTableContainer;
        UI.renderLoading(container);
        try {
            const challenges = await ApiService.fetchChallengesForAdmin();
            AppState.admin.challenges = challenges;
            this.renderChallengesList(challenges);
        } catch (error) { UI.renderError(container, error.message); }
    },
    renderChallengesList(challenges) {
        const container = UI.elements.admin.challengesTableContainer;
        if (!challenges || challenges.length === 0) { UI.renderEmpty(container, '没有挑战。请添加一个新挑战。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">标题</th><th class="px-6 py-3">目标篇章</th><th class="px-6 py-3">状态</th><th class="px-6 py-3">奖励</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${challenges.map(c => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4 font-medium text-gray-900">${c.title}</td><td class="px-6 py-4">${c.target_category_title || '无'}</td><td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${c.is_active ? '活跃中' : '已关闭'}</span></td><td class="px-6 py-4">${c.reward_points} 分</td><td class="px-6 py-4 text-right space-x-2">${c.is_active ? `<button data-action="end-challenge" data-id="${c.id}" class="font-medium text-green-600 hover:underline">结算</button>` : ''}<button data-action="edit" data-type="challenge" data-id="${c.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="challenge" data-id="${c.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    updateBreadcrumb() {
        const { breadcrumb } = UI.elements.admin;
        const { selectedCategory, selectedChapter, selectedSection, view } = AppState.admin;
        let html = '';
        if (view === 'challenges') {
            html = `<span class="font-semibold">部门挑战管理</span>`;
        } else {
            html = `<a href="#" data-nav="categories" class="hover:underline">内容管理</a>`;
            if (selectedCategory) html += ` <span class="mx-2">/</span> <a href="#" data-nav="chapters" data-id="${selectedCategory.id}" class="hover:underline">${selectedCategory.title}</a>`;
            if (selectedChapter) html += ` <span class="mx-2">/</span> <a href="#" data-nav="sections" data-id="${selectedChapter.id}" class="hover:underline">${selectedChapter.title}</a>`;
            if (selectedSection) html += ` <span class="mx-2">/</span> <span class="font-semibold">${selectedSection.title}</span>`;
        }
        breadcrumb.innerHTML = html;
    },
    openModal(type, item = null) {
        AppState.admin.editingItem = item; AppState.admin.editingType = type;
        const { modal } = UI.elements.admin; modal.form.innerHTML = '';
        const v = (key, def = '') => item ? (item[key] !== null && item[key] !== undefined ? item[key] : def) : def;
        let formHtml = '';
        switch (type) {
            case 'category': modal.title.textContent = item ? '编辑篇章' : '新增篇章'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">描述</label><textarea name="description" class="admin-textarea" rows="3">${v('description')}</textarea></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'chapter': modal.title.textContent = item ? '编辑章节' : '新增章节'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">描述</label><textarea name="description" class="admin-textarea" rows="3">${v('description')}</textarea></div><div><label class="admin-label">封面图片URL</label><input name="image_url" class="admin-input" value="${v('image_url')}"></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'section': modal.title.textContent = item ? '编辑小节' : '新增小节'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'block':
                modal.title.textContent = item ? '编辑内容块' : '新增内容块';
                const opts = v('quiz_options', ['','','','']);
                const correctIdx = v('correct_answer_index', 0);
                formHtml = `<p class="text-sm text-gray-500">提示：一个内容块可以同时包含视频、文档和Markdown内容。</p><div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div><hr class="my-4"><h4 class="text-lg font-semibold mb-2">内容选项</h4><div><label class="admin-label">视频URL</label><input name="video_url" class="admin-input" value="${v('video_url')}" placeholder="https://example.com/video.mp4"></div><div><label class="admin-label">在线文档URL</label><input name="document_url" class="admin-input" value="${v('document_url')}" placeholder="https://kdocs.cn/l/..."><p class="text-xs text-gray-500 mt-1">请粘贴“公开分享”或“嵌入”链接。</p></div><div><label class="admin-label">内容 (Markdown)</label><textarea name="content_markdown" class="admin-textarea" rows="8">${v('content_markdown')}</textarea></div><hr class="my-4"><h4 class="text-lg font-semibold mb-2">测验 (可选)</h4><p class="text-sm text-gray-500">填写问题后，此内容块将变为测验。</p><div><label class="admin-label">问题</label><input name="quiz_question" class="admin-input" value="${v('quiz_question')}"></div><div><label class="admin-label">选项</label><input name="quiz_options_0" class="admin-input mb-2" placeholder="选项 A" value="${opts[0] || ''}"><input name="quiz_options_1" class="admin-input mb-2" placeholder="选项 B" value="${opts[1] || ''}"><input name="quiz_options_2" class="admin-input mb-2" placeholder="选项 C" value="${opts[2] || ''}"><input name="quiz_options_3" class="admin-input" placeholder="选项 D" value="${opts[3] || ''}"></div><div><label class="admin-label">正确答案</label><select name="correct_answer_index" class="admin-select"><option value="0" ${correctIdx == 0 ? 'selected' : ''}>选项 A</option><option value="1" ${correctIdx == 1 ? 'selected' : ''}>选项 B</option><option value="2" ${correctIdx == 2 ? 'selected' : ''}>选项 C</option><option value="3" ${correctIdx == 3 ? 'selected' : ''}>选项 D</option></select></div>`;
                break;
            case 'challenge':
                modal.title.textContent = item ? '编辑挑战' : '新增挑战';
                const categoryOptions = AppState.admin.categories.map(c => `<option value="${c.id}" ${v('target_category_id') === c.id ? 'selected' : ''}>${c.title}</option>`).join('');
                formHtml = `
                    <div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div>
                    <div><label class="admin-label">描述</label><textarea name="description" class="admin-textarea" rows="3">${v('description')}</textarea></div>
                    <div><label class="admin-label">目标篇章</label><select name="target_category_id" class="admin-select" required><option value="">选择篇章</option>${categoryOptions}</select></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="admin-label">开始时间</label><input name="start_date" type="datetime-local" class="admin-input" value="${v('start_date', new Date().toISOString().substring(0, 16))}" required></div>
                        <div><label class="admin-label">结束时间</label><input name="end_date" type="datetime-local" class="admin-input" value="${v('end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16))}" required></div>
                    </div>
                    <div><label class="admin-label">奖励积分</label><input name="reward_points" type="number" class="admin-input" value="${v('reward_points', 0)}" required></div>
                    <div class="flex items-center space-x-2"><input id="is_active" name="is_active" type="checkbox" class="admin-checkbox" ${v('is_active', true) ? 'checked' : ''}><label for="is_active" class="admin-label">是否活跃</label></div>
                `;
                break;
        }
        modal.form.innerHTML = formHtml; modal.backdrop.classList.add('active'); modal.container.classList.remove('hidden');
    },
    closeModal() { const { modal } = UI.elements.admin; modal.backdrop.classList.remove('active'); modal.container.classList.add('hidden'); AppState.admin.editingItem = null; AppState.admin.editingType = null; },
    async handleSave() {
        const { form } = UI.elements.admin.modal; const formData = new FormData(form); const data = {};
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('quiz_options')) {
                if (!data.quiz_options) data.quiz_options = [];
                data.quiz_options[parseInt(key.split('_')[2])] = value;
            } else { data[key] = value; }
        }
        const type = AppState.admin.editingType; const item = AppState.admin.editingItem;
        try {
            switch (type) {
                case 'category': await ApiService.upsertCategory({ id: item?.id, ...data }); break;
                case 'chapter': await ApiService.upsertChapter({ id: item?.id, category_id: AppState.admin.selectedCategory.id, ...data }); break;
                case 'section': await ApiService.upsertSection({ id: item?.id, chapter_id: AppState.admin.selectedChapter.id, ...data }); break;
                case 'block':
                    data.correct_answer_index = data.quiz_question ? parseInt(data.correct_answer_index) : null;
                    data.quiz_options = data.quiz_question ? data.quiz_options.filter(o => o) : null;
                    await ApiService.upsertBlock({ id: item?.id, section_id: AppState.admin.selectedSection.id, ...data });
                    break;
                case 'challenge':
                    data.is_active = data.is_active === 'on';
                    await ApiService.upsertChallenge({ id: item?.id, ...data });
                    break;
            }
            UI.showNotification('保存成功', 'success'); this.closeModal();
            this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`保存失败: ${error.message}`, 'error'); }
    },
    async refreshAdminViewAfterSave() {
        if (AppState.admin.view === 'challenges') {
            await this.showChallengesList();
        } else {
            const freshData = await ApiService.fetchAllCategoriesForAdmin(); 
            AppState.admin.categories = freshData;
            switch(AppState.admin.view) {
                case 'categories': this.renderCategoryList(); break;
                case 'chapters': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); this.renderChapterList(); break;
                case 'sections': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); this.renderSectionList(); break;
                case 'blocks': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); AppState.admin.selectedSection = AppState.admin.selectedChapter.sections.find(s => s.id === AppState.admin.selectedSection.id); this.renderBlockList(); break;
            }
        }
    },
    showDeleteConfirmation(type, id, name) { this._currentDeletion = { type, id }; UI.elements.deleteConfirmModal.message.innerHTML = `您确定要删除 "${name}" 吗？<br><strong class="text-red-400">此操作不可撤销。</strong>`; UI.elements.deleteConfirmModal.container.classList.remove('hidden'); UI.elements.deleteConfirmModal.container.classList.add('flex'); },
    hideDeleteConfirmation() { UI.elements.deleteConfirmModal.container.classList.add('hidden'); },
    async confirmDeletion() {
        const { type, id } = this._currentDeletion; if (!type || !id) return; this.hideDeleteConfirmation();
        try {
            switch (type) { 
                case 'category': await ApiService.deleteCategory(id); break; 
                case 'chapter': await ApiService.deleteChapter(id); break; 
                case 'section': await ApiService.deleteSection(id); break; 
                case 'block': await ApiService.deleteBlock(id); break; 
                case 'challenge': await ApiService.deleteChallenge(id); break;
            }
            UI.showNotification('删除成功', 'success');
            await this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`删除失败: ${error.message}`, 'error'); }
    },
    handleCategoryListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.categories.find(c => c.id == id); if (!i) return; switch (action) { case 'view-chapters': this.showChapterList(i); break; case 'edit': this.openModal('category', i); break; case 'delete': this.showDeleteConfirmation('category', id, i.title); break; } },
    handleChapterListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedCategory.chapters.find(c => c.id == id); if (!i) return; switch (action) { case 'view-sections': this.showSectionList(i); break; case 'edit': this.openModal('chapter', i); break; case 'delete': this.showDeleteConfirmation('chapter', id, i.title); break; } },
    handleSectionListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedChapter.sections.find(s => s.id == id); if (!i) return; switch (action) { case 'view-blocks': this.showBlockEditor(i); break; case 'edit': this.openModal('section', i); break; case 'delete': this.showDeleteConfirmation('section', id, i.title); break; } },
    handleBlockListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedSection.blocks.find(b => b.id == id); if (!i) return; switch (action) { case 'edit': this.openModal('block', i); break; case 'delete': this.showDeleteConfirmation('block', id, i.title); break; } },
    handleChallengeListAction(e) {
        const t = e.target.closest('button');
        if (!t) return;
        const { action, id } = t.dataset;
        const i = AppState.admin.challenges.find(c => c.id == id);
        if (!i) return;
        switch (action) {
            case 'edit': this.openModal('challenge', i); break;
            case 'delete': this.showDeleteConfirmation('challenge', id, i.title); break;
            // [NEW] 结算挑战的动作
            case 'end-challenge': this.handleEndChallenge(id, i.title); break;
        }
    },
    async handleEndChallenge(challengeId, challengeTitle) {
        // 使用一个简单的确认对话框（您可以用自定义的模态窗口替换）
        if (confirm(`您确定要结算挑战 "${challengeTitle}" 吗？此操作将分发奖励并结束挑战。`)) {
            try {
                UI.showNotification('正在结算挑战...', 'info');
                await ApiService.finishChallenge(challengeId);
                UI.showNotification('挑战结算成功！', 'success');
                await this.showChallengesList(); // 重新加载挑战列表
            } catch (error) {
                UI.showNotification(error.message, 'error');
            }
        }
    },
    handleBreadcrumbClick(e) {
        e.preventDefault(); const t = e.target.closest('a'); if (!t) return; const { nav, id } = t.dataset;
        switch (nav) {
            case 'categories': this.showCategoryList(); break;
            case 'chapters': this.showChapterList(AppState.admin.categories.find(c => c.id == id)); break;
            case 'sections': this.showSectionList(AppState.admin.selectedCategory.chapters.find(c => c.id == id)); break;
        }
    }
};
