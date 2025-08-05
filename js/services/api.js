/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
 * [v1.8] Fixes profile creation conflict and getUserProgress error.
 */
const SUPABASE_URL = 'https://mfxlcdsrnzxjslrfaawz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1meGxjZHNybnp4anNscmZhYXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2ODQyODMsImV4cCI6MjA2NzI2MDI4M30.wTuqqQkOP2_ZwfUU_xM0-X9YjkM39-kewjN41Pxa_wA';

export const ApiService = {
    db: supabase.createClient(SUPABASE_URL, SUPABASE_KEY),

    async fetchLearningMap() {
        const { data, error } = await this.db.from("categories").select("*, chapters(*, sections(*, blocks(*)))").order("order").order("order", { foreignTable: "chapters" }).order("order", { foreignTable: "chapters.sections" }).order("order", { foreignTable: "chapters.sections.blocks" });
        if (error) throw error;
        return data;
    },
    async fetchAllCategoriesForAdmin() {
        const { data, error } = await this.db.from('categories').select('*, chapters(id, title, description, order, sections(id, title, order, blocks(*)))').order('order');
        if (error) throw error;
        return data;
    },
    async upsertCategory(d) { const { error } = await this.db.from('categories').upsert(d, { onConflict: 'id' }); if (error) throw error; },
    async deleteCategory(id) { const { error } = await this.db.from('categories').delete().eq('id', id); if (error) throw error; },
    async upsertChapter(d) { const { error } = await this.db.from('chapters').upsert(d, { onConflict: 'id' }); if (error) throw error; },
    async deleteChapter(id) { const { error } = await this.db.from('chapters').delete().eq('id', id); if (error) throw error; },
    async upsertSection(d) { const { error } = await this.db.from('sections').upsert(d, { onConflict: 'id' }); if (error) throw error; },
    async deleteSection(id) { const { error } = await this.db.from('sections').delete().eq('id', id); if (error) throw error; },
    async upsertBlock(d) { const { error } = await this.db.from('blocks').upsert(d, { onConflict: 'id' }); if (error) throw error; },
    async deleteBlock(id) { const { error } = await this.db.from('blocks').delete().eq('id', id); if (error) throw error; },
    
    async fetchLeaderboard() {
        const { data, error } = await this.db.from("scores").select("*").order("points",{ascending:false}).limit(10);
        if(error)throw error;
        return data
    },

    async fetchFactionLeaderboard() {
        const { data, error } = await this.db.rpc('get_faction_leaderboard');
        if (error) {
            console.error("Error fetching faction leaderboard:", error);
            throw new Error("获取阵营排名失败。");
        }
        return data;
    },

    async getProfile(userId) {
        let { data, error } = await this.db.from('profiles').select('role, faction').eq('id', userId).single();
        // 如果查询出错，且错误原因是“没有找到记录”
        if (error && error.code === 'PGRST116') {
            // 则为该用户创建一个新的档案，这是一种健壮的“get or create”模式
            const { data: newProfile, error: insertError } = await this.db.from('profiles').insert([{ id: userId, role: 'user' }]).select('role, faction').single();
            if (insertError) throw new Error('无法为新用户创建档案。');
            return newProfile;
        } else if (error) {
            // 如果是其他未知错误，则抛出
            throw new Error('获取用户档案时出错。');
        }
        return data;
    },

    async updateProfileFaction(userId, faction) {
        const { data, error } = await this.db.from('profiles').update({ faction: faction, updated_at: new Date() }).eq('id', userId).select('role, faction').single();
        if (error) throw new Error(`阵营选择失败: ${error.message}`);
        if (!data) throw new Error(`阵营更新失败：未找到用户档案。`);
        return data;
    },

    async getUserProgress(userId) {
        // [FIX] 修复 406 Not Acceptable 错误
        // 不使用 .single()，而是查询一个列表，这样即使用户没有进度（返回空列表），也不会报错
        const { data, error } = await this.db.from('user_progress').select('completed_blocks, awarded_points_blocks').eq('user_id', userId);
        
        if (error) {
            // 如果有其他非预期的错误，则抛出
            console.error('Error fetching user progress:', error);
            throw new Error('获取用户进度失败');
        }

        // 如果查询成功但没有数据（新用户），则返回一个默认的空进度对象
        const progress = data && data.length > 0 ? data[0] : null;

        return {
            completed: progress ? progress.completed_blocks || [] : [],
            awarded: progress ? progress.awarded_points_blocks || [] : []
        };
    },

    async saveUserProgress(userId, progressData) {
        const { error } = await this.db.from('user_progress').upsert({ user_id: userId, completed_blocks: progressData.completed, awarded_points_blocks: progressData.awarded, updated_at: new Date() }, { onConflict: 'user_id' });
        if (error) throw new Error(`进度保存失败: ${error.message}`);
    },
    async resetUserProgress() {
        const { error } = await this.db.rpc('reset_user_progress');
        if (error) throw new Error('重置进度失败');
    },

    async addPoints(userId, points) {
        const { error } = await this.db.rpc('upsert_score', {
            user_id_input: userId,
            points_to_add: points
        });

        if (error) {
            console.error("RPC 'upsert_score' failed:", error);
            throw new Error(`积分更新失败: ${error.message}`);
        }
    },

    async signUp(email, password) {
        // [FIX] 修复 409 Conflict 错误
        // 移除这里的 profile 和 score 创建逻辑。
        // getProfile 函数已有“get or create”逻辑，而 upsert_score 函数能自动处理新用户的分数记录。
        // 这使得 signUp 函数只专注于“注册”这一核心职责。
        const { data, error } = await this.db.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await this.db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    async signOut() { await this.db.auth.signOut(); },
};