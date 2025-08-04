/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
 * [v1.7] Updates the addPoints function to use a robust 'upsert_score' RPC.
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
        if (error && error.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await this.db.from('profiles').insert([{ id: userId, role: 'user' }]).select('role, faction').single();
            if (insertError) throw new Error('无法为现有用户创建档案。');
            return newProfile;
        } else if (error) {
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
        const { data, error } = await this.db.from('user_progress').select('completed_blocks, awarded_points_blocks').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') {
            return { completed: [], awarded: [] };
        }
        return {
            completed: data ? data.completed_blocks || [] : [],
            awarded: data ? data.awarded_points_blocks || [] : []
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

    /**
     * [MODIFIED] 为用户增加分数。
     * 调用数据库函数 upsert_score 来原子化地处理更新或插入操作，确保为所有用户（无论新旧）正确记分。
     * @param {string} userId - 用户的UUID。
     * @param {number} points - 要增加的分数。
     */
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
        const { data, error } = await this.db.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) { 
            // 注意：新用户注册时，upsert_score函数会自动处理scores表的创建，
            // 但在这里保留显式插入可以作为一种双重保障。
            // 同时，profile的创建仍然是必要的。
            await this.db.from('scores').insert([{ user_id: data.user.id, username: data.user.email, points: 0 }]);
            await this.db.from('profiles').insert([{ id: data.user.id, role: 'user' }]);
        }
        return data;
    },
    async signIn(email, password) {
        const { data, error } = await this.db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    async signOut() { await this.db.auth.signOut(); },
};