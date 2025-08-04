import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { CourseView } from './course.js';
export const AdminView = {
    _currentDeletion: { type: null, id: null },
    bindAdminEvents() {
        const { admin, deleteConfirmModal } = UI.elements;
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
        admin.modal.saveBtn.addEventListener('click', () => this.handleSave());
        admin.modal.cancelBtn.addEventListener('click', () => this.closeModal());
        deleteConfirmModal.confirmBtn.addEventListener('click', () => this.confirmDeletion());
        deleteConfirmModal.cancelBtn.addEventListener('click', () => this.hideDeleteConfirmation());
    },
    async showAdminView() { UI.switchCourseView('admin-management'); this.showCategoryList(); },
    switchAdminView(view) {
        const { categoryListView, chapterListView, sectionListView, blockEditorView } = UI.elements.admin;
        [categoryListView, chapterListView, sectionListView, blockEditorView].forEach(v => v.classList.add('hidden'));
        switch(view) {
            case 'categories': categoryListView.classList.remove('hidden'); break;
            case 'chapters': chapterListView.classList.remove('hidden'); break;
            case 'sections': sectionListView.classList.remove('hidden'); break;
            case 'blocks': blockEditorView.classList.remove('hidden'); break;
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
    updateBreadcrumb() {
        const { breadcrumb } = UI.elements.admin;
        const { selectedCategory, selectedChapter, selectedSection } = AppState.admin;
        let html = `<a href="#" data-nav="categories" class="hover:underline">篇章管理</a>`;
        if (selectedCategory) html += ` <span class="mx-2">/</span> <a href="#" data-nav="chapters" data-id="${selectedCategory.id}" class="hover:underline">${selectedCategory.title}</a>`;
        if (selectedChapter) html += ` <span class="mx-2">/</span> <a href="#" data-nav="sections" data-id="${selectedChapter.id}" class="hover:underline">${selectedChapter.title}</a>`;
        if (selectedSection) html += ` <span class="mx-2">/</span> <span class="font-semibold">${selectedSection.title}</span>`;
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
            }
            UI.showNotification('保存成功', 'success'); this.closeModal();
            this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`保存失败: ${error.message}`, 'error'); }
    },
    async refreshAdminViewAfterSave() {
        const freshData = await ApiService.fetchAllCategoriesForAdmin(); AppState.admin.categories = freshData;
        switch(AppState.admin.view) {
            case 'categories': this.renderCategoryList(); break;
            case 'chapters': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); this.renderChapterList(); break;
            case 'sections': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); this.renderSectionList(); break;
            case 'blocks': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); AppState.admin.selectedSection = AppState.admin.selectedChapter.sections.find(s => s.id === AppState.admin.selectedSection.id); this.renderBlockList(); break;
        }
    },
    showDeleteConfirmation(type, id, name) { this._currentDeletion = { type, id }; UI.elements.deleteConfirmModal.message.innerHTML = `您确定要删除 "${name}" 吗？<br><strong class="text-red-400">此操作不可撤销。</strong>`; UI.elements.deleteConfirmModal.container.classList.remove('hidden'); UI.elements.deleteConfirmModal.container.classList.add('flex'); },
    hideDeleteConfirmation() { UI.elements.deleteConfirmModal.container.classList.add('hidden'); },
    async confirmDeletion() {
        const { type, id } = this._currentDeletion; if (!type || !id) return; this.hideDeleteConfirmation();
        try {
            switch (type) { case 'category': await ApiService.deleteCategory(id); break; case 'chapter': await ApiService.deleteChapter(id); break; case 'section': await ApiService.deleteSection(id); break; case 'block': await ApiService.deleteBlock(id); break; }
            UI.showNotification('删除成功', 'success');
            await this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`删除失败: ${error.message}`, 'error'); }
    },
    handleCategoryListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.categories.find(c => c.id == id); if (!i) return; switch (action) { case 'view-chapters': this.showChapterList(i); break; case 'edit': this.openModal('category', i); break; case 'delete': this.showDeleteConfirmation('category', id, i.title); break; } },
    handleChapterListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedCategory.chapters.find(c => c.id == id); if (!i) return; switch (action) { case 'view-sections': this.showSectionList(i); break; case 'edit': this.openModal('chapter', i); break; case 'delete': this.showDeleteConfirmation('chapter', id, i.title); break; } },
    handleSectionListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedChapter.sections.find(s => s.id == id); if (!i) return; switch (action) { case 'view-blocks': this.showBlockEditor(i); break; case 'edit': this.openModal('section', i); break; case 'delete': this.showDeleteConfirmation('section', id, i.title); break; } },
    handleBlockListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedSection.blocks.find(b => b.id == id); if (!i) return; switch (action) { case 'edit': this.openModal('block', i); break; case 'delete': this.showDeleteConfirmation('block', id, i.title); break; } },
    handleBreadcrumbClick(e) {
        e.preventDefault(); const t = e.target.closest('a'); if (!t) return; const { nav, id } = t.dataset;
        switch (nav) {
            case 'categories': this.showCategoryList(); break;
            case 'chapters': this.showChapterList(AppState.admin.categories.find(c => c.id == id)); break;
            case 'sections': this.showSectionList(AppState.admin.selectedCategory.chapters.find(c => c.id == id)); break;
        }
    }
};
