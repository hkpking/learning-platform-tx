import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
export const AuthView = {
    switchAuthMode(e) {
        if (e) e.preventDefault();
        AppState.authMode = AppState.authMode === 'login' ? 'register' : 'login';
        const { form, title, submitBtn, prompt, switchBtn } = UI.elements.auth;
        form.reset();
        if (AppState.authMode === 'login') {
            title.textContent = '用户登录'; submitBtn.textContent = '登录';
            prompt.textContent = '还没有账户？'; switchBtn.textContent = '立即注册';
        } else {
            title.textContent = '创建新账户'; submitBtn.textContent = '注册';
            prompt.textContent = '已有账户？'; switchBtn.textContent = '立即登录';
        }
    },
    async handleAuthSubmit(e) {
        e.preventDefault();
        const { authInput, passwordInput, submitBtn } = UI.elements.auth;
        const email = authInput.value.trim();
        const password = passwordInput.value.trim();
        if (!email || !password) { UI.showNotification('邮箱和密码不能为空！', 'error'); return; }
        submitBtn.disabled = true; submitBtn.textContent = '处理中...';
        try {
            if (AppState.authMode === 'login') await ApiService.signIn(email, password);
            else {
                await ApiService.signUp(email, password);
                UI.showNotification('注册成功！请使用您的邮箱登录。', 'success');
                this.switchAuthMode();
            }
        } catch (error) { UI.showNotification(error.message, 'error'); } 
        finally { submitBtn.disabled = false; submitBtn.textContent = AppState.authMode === 'login' ? '登录' : '注册'; }
    }
};
