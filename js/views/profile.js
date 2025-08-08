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
            
            const [profile, scoreData] = await Promise.all([
                ApiService.getProfile(userId),
                ApiService.getScoreInfo(userId)
            ]);

            AppState.profile = { 
                ...AppState.profile, 
                ...profile, 
                points: scoreData ? scoreData.points : AppState.profile.points,
                username: scoreData ? scoreData.username : AppState.profile.username
            };
            
            const points = AppState.profile.points || 0;

            const totalBlocks = AppState.learningMap.flatStructure.length;
            const completedBlocks = AppState.userProgress.completedBlocks.size;
            const progressPercentage = totalBlocks > 0 ? ((completedBlocks / totalBlocks) * 100).toFixed(0) : 0;

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div class="md:col-span-1 text-center" id="profile-identity">
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
        const avatarChar = (profile.username || emailPrefix).charAt(0).toUpperCase();

        let nameHtml;
        // Check if a username exists. If not, show the form to add one.
        if (profile.username) {
            nameHtml = `
                <h2 class="text-2xl font-bold text-white">${profile.username}</h2>
                <p class="text-sm text-gray-400">(${AppState.user.email})</p>
            `;
        } else {
            nameHtml = `
                <form id="profile-name-form">
                    <p class="text-gray-400 mb-2">请设置您的显示姓名：</p>
                    <input type="text" id="profile-name-input" placeholder="请输入姓名" class="input-field text-center w-full p-2 rounded-lg" required>
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

        // Bind events to the newly created elements
        this.bindIdentityEvents();
    },

    bindIdentityEvents() {
        const nameForm = document.getElementById('profile-name-form');
        if (nameForm) {
            nameForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const input = document.getElementById('profile-name-input');
                const newName = input.value.trim();
                if (!newName) return;

                try {
                    const updatedScoreInfo = await ApiService.updateUsername(AppState.user.id, newName);
                    // Update the global state with the new username
                    AppState.profile.username = updatedScoreInfo.username;
                    UI.showNotification('姓名更新成功！', 'success');
                    // Re-render the section to show the new name instead of the form
                    this.renderIdentitySection();
                    // Also update the main greeting in the header
                    UI.elements.mainApp.userGreeting.textContent = `欢迎, ${updatedScoreInfo.username}`;
                } catch (error) {
                    UI.showNotification(error.message, 'error');
                }
            });
        }
    }
};
