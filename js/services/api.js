/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
 * [v2.3.2] Adds API call for finishing challenges.
 */
const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG || {};

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
    
    async fetchActiveChallenges() {
        const { data, error } = await this.db
            .from('challenges')
            .select('*')
            .eq('is_active', true);
        if (error) throw error;
        return data;
    },

    async fetchChallengesForAdmin() {
        const { data, error } = await this.db
            .from('challenges')
            .select('*, target_category:categories(title)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(c => ({...c, target_category_title: c.target_category?.title}));
    },
    async upsertChallenge(d) {
        const { error } = await this.db.from('challenges').upsert(d, { onConflict: 'id' });
        if (error) throw error;
    },
    async deleteChallenge(id) {
        const { error } = await this.db.from('challenges').delete().eq('id', id);
        if (error) throw error;
    },

    async finishChallenge(challengeId) {
        const { error } = await this.db.rpc('finish_challenge', { challenge_id_param: challengeId });
        if (error) {
            console.error('Error finishing challenge:', error);
            throw new Error(`挑战结算失败: ${error.message}`);
        }
    },

    async getProfile(userId) {
        let { data, error } = await this.db.from('profiles').select('role, faction').eq('id', userId).single();
        if (error && error.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await this.db.from('profiles').insert([{ id: userId, role: 'user' }]).select('role, faction').single();
            if (insertError) throw new Error('无法为新用户创建档案。');
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
        const { data, error } = await this.db.from('user_progress').select('completed_blocks, awarded_points_blocks').eq('user_id', userId);
        
        if (error) {
            console.error('Error fetching user progress:', error);
            throw new Error('获取用户进度失败');
        }

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

    async getUserScore(userId) {
        const { data, error } = await this.db
            .from('scores')
            .select('points')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
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
