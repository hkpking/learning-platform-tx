/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
 * [v1.5] Adds return data on update and enhanced logging for diagnostics.
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

    async getProfile(userId) {
        let { data, error } = await this.db.from('profiles').select('role, faction').eq('id', userId).single();

        if (error && error.code === 'PGRST116') {
            console.log(`Profile not found for user ${userId}. Creating a new one.`);
            const { data: newProfile, error: insertError } = await this.db
                .from('profiles')
                .insert([{ id: userId, role: 'user' }])
                .select('role, faction')
                .single();
            
            if (insertError) {
                console.error('Error creating profile for existing user:', insertError);
                throw new Error('无法为现有用户创建档案。');
            }
            
            console.log('New profile created automatically:', newProfile);
            return newProfile;
        } 
        else if (error) {
            console.error('Error fetching profile:', error);
            throw new Error('获取用户档案时出错。');
        }

        return data;
    },

    /**
     * [FIXED] Updates the user's faction and returns the updated profile data.
     * @param {string} userId - The user's ID.
     * @param {string} faction - The chosen faction.
     * @returns {Promise<object>} The updated profile data.
     */
    async updateProfileFaction(userId, faction) {
        const { data, error } = await this.db
            .from('profiles')
            .update({ faction: faction, updated_at: new Date() })
            .eq('id', userId)
            .select('role, faction') // Return the updated data
            .single();

        if (error) {
            console.error("Update Faction Error:", error);
            throw new Error(`阵营选择失败: ${error.message}`);
        }
        if (!data) {
            console.error("Update Faction Warning: No row was updated. Profile might not exist for user:", userId);
            throw new Error(`阵营更新失败：未找到用户档案。`);
        }
        console.log("Faction Updated Successfully in DB:", data);
        return data; // Return the updated profile as the new source of truth
    },

    async getUserProgress(userId) {
        const { data, error } = await this.db.from('user_progress').select('completed_blocks, awarded_points_blocks').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching progress:', error);
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
    async addPoints(userEmail, points) {
        const { error } = await this.db.rpc("add_points", { user_email: userEmail, points_to_add: points });
        if (error) throw new Error(`积分更新失败: ${error.message}`);
    },

    async signUp(email, password) {
        const { data, error } = await this.db.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) { 
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
