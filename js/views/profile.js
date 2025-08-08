import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { getFactionInfo } from '../constants.js';

export const ProfileView = {
    async showProfileView() {
        UI.switchTopLevelView('profile');
        const container = UI.elements.profile.content;
        UI.renderLoading(container, 'content');

        try {
            const userId = AppState.user.id;
            // Ensure we have the latest profile data
            const profile = await ApiService.getProfile(userId);
            AppState.profile = profile;

            const scoreData = await ApiService.getUserScore(userId);
            const points = scoreData ? scoreData.points : 0;

            const totalBlocks = AppState.learningMap.flatStructure.length;
            const completedBlocks = AppState.userProgress.completedBlocks.size;
            const progressPercentage = totalBlocks > 0 ? ((completedBlocks / totalBlocks) * 100).toFixed(0) : 0;

            const factionInfo = getFactionInfo(profile.faction);

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div class="md:col-span-1 text-center" id="profile-identity">
                        <!-- Identity section will be rendered by another function -->
                    </div>
                    <div class="md:col-span-2">
                        <h3 class="text-xl font-bold text-gray-300 mb-6">学习统计</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div class="bg-slate-800/50 p-6 rounded-lg text-center transform hover:scale-105 transition-transform">
                                <p class="text-4xl font-bold text-amber-400">${points}</p>
                                <p class="text-gray-400 mt-2">总学分</p>
                            </div>
                            <div class="bg-slate-800/50 p-6 rounded-lg text-center transform hover:scale-105 transition-transform">
                                <p class="text-4xl font-bold text-emerald-400">${completedBlocks}</p>
                                <p class="text-gray-400 mt-2">已完成内容块</p>
                            </div>
                        </div>
                        <div class="mt-8">
                            <h4 class="font-semibold text-gray-300 mb-2">总学习进度</h4>
                            <div class="w-full bg-slate-700 rounded-full h-4">
                                <div class="bg-gradient-to-r from-sky-500 to-indigo-500 h-4 rounded-full flex items-center justify-end text-xs font-bold pr-2" style="width: ${progressPercentage}%">
                                    <span class="text-white">${progressPercentage}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.renderIdentitySection();

        } catch (error) {
            console.error("Failed to load profile data:", error);
            UI.renderError(container, '无法加载个人主页数据。');
        }
    },

    renderIdentitySection() {
        const container = document.getElementById('profile-identity');
        if (!container) return;

        const profile = AppState.profile;
        const factionInfo = getFactionInfo(profile.faction);
        const emailPrefix = AppState.user.email.split('@')[0];
        const avatarChar = (profile.full_name || emailPrefix).charAt(0).toUpperCase();

        let nameHtml;
        if (profile.full_name) {
            nameHtml = `
                <h2 class="text-2xl font-bold text-white">${profile.full_name}</h2>
                <button id="edit-name-btn" class="text-sm text-sky-400 hover:text-sky-500 transition-colors">编辑姓名</button>
            `;
        } else {
            nameHtml = `
                <form id="profile-name-form">
                    <input type="text" id="profile-name-input" placeholder="请输入您的姓名" class="input-field text-center w-full p-2 rounded-lg" required>
                    <button type="submit" class="w-full mt-2 btn btn-primary text-sm py-2 px-4 rounded-lg">保存姓名</button>
                </form>
            `;
        }

        container.innerHTML = `
            <div class="w-32 h-32 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-4 border-2 border-${factionInfo.color}-500 shadow-lg">
                <span class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-${factionInfo.color}-400 to-white">${avatarChar}</span>
            </div>
            <div id="name-display-area">
                ${nameHtml}
            </div>
            <p class="text-lg text-${factionInfo.color}-400 font-semibold mt-2">${factionInfo.name}</p>
        `;

        this.bindIdentityEvents();
    },

    bindIdentityEvents() {
        const editBtn = document.getElementById('edit-name-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.renderNameEditForm());
        }

        const nameForm = document.getElementById('profile-name-form');
        if (nameForm) {
            nameForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const input = document.getElementById('profile-name-input');
                const newName = input.value.trim();
                if (!newName) return;

                try {
                    const updatedProfile = await ApiService.updateProfile(AppState.user.id, { full_name: newName });
                    AppState.profile = updatedProfile; // Update global state
                    UI.showNotification('姓名更新成功！', 'success');
                    this.renderIdentitySection(); // Re-render the identity section
                } catch (error) {
                    UI.showNotification(error.message, 'error');
                }
            });
        }
    },

    renderNameEditForm() {
        const container = document.getElementById('name-display-area');
        if (!container) return;
        const currentName = AppState.profile.full_name || '';
        container.innerHTML = `
            <form id="profile-name-form">
                <input type="text" id="profile-name-input" value="${currentName}" class="input-field text-center w-full p-2 rounded-lg" required>
                <div class="flex space-x-2 mt-2">
                    <button type="button" id="cancel-edit-name-btn" class="w-full btn bg-gray-600 text-sm py-2 px-4 rounded-lg">取消</button>
                    <button type="submit" class="w-full btn btn-primary text-sm py-2 px-4 rounded-lg">保存</button>
                </div>
            </form>
        `;
        document.getElementById('cancel-edit-name-btn').addEventListener('click', () => this.renderIdentitySection());
        this.bindIdentityEvents();
    }
};
