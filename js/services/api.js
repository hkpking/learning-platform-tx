/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
 * [v2.4.0] Adds full_name to signUp and profile fetches.
 */
export const ApiService = {
    db: null,
    initialize() {
        const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG || {};
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            // In a real app, you might want a more robust error display
            console.error("Supabase URL or Key is missing.");
            document.body.innerHTML = '<div style="color:red; text-align:center; padding: 2rem;">Supabase configuration is missing. The application cannot start.</div>';
            throw new Error("Supabase URL or Key is missing.");
        }
        this.db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    },

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
        const { data, error } = await this.db
            .rpc('get_leaderboard_with_names')
            .limit(10);
        if (error) {
            console.error("Error fetching leaderboard:", error);
            throw new Error("获取排行榜失败。");
        }
        return data;
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
        let { data, error } = await this.db.from('profiles').select('role, faction, full_name').eq('id', userId).single();
        if (error && error.code === 'PGRST116') { // Profile does not exist, create it
            // The trigger should have created a basic profile. If not, we insert.
            const { data: newProfile, error: insertError } = await this.db.from('profiles').insert([{ id: userId, role: 'user' }]).select('role, faction, full_name').single();
            if (insertError) {
                 console.error("Error creating profile:", insertError);
                 throw new Error('无法为新用户创建档案。');
            }
            return newProfile;
        } else if (error) {
            console.error("Error fetching profile:", error);
            throw new Error('获取用户档案时出错。');
        }
        return data;
    },

    async updateProfileFaction(userId, faction) {
        const { data, error } = await this.db.from('profiles').update({ faction: faction, updated_at: new Date() }).eq('id', userId).select('role, faction, full_name').single();
        if (error) throw new Error(`阵营选择失败: ${error.message}`);
        if (!data) throw new Error(`阵营更新失败：未找到用户档案。`);
        return data;
    },

    async updateProfile(userId, profileData) {
        const { data, error } = await this.db
            .from('profiles')
            .update({ ...profileData, updated_at: new Date() })
            .eq('id', userId)
            .select('*')
            .single();
        if (error) throw new Error(`Failed to update profile: ${error.message}`);
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

    async signUp(email, password, fullName) {
        const { data: authData, error: authError } = await this.db.auth.signUp({ email, password });
        if (authError) throw authError;
        if (authData.user) {
            // After user is created in auth.users, a trigger should create a profile.
            // We then update this profile with the full name.
            const { error: profileError } = await this.db
                .from('profiles')
                .update({ full_name: fullName, updated_at: new Date() })
                .eq('id', authData.user.id);

            if (profileError) {
                // Log the error but don't block the user from signing in.
                // The user can update their name later in the profile page.
                console.error(`User created, but failed to update profile with name: ${profileError.message}`);
            }
        }
        return authData;
    },

    async signIn(email, password) {
        const { data, error } = await this.db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    async signOut() { 
        const { error } = await this.db.auth.signOut();
        if (error) {
            console.error("Sign out error", error);
        }
    },
};
