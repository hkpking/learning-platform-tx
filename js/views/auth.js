import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';

export const AuthView = {
    switchAuthMode(e) {
        if (e) e.preventDefault();
        AppState.authMode = AppState.authMode === 'login' ? 'register' : 'login';
        const { form, title, submitBtn, prompt, switchBtn } = UI.elements.auth;
        // Get the name input elements from the UI object
        const { fullNameInputContainer, fullNameInput } = UI.elements.auth;

        form.reset();
        if (AppState.authMode === 'login') {
            title.textContent = '用户登录';
            submitBtn.textContent = '登录';
            prompt.textContent = '还没有账户？';
            switchBtn.textContent = '立即注册';
            // Hide name input for login
            fullNameInputContainer.classList.add('hidden');
            fullNameInput.required = false;
        } else {
            title.textContent = '创建新账户';
            submitBtn.textContent = '注册';
            prompt.textContent = '已有账户？';
            switchBtn.textContent = '立即登录';
            // Show name input for registration and make it required
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
        // Validate full name only in register mode
        if (AppState.authMode === 'register' && !fullName) {
            UI.showNotification('姓名不能为空！', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '处理中...';

        try {
            if (AppState.authMode === 'login') {
                // [FIX] Manually handle login success to ensure navigation to the game lobby.
                const data = await ApiService.signIn(email, password);
                
                // The onAuthStateChange listener will also fire, but we trigger the
                // full login sequence with navigation immediately. The App.handleLogin
                // function is designed to be idempotent and won't cause issues if called twice.
                if (data && data.user) {
                    // We need to call the global App object, which is available on the window.
                    // The 'true' argument ensures navigation happens.
                    await window.App.handleLogin(data.user, true);
                } else {
                    // This case should ideally not be reached if signIn throws an error, but it's good for safety.
                    throw new Error("登录失败，无法获取用户信息。");
                }
            } else {
                // Pass the full name to the signUp function
                await ApiService.signUp(email, password, fullName);
                UI.showNotification('注册成功！请使用您的邮箱登录。', 'success');
                this.switchAuthMode(); // Switch back to login form
            }
        } catch (error) {
            // The ApiService throws detailed errors, which we display here.
            UI.showNotification(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            // Restore the button text based on the current mode.
            submitBtn.textContent = AppState.authMode === 'login' ? '登录' : '注册';
        }
    }
};
