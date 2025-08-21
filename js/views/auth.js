import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';

export const AuthView = {
    switchAuthMode(e) {
        if (e) e.preventDefault();
        AppState.authMode = AppState.authMode === 'login' ? 'register' : 'login';
        const { form, title, submitBtn, prompt, switchBtn, fullNameInputContainer, fullNameInput } = UI.elements.auth;

        form.reset();
        if (AppState.authMode === 'login') {
            title.textContent = '用户登录';
            submitBtn.textContent = '登录';
            prompt.textContent = '还没有账户？';
            switchBtn.textContent = '立即注册';
            fullNameInputContainer.classList.add('hidden');
            fullNameInput.required = false;
        } else {
            title.textContent = '创建新账户';
            submitBtn.textContent = '注册';
            prompt.textContent = '已有账户？';
            switchBtn.textContent = '立即登录';
            fullNameInputContainer.classList.remove('hidden');
            fullNameInput.required = true;
        }
    },
    async handleAuthSubmit(e) {
        e.preventDefault();
        const { authInput, passwordInput, fullNameInput, submitBtn } = UI.elements.auth;

        const email = authInput.value.trim();
        const password = passwordInput.value.trim();
        const fullName = fullNameInput.value.trim();

        if (!email || !password) {
            UI.showNotification('邮箱和密码不能为空！', 'error');
            return;
        }
        if (AppState.authMode === 'register' && !fullName) {
            UI.showNotification('姓名不能为空！', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';

        try {
            if (AppState.authMode === 'login') {
                const data = await ApiService.signIn(email, password);
                if (data && data.user) {
                    await window.App.handleLogin(data.user, true);
                } else {
                    throw new Error("登录失败，无法获取用户信息。");
                }
            } else {
                await ApiService.signUp(email, password, fullName);
                UI.showNotification('注册成功！请使用您的邮箱登录。', 'success');
                this.switchAuthMode();
            }
        } catch (error) {
            UI.showNotification(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = AppState.authMode === 'login' ? '登录' : '注册';
        }
    }
};
