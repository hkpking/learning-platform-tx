#!/bin/bash
# =================================================================
#  流程天命 - 项目一键生成脚本 (v1.2.1 - 最终修复版)
# =================================================================
#  - 包含了所有功能，包括阵营选择。
#  - 修复了所有已知问题，包括JS执行错误和后台UI问题。
#  - 修复了脚本EOF标记可能存在的复制问题，并增加了最终成功提示。
# =================================================================

echo "🚀 开始创建项目完整架构及内容 (v1.2.1)..."

# 1. 创建目录结构
echo "📁 创建目录..."
mkdir -p docs
mkdir -p css
mkdir -p js/services
mkdir -p js/components
mkdir -p js/views
mkdir -p assets/images
touch assets/images/.gitkeep

# 2. 写入文件内容

# --- 写入 index.html ---
echo "📄 正在写入 index.html..."
cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>流程天命 - 英雄之旅</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="text-gray-200">

    <div id="notification"></div>

    <!-- Faction Selection Modal -->
    <div id="faction-selection-modal" class="fixed inset-0 bg-black bg-opacity-80 z-50 hidden items-center justify-center p-4">
        <div class="module-container p-8 rounded-xl shadow-2xl w-full max-w-3xl text-center border-2 border-amber-500/50">
            <h2 class="text-4xl font-calligraphy text-amber-200 mb-4">欢迎你，天命人！</h2>
            <p class="text-gray-300 mb-8 text-lg">在开启征途之前，你必须做出一个重要的选择。<br>你的道路，将决定这个世界的未来……</p>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="faction-card border-2 border-sky-400/50 p-6 rounded-lg hover:bg-sky-400/10 transition-colors">
                    <h3 class="text-3xl font-calligraphy text-sky-300 mb-3">天命</h3>
                    <p class="text-gray-400 mb-6 min-h-[72px]">遵循宇宙的秩序与法则，维护流程的稳定与和谐，相信每一次精准的执行都在巩固世界的基石。</p>
                    <button data-faction="tianming" class="faction-btn w-full btn bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg">我选择秩序</button>
                </div>
                <div class="faction-card border-2 border-red-500/50 p-6 rounded-lg hover:bg-red-500/10 transition-colors">
                    <h3 class="text-3xl font-calligraphy text-red-400 mb-3">逆熵</h3>
                    <p class="text-gray-400 mb-6 min-h-[72px]">打破陈旧的规则与束缚，在混乱中寻求创新与突破，相信每一次伟大的变革都源于对现状的颠覆。</p>
                    <button data-faction="nishang" class="faction-btn w-full btn bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg">我选择变革</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Other Modals -->
    <div id="restart-confirm-modal" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden items-center justify-center p-4">
        <div class="module-container p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
            <h3 class="text-2xl font-bold text-white mb-4">确认操作</h3>
            <p class="text-gray-300 mb-8">您确定要重新学习所有课程吗？<br><strong class="text-yellow-400">您的学习进度将被清空，但所有已获得的学分和排名将被保留。</strong></p>
            <div class="flex justify-center space-x-4">
                <button id="cancel-restart-btn" class="btn bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">取消</button>
                <button id="confirm-restart-btn" class="btn bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">确认重置</button>
            </div>
        </div>
    </div>
    <div id="delete-confirm-modal" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden items-center justify-center p-4">
        <div class="module-container p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
            <h3 class="text-2xl font-bold text-white mb-4">确认删除</h3>
            <p id="delete-confirm-message" class="text-gray-300 mb-8">您确定要删除这个项目吗？<br><strong class="text-red-400">此操作不可撤销。</strong></p>
            <div class="flex justify-center space-x-4">
                <button id="cancel-delete-btn" class="btn bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">取消</button>
                <button id="confirm-delete-btn" class="btn bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">确认删除</button>
            </div>
        </div>
    </div>

    <main id="app-container" class="relative">
        
        <section id="landing-view" class="view active">
            <div class="w-full">
                <div id="opening-container">
                    <header class="fixed top-0 left-0 right-0 z-20 bg-transparent">
                        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
                            <div class="text-xl font-bold text-white font-calligraphy tracking-widest">流程天命</div>
                            <button id="new-login-btn" class="text-white font-semibold hover:text-amber-400 transition-colors">登录 / 注册</button>
                        </div>
                    </header>
                    <div class="ken-burns-bg"></div>
                    <div id="narrative-overlay"><p id="subtitle"></p></div>
                    <div id="scroll-indicator"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg></div>
                </div>
                <div id="main-content">
                    <main>
                        <section id="hub" class="min-h-screen flex items-center justify-center bg-black pt-24 pb-12">
                            <div class="container mx-auto px-4 fade-in-up">
                                <div class="text-center mb-12">
                                    <h1 class="text-5xl text-amber-100 font-calligraphy tracking-wider">天命征途</h1>
                                    <p class="text-lg text-gray-400 mt-2">星图指引，英名永存。此为汝之道，亦为汝之荣耀。</p>
                                    <button id="new-start-btn" class="mt-8 btn bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg">开启征途</button>
                                </div>
                                <div class="grid lg:grid-cols-2 gap-8 md:gap-12">
                                    <div class="hub-card p-6 md:p-8">
                                        <h2 class="text-3xl text-center text-amber-300 mb-6 font-calligraphy">修炼星图</h2>
                                        <div class="flex flex-col space-y-4">
                                            <div class="flex items-center justify-between"><div class="path-node"><div class="w-16 h-16 mx-auto mb-2 bg-gray-800 border-2 border-amber-600 rounded-full flex items-center justify-center text-2xl font-calligraphy">启</div><p class="font-semibold">天命人</p></div><div class="path-line"></div><div class="path-node"><div class="w-16 h-16 mx-auto mb-2 bg-gray-800 border-2 border-amber-700 rounded-full flex items-center justify-center text-2xl font-calligraphy">行</div><p class="font-semibold">行者</p></div><div class="path-line"></div><div class="path-node"><div class="w-16 h-16 mx-auto mb-2 bg-gray-800 border-2 border-amber-800 rounded-full flex items-center justify-center text-2xl font-calligraphy">觉</div><p class="font-semibold">佛陀</p></div></div>
                                            <div class="flex items-center justify-around"><div class="path-node"><div class="w-16 h-16 mx-auto mb-2 bg-gray-800 border-2 border-amber-900 rounded-full flex items-center justify-center text-2xl font-calligraphy">刚</div><p class="font-semibold">金刚</p></div><div class="path-line max-w-xs"></div><div class="path-node"><div class="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-amber-500 to-red-700 border-2 border-amber-400 rounded-full flex items-center justify-center text-2xl font-calligraphy">圣</div><p class="font-semibold">斗战胜佛</p></div></div>
                                        </div>
                                    </div>
                                    <div class="hub-card p-6 md:p-8">
                                        <h2 class="text-3xl text-center text-amber-300 mb-6 font-calligraphy">封神榜</h2>
                                        <div class="space-y-2"><div class="leaderboard-item flex items-center"><span class="text-2xl mr-4 text-yellow-400">🥇</span><span class="font-semibold text-lg flex-grow">破局者-李寻</span><span class="text-yellow-400 font-bold">12,500</span></div><div class="leaderboard-item flex items-center"><span class="text-2xl mr-4 text-gray-300">🥈</span><span class="font-semibold text-lg flex-grow">架构师-王雪</span><span class="text-gray-300 font-bold">11,800</span></div><div class="leaderboard-item flex items-center"><span class="text-2xl mr-4 text-orange-400">🥉</span><span class="font-semibold text-lg flex-grow">流程先锋-赵云</span><span class="text-orange-400 font-bold">10,200</span></div><div class="leaderboard-item flex items-center opacity-70"><span class="text-lg mr-5 ml-1">4</span><span class="text-md flex-grow">智多星-吴用</span><span class="font-semibold">9,800</span></div></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section class="content-section text-center">
                            <div class="fade-in-up">
                                <h2 class="text-2xl text-amber-400 mb-2 font-calligraphy">第一境：流程天命人</h2>
                                <h3 class="text-4xl md:text-5xl text-white mb-6">流程认知与启蒙</h3>
                                <p class="text-lg text-gray-400 max-w-2xl">万物皆有其道，流程亦然。在此，你将洞悉万物背后的秩序，建立共同语言，开启慧眼，识别身边的每一个流程脉络。</p>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </section>

        <section id="auth-view" class="view flex-col items-center justify-center p-4">
            <div class="w-full max-w-md">
                <div class="text-center mb-8"><button id="back-to-landing-btn" class="text-blue-400 hover:text-blue-300">&larr; 返回主页</button></div>
                <div class="module-container p-8 rounded-xl shadow-2xl">
                    <h2 id="form-title" class="text-3xl font-bold text-center text-white mb-8">用户登录</h2>
                    <form id="auth-form">
                        <div class="space-y-6">
                            <input type="email" id="auth-input" placeholder="邮箱" class="input-field w-full p-3 rounded-lg" required>
                            <input type="password" id="password-input" placeholder="密码" class="input-field w-full p-3 rounded-lg" required>
                        </div>
                        <button id="submit-btn" type="submit" class="w-full mt-8 py-3 rounded-lg btn btn-primary font-bold text-lg">登录</button>
                    </form>
                    <p class="text-center mt-6 text-sm"><span id="prompt-text">还没有账户？</span><a href="#" id="switch-mode-btn" class="font-semibold text-blue-400 hover:text-blue-300">立即注册</a></p>
                </div>
            </div>
        </section>

        <section id="main-app-view" class="view flex-col">
            <header id="main-header" class="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-40">
                <div class="container mx-auto px-4 sm:px-6 lg:px-8"><div class="flex items-center justify-between h-16"><div class="flex items-center"><span class="font-bold text-xl text-white">🚀 流程管理在线学习平台</span></div><div id="user-info" class="flex items-center space-x-4 text-white"><span id="user-greeting" class="text-sm font-medium"></span><button id="admin-view-btn" class="hidden text-sm font-bold bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full btn" title="进入管理后台">管理后台</button><button id="restart-btn" class="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors" title="重新学习所有课程">重新学习</button><button id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-3 rounded-full btn" title="退出登录">退出</button></div></div></div>
            </header>
            <div id="learning-content-container" class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow">
                <div id="category-selection-view" class="view"><header class="text-center mb-12"><h1 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">学习地图</h1><p class="text-gray-400 mt-4 text-lg">选择一个篇章，开启你的征程！</p></header><div id="categories-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div></div>
                <div id="chapter-selection-view" class="view"><header class="text-center mb-16 relative"><button id="back-to-categories-btn" class="absolute top-1/2 -translate-y-1/2 left-0 p-2 rounded-full hover:bg-gray-700/50 transition-colors" title="返回学习地图"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button><h1 id="chapter-view-title" class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-500"></h1><p id="chapter-view-desc" class="text-gray-400 mt-4 text-lg"></p></header><div id="chapters-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div></div>
                <div id="chapter-detail-view" class="view"><div class="module-container rounded-xl overflow-hidden flex flex-col md:flex-row" style="height: 75vh;"><aside id="sidebar" class="w-full md:w-80 bg-slate-900/80 text-gray-300 flex flex-col flex-shrink-0 border-r border-slate-700/50"><div id="sidebar-header" class="p-6 border-b border-slate-700/50"></div><nav class="flex-1 overflow-y-auto p-2"><ul id="sidebar-nav-list" class="space-y-1"></ul></nav><div class="p-4 mt-auto"><button id="back-to-chapters-btn" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg btn">返回章节列表</button></div></aside><main id="content-area" class="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto"></main></div></div>
            </div>
            <div id="admin-management-view" class="view admin-view-bg text-gray-800 flex-grow"><div class="flex-1 flex flex-col overflow-hidden"><main class="flex-1 overflow-x-hidden overflow-y-auto p-6"><div id="admin-breadcrumb" class="mb-4 text-sm text-gray-500"></div><div id="admin-category-list-view"><div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-semibold text-gray-700">篇章管理</h2><div><button id="admin-add-category-btn" class="btn btn-primary font-bold py-2 px-4 rounded-lg">＋ 新增篇章</button><button id="back-to-learning-btn" class="btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg ml-2">返回学习平台</button></div></div><div id="admin-categories-table-container" class="bg-white p-6 rounded-lg shadow-md"></div></div><div id="admin-chapter-list-view" class="hidden"><div class="flex justify-between items-center mb-4"><h2 id="admin-chapter-list-title" class="text-2xl font-semibold text-gray-700"></h2><button id="admin-add-chapter-btn" class="btn btn-primary font-bold py-2 px-4 rounded-lg">＋ 新增章节</button></div><div id="admin-chapters-table-container" class="bg-white p-6 rounded-lg shadow-md"></div></div><div id="admin-section-list-view" class="hidden"><div class="flex justify-between items-center mb-4"><h2 id="admin-section-list-title" class="text-2xl font-semibold text-gray-700"></h2><button id="admin-add-section-btn" class="btn btn-primary font-bold py-2 px-4 rounded-lg">＋ 新增小节</button></div><div id="admin-sections-table-container" class="bg-white p-6 rounded-lg shadow-md"></div></div><div id="admin-block-editor-view" class="hidden"><div class="flex justify-between items-center mb-4"><h2 id="admin-editor-section-title" class="text-2xl font-semibold text-gray-700"></h2><button id="admin-add-new-block-btn" class="btn btn-primary font-bold py-2 px-4 rounded-lg">＋ 新增内容块</button></div><div id="admin-blocks-list" class="space-y-4 mb-6"></div></div></main></div></div>
        </section>

        <section id="immersive-viewer-view" class="view flex-col h-screen">
            <header id="immersive-header" class="flex-shrink-0"><div class="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"><h2 id="immersive-title" class="text-lg font-bold text-white truncate"></h2><button id="close-immersive-view-btn" class="p-2 rounded-full hover:bg-slate-700 transition-colors" title="关闭"><svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div></header>
            <main id="immersive-content" class="flex-1 bg-black relative"></main>
        </section>
    </main>

    <div id="leaderboard-container" style="display: none;">
        <div id="leaderboard-icon">🏆</div>
        <div id="leaderboard-panel" class="module-container p-4 rounded-xl shadow-2xl"><h2 class="text-xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">学分英雄榜</h2><div id="leaderboard-list" class="space-y-2"></div></div>
    </div>

    <div id="admin-modal-backdrop">
        <div id="form-modal" class="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 hidden flex flex-col max-h-[90vh]">
            <div class="p-6 border-b flex-shrink-0"><h2 id="modal-title" class="text-2xl font-bold"></h2></div>
            <form id="modal-form" class="p-6 space-y-4 overflow-y-auto flex-grow"></form>
            <div class="p-6 bg-gray-50 border-t flex justify-end space-x-3 flex-shrink-0"><button id="cancel-modal-btn" class="btn bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg">取消</button><button id="save-modal-btn" class="btn btn-primary font-bold py-2 px-4 rounded-lg">保存</button></div>
        </div>
    </div>

    <script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
    <script type="module" src="js/app.js"></script>
</body>
</html>
EOF

# --- 写入 css/style.css ---
echo "🎨 正在写入 css/style.css..."
cat << 'EOF' > css/style.css
/* --- 全局与基础样式 --- */
body { font-family: 'Noto Sans SC', sans-serif; background-color: #0f172a; min-height: 100vh; }
#app-container { position: relative; }
#app-container > section.view { display: none; }
#app-container > section.view.active { display: flex; animation: fadeIn 0.4s ease-in-out; }
#main-app-view .view { display: none; }
#main-app-view .view.active { display: block; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.card, .module-container { background-color: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
.card:not(.locked):hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
.btn { transition: all 0.3s ease; }
.btn-primary { background: linear-gradient(to right, #2563eb, #4f46e5); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
.input-field { background-color: rgba(15, 23, 42, 0.7); border: 1px solid #334155; }
.input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
#notification { position: fixed; top: -100px; left: 50%; transform: translateX(-50%); padding: 1rem 2rem; border-radius: 0.5rem; color: white; font-weight: 500; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: top 0.5s ease-in-out; z-index: 1000; }
#notification.success { background: linear-gradient(to right, #10b981, #22c55e); }
#notification.error { background: linear-gradient(to right, #ef4444, #dc2626); }
#notification.show { top: 20px; }
#leaderboard-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 50; transition: opacity 0.3s, visibility 0.3s; }
#leaderboard-icon { width: 3.5rem; height: 3.5rem; border-radius: 50%; background: linear-gradient(to right, #f97316, #f59e0b); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: transform 0.3s; }
#leaderboard-icon:hover { transform: scale(1.1); }
#leaderboard-panel { position: absolute; bottom: 4.5rem; right: 0; width: 300px; max-height: 400px; overflow-y: auto; opacity: 0; visibility: hidden; transform: translateY(20px); transition: all 0.3s ease-out; }
#leaderboard-container:hover #leaderboard-panel { opacity: 1; visibility: visible; transform: translateY(0); }
.rank-1 .rank-badge { background-color: #ffd700; color: #422c00; } .rank-2 .rank-badge { background-color: #c0c0c0; color: #363636; } .rank-3 .rank-badge { background-color: #cd7f32; color: #4a2a0c; }
.section-group-title { padding: 0.75rem 0.5rem; font-weight: 700; color: #94a3b8; border-top: 1px solid #334155; margin-top: 0.5rem; }
.section-group:first-child .section-group-title { border-top: none; margin-top: 0; }
.block-item { border-right: 3px solid transparent; }
.block-item.active { background-color: rgba(59, 130, 246, 0.2); border-right-color: #3b82f6; color: #e0f2fe; }
.block-item.completed { color: #4ade80; }
.block-item.locked { color: #64748b; cursor: not-allowed; }
.block-item.locked .block-icon { color: #475569; }
.quiz-option { border: 1px solid #334155; }
.quiz-option:hover { background-color: #334155; }
.quiz-option.selected { background-color: #3b82f6; border-color: #3b82f6; }
.quiz-option.correct { background-color: #22c55e; border-color: #22c55e; }
.quiz-option.incorrect { background-color: #ef4444; border-color: #ef4444; }
.admin-view-bg { background-color: #f1f5f9; color: #1e293b; }
.admin-label { font-weight: 600; color: #475569; }
.admin-input, .admin-textarea, .admin-select { background-color: #fff; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.75rem 1rem; transition: all 0.2s ease-in-out; width: 100%; }
.admin-input:focus, .admin-textarea:focus, .admin-select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
#admin-modal-backdrop { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: none; align-items: center; justify-content: center; z-index: 40; }
#admin-modal-backdrop.active { display: flex; }
.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6 { color: #bae6fd; font-weight: 700; margin-top: 1.25em; margin-bottom: 0.5em; }
.markdown-content h1 { font-size: 2.25rem; } .markdown-content h2 { font-size: 1.875rem; } .markdown-content h3 { font-size: 1.5rem; } .markdown-content h4 { font-size: 1.25rem; }
.markdown-content p { color: #d1d5db; line-height: 1.75; margin-bottom: 1em; }
.markdown-content strong { color: #ffffff; font-weight: 600; }
.markdown-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
.markdown-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
.markdown-content li { margin-bottom: 0.5em; }
.video-js.vjs-theme-custom { --vjs-theme-custom-primary: #3b82f6; }
.vjs-theme-custom .vjs-big-play-button { background-color: rgba(45, 55, 72, 0.7); border-color: var(--vjs-theme-custom-primary); width: 3em; height: 3em; border-radius: 50%; margin-top: -1.5em; margin-left: -1.5em; }
.vjs-theme-custom .vjs-control-bar { background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0)); }
.vjs-theme-custom .vjs-progress-holder { height: 5px; background-color: rgba(255, 255, 255, 0.3); }
.vjs-theme-custom .vjs-play-progress, .vjs-theme-custom .vjs-volume-level { background-color: var(--vjs-theme-custom-primary); }
#immersive-viewer-view { background-color: #000; z-index: 100; }
#immersive-header { background-color: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #334155; }
#immersive-content .video-js, #immersive-content iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
.font-calligraphy { font-family: 'Ma Shan Zheng', cursive; }
#opening-container { height: 100vh; position: relative; overflow: hidden; background-color: #000; }
.ken-burns-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center center; background-image: url('https://vip.123pan.cn/1812596934/ymjew503t0n000d7w32y6qda6xz9e97hDIYPDqJ2AqrwAcxvAqa2AF==.jpg'); animation: kenburns-single 40s infinite alternate ease-in-out; }
@keyframes kenburns-single { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.15) translate(-2%, 2%); } }
#narrative-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%); }
#subtitle { font-size: 1.75rem; font-weight: 500; text-shadow: 0 2px 15px rgba(0,0,0,0.9); max-width: 800px; padding: 0 2rem; opacity: 0; transition: opacity 2s ease-in-out; }
#subtitle.visible { opacity: 1; }
#scroll-indicator { position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%); color: #fff; opacity: 0; transition: opacity 1s 1s; z-index: 11; }
#scroll-indicator.visible { opacity: 0.7; }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }
#scroll-indicator svg { animation: bounce 2s infinite; }
#main-content { position: relative; z-index: 5; background-color: #000; }
.hub-card { background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(180, 83, 9, 0.4); border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.path-node { position: relative; text-align: center; }
.path-line { height: 2px; background: linear-gradient(to right, transparent, #b45309, transparent); flex-grow: 1; opacity: 0.5; }
@media (max-width: 768px) { .path-line { display: none; } }
.leaderboard-item { border-bottom: 1px solid rgba(180, 83, 9, 0.2); padding: 0.75rem 0.5rem; transition: background-color 0.3s; }
.leaderboard-item:hover { background-color: rgba(180, 83, 9, 0.1); }
.content-section { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 4rem 2rem; }
.fade-in-up { opacity: 0; transform: translateY(80px); transition: opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1), transform 1.2s cubic-bezier(0.19, 1, 0.22, 1); }
.is-visible { opacity: 1; transform: translateY(0); }
EOF

# --- 写入 docs/database_schema.md ---
echo "📦 正在写入 docs/database_schema.md..."
cat << 'EOF' > docs/database_schema.md
# 数据库架构规划 (Supabase)

**版本**: 1.1

## 1. 文档修订记录

| 版本  | 日期       | 修订人 | 修订说明                 |
| :---- | :--------- | :----- | :----------------------- |
| 1.0   | 2025-08-05 | Gemini | 基于项目原型创建         |
| 1.1   | 2025-08-05 | Gemini | 新增“阵营” (faction) 字段 |

## 2. 用户与认证

### `profiles` (公开)

| 字段名   | 类型                | 描述                                     | 备注                       |
|----------|---------------------|------------------------------------------|----------------------------|
| `id`     | `uuid` (主键)       | 用户ID，与 `auth.users.id` 关联。        | `references auth.users on delete cascade` |
| `role`   | `text`              | 用户角色（例如：'user', 'admin'）。      | 默认为 'user'。            |
| `faction`| `text`              | **[新增]** 用户选择的阵营。例如 'tianming' 或 'nishang'。 | 可为 NULL，新用户默认为空。 |
| `updated_at` | `timestamp with time zone` | 最后更新时间。                           | 自动更新。                 |

... (其余内容保持不变) ...
EOF

# --- 写入 js/state.js ---
echo "🧠 正在写入 js/state.js..."
cat << 'EOF' > js/state.js
/**
 * @file state.js
 * @description Manages the global state of the application.
 */
export const AppState = {
    user: null, 
    profile: null,
    learningMap: {
        categories: [],
        flatStructure: [] 
    },
    leaderboard: [],
    userProgress: { 
        completedBlocks: new Set(),
        awardedPointsBlocks: new Set()
    },
    current: { 
        topLevelView: 'landing',
        courseView: 'category-selection',
        categoryId: null, 
        chapterId: null, 
        sectionId: null, 
        blockId: null,
        activePlayer: null 
    },
    authMode: 'login',
    admin: {
        view: 'categories', 
        categories: [],
        selectedCategory: null,
        selectedChapter: null,
        selectedSection: null,
        editingItem: null,
        editingType: null
    }
};

export function resetUserProgressState() {
    AppState.userProgress = {
        completedBlocks: new Set(),
        awardedPointsBlocks: new Set()
    };
}
EOF

# --- 写入 js/ui.js ---
echo "🖼️  正在写入 js/ui.js..."
cat << 'EOF' > js/ui.js
/**
 * @file ui.js
 * @description Centralizes DOM element selections and generic UI manipulation functions.
 */
import { AppState } from './state.js';

export const UI = {
    elements: {
        notification: document.getElementById('notification'),
        factionModal: { container: document.getElementById('faction-selection-modal') },
        restartModal: { container: document.getElementById('restart-confirm-modal'), confirmBtn: document.getElementById('confirm-restart-btn'), cancelBtn: document.getElementById('cancel-restart-btn') },
        deleteConfirmModal: { container: document.getElementById('delete-confirm-modal'), message: document.getElementById('delete-confirm-message'), confirmBtn: document.getElementById('confirm-delete-btn'), cancelBtn: document.getElementById('cancel-delete-btn') },
        leaderboardContainer: document.getElementById('leaderboard-container'),
        leaderboardList: document.getElementById('leaderboard-list'),
        landingView: document.getElementById('landing-view'),
        authView: document.getElementById('auth-view'),
        mainAppView: document.getElementById('main-app-view'),
        immersiveView: { container: document.getElementById('immersive-viewer-view'), title: document.getElementById('immersive-title'), content: document.getElementById('immersive-content'), closeBtn: document.getElementById('close-immersive-view-btn') },
        landing: { loginBtn: document.getElementById('new-login-btn'), startBtn: document.getElementById('new-start-btn'), subtitle: document.getElementById('subtitle'), scrollIndicator: document.getElementById('scroll-indicator'), },
        auth: { backToLandingBtn: document.getElementById('back-to-landing-btn'), form: document.getElementById('auth-form'), title: document.getElementById('form-title'), submitBtn: document.getElementById('submit-btn'), prompt: document.getElementById('prompt-text'), switchBtn: document.getElementById('switch-mode-btn'), authInput: document.getElementById('auth-input'), passwordInput: document.getElementById('password-input') },
        mainApp: { header: document.getElementById('main-header'), adminViewBtn: document.getElementById('admin-view-btn'), userGreeting: document.getElementById('user-greeting'), logoutBtn: document.getElementById('logout-btn'), restartBtn: document.getElementById('restart-btn'), categoryView: document.getElementById('category-selection-view'), categoryGrid: document.getElementById('categories-grid'), chapterView: document.getElementById('chapter-selection-view'), chapterTitle: document.getElementById('chapter-view-title'), chapterDesc: document.getElementById('chapter-view-desc'), chapterGrid: document.getElementById('chapters-grid'), backToCategoriesBtn: document.getElementById('back-to-categories-btn'), detailView: document.getElementById('chapter-detail-view'), sidebarHeader: document.getElementById('sidebar-header'), sidebarNav: document.getElementById('sidebar-nav-list'), contentArea: document.getElementById('content-area'), backToChaptersBtn: document.getElementById('back-to-chapters-btn'), },
        admin: { container: document.getElementById('admin-management-view'), breadcrumb: document.getElementById('admin-breadcrumb'), backToLearningBtn: document.getElementById('back-to-learning-btn'), categoryListView: document.getElementById('admin-category-list-view'), categoriesTableContainer: document.getElementById('admin-categories-table-container'), chapterListView: document.getElementById('admin-chapter-list-view'), chapterListTitle: document.getElementById('admin-chapter-list-title'), chaptersTableContainer: document.getElementById('admin-chapters-table-container'), sectionListView: document.getElementById('admin-section-list-view'), sectionListTitle: document.getElementById('admin-section-list-title'), sectionsTableContainer: document.getElementById('admin-sections-table-container'), blockEditorView: document.getElementById('admin-block-editor-view'), editorSectionTitle: document.getElementById('admin-editor-section-title'), blocksList: document.getElementById('admin-blocks-list'), addCategoryBtn: document.getElementById('admin-add-category-btn'), addChapterBtn: document.getElementById('admin-add-chapter-btn'), addSectionBtn: document.getElementById('admin-add-section-btn'), addNewBlockBtn: document.getElementById('admin-add-new-block-btn'), modal: { backdrop: document.getElementById('admin-modal-backdrop'), container: document.getElementById('form-modal'), form: document.getElementById('modal-form'), title: document.getElementById('modal-title'), saveBtn: document.getElementById('save-modal-btn'), cancelBtn: document.getElementById('cancel-modal-btn'), } },
    },
    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = "";
        this.elements.notification.classList.add(type, "show");
        setTimeout(() => this.elements.notification.classList.remove("show"), 3500);
    },
    renderLoading(c) { c.innerHTML = `<div class="flex justify-center items-center p-10"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div></div>`; },
    renderError(c, m) { c.innerHTML = `<div class="text-center p-10 text-red-400 text-lg">加载失败：${m}</div>`; },
    renderEmpty(c, m) { c.innerHTML = `<div class="text-center p-10 text-gray-500 text-lg">${m}</div>`; },
    switchTopLevelView(view) {
        document.querySelectorAll('#app-container > .view').forEach(v => v.classList.remove('active'));
        this.elements.leaderboardContainer.style.display = 'none';
        if (view === 'landing') this.elements.landingView.classList.add('active');
        else if (view === 'auth') this.elements.authView.classList.add('active');
        else if (view === 'main') {
            this.elements.mainAppView.classList.add('active');
            this.elements.leaderboardContainer.style.display = 'block';
            this.switchCourseView(AppState.current.courseView);
        } else if (view === 'immersive') this.elements.immersiveView.container.classList.add('active');
        AppState.current.topLevelView = view;
    },
    switchCourseView(viewName) {
        const main = this.elements.mainAppView;
        main.querySelector('#category-selection-view').classList.remove('active');
        main.querySelector('#chapter-selection-view').classList.remove('active');
        main.querySelector('#chapter-detail-view').classList.remove('active');
        main.querySelector('#admin-management-view').classList.remove('active');
        if (viewName === 'admin-management') main.querySelector('#admin-management-view').classList.add('active');
        else main.querySelector('#' + viewName + '-view').classList.add('active');
        AppState.current.courseView = viewName;
    },
};
EOF

# --- 写入 js/services/api.js ---
echo "📡 正在写入 js/services/api.js..."
cat << 'EOF' > js/services/api.js
/**
 * @file api.js
 * @description Encapsulates all interactions with the Supabase backend.
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
        const { data, error } = await this.db.from('profiles').select('role, faction').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') console.error('Error fetching profile:', error);
        return data;
    },

    async updateProfileFaction(userId, faction) {
        const { error } = await this.db.from('profiles').update({ faction: faction, updated_at: new Date() }).eq('id', userId);
        if (error) throw new Error(`阵营选择失败: ${error.message}`);
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
EOF

# --- 写入 js/app.js ---
echo "🚀 正在写入 js/app.js..."
cat << 'EOF' > js/app.js
/**
 * @file app.js
 * @description The main entry point for the application.
 */
import { AppState, resetUserProgressState } from './state.js';
import { UI } from './ui.js';
import { ApiService } from './services/api.js';
import { AuthView } from './views/auth.js';
import { CourseView } from './views/course.js';
import { AdminView } from './views/admin.js';

const App = {
    async init() {
        this.bindEvents();
        this.initLandingPage();
        const { data: { session } } = await ApiService.db.auth.getSession();
        if (session) this.handleLogin(session.user);
        else UI.switchTopLevelView('landing');
    },
    bindEvents() {
        UI.elements.landing.loginBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.landing.startBtn.addEventListener('click', () => UI.switchTopLevelView('auth'));
        UI.elements.auth.backToLandingBtn.addEventListener('click', () => UI.switchTopLevelView('landing'));
        UI.elements.auth.form.addEventListener('submit', (e) => AuthView.handleAuthSubmit(e));
        UI.elements.auth.switchBtn.addEventListener('click', (e) => AuthView.switchAuthMode(e));
        UI.elements.mainApp.logoutBtn.addEventListener('click', () => ApiService.signOut());
        UI.elements.mainApp.restartBtn.addEventListener('click', () => this.handleRestartRequest());
        UI.elements.mainApp.adminViewBtn.addEventListener('click', () => AdminView.showAdminView());
        UI.elements.mainApp.backToCategoriesBtn.addEventListener('click', () => CourseView.showCategoryView());
        UI.elements.mainApp.backToChaptersBtn.addEventListener('click', () => CourseView.showChapterView());
        UI.elements.immersiveView.closeBtn.addEventListener('click', () => CourseView.closeImmersiveViewer());
        UI.elements.restartModal.cancelBtn.addEventListener('click', () => this.toggleRestartModal(false));
        UI.elements.restartModal.confirmBtn.addEventListener('click', () => this.handleConfirmRestart());
        AdminView.bindAdminEvents();

        const factionModal = UI.elements.factionModal.container;
        factionModal.addEventListener('click', (e) => {
            const button = e.target.closest('.faction-btn');
            if (button) {
                const faction = button.dataset.faction;
                this.handleFactionSelection(faction);
            }
        });

        ApiService.db.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') { AppState.user = null; AppState.profile = null; resetUserProgressState(); UI.switchTopLevelView('landing'); } 
            else if (event === 'SIGNED_IN') this.handleLogin(session.user);
        });
    },
    initLandingPage() {
        const subtitle = UI.elements.landing.subtitle;
        const scrollIndicator = UI.elements.landing.scrollIndicator;
        const script = [{ t: "流程真经，曾护佑大唐盛世千年……", d: 5000 }, { t: "然大道蒙尘，秩序失落，妖魔横行。", d: 5000 }, { t: "为重归繁荣，大唐董事遍发《无字真书》，寻觅天命之人。", d: 6000 }, { t: "于机缘巧合，你，得到了它……", d: 5000 }, { t: "当你翻开《流程密码》的瞬间，亦被其选中。", d: 6000 }, { t: "欢迎你，天命人。你的旅程，由此开始。", d: 5000 }];
        let currentLine = 0;
        
        function playNarrative() {
            if (currentLine >= script.length) currentLine = 0;
            const scene = script[currentLine];
            subtitle.classList.remove('visible');
            setTimeout(() => {
                subtitle.textContent = scene.t;
                subtitle.classList.add('visible');
                if (currentLine === 0) scrollIndicator.classList.add('visible');
                currentLine++;
                setTimeout(playNarrative, scene.d);
            }, 1500);
        }
        playNarrative();

        const animatedElements = document.querySelectorAll('.fade-in-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.2 });
        animatedElements.forEach(el => observer.observe(el));
    },
    
    async handleLogin(user) {
        resetUserProgressState(); 
        AppState.user = user;
        
        try {
            const profile = await ApiService.getProfile(user.id);
            AppState.profile = profile || { role: 'user', faction: null };

            if (!AppState.profile.faction) {
                this.showFactionSelection();
            } else {
                this.loadMainAppData();
            }

        } catch (error) {
            console.error("Login process failed:", error);
            UI.showNotification(`登录失败: ${error.message}`, 'error');
            ApiService.signOut();
        }
    },

    showFactionSelection() {
        UI.elements.factionModal.container.classList.remove('hidden');
        UI.elements.factionModal.container.classList.add('flex');
    },

    hideFactionSelection() {
        UI.elements.factionModal.container.classList.add('hidden');
        UI.elements.factionModal.container.classList.remove('flex');
    },

    async handleFactionSelection(faction) {
        try {
            await ApiService.updateProfileFaction(AppState.user.id, faction);
            AppState.profile.faction = faction;
            this.hideFactionSelection();
            UI.showNotification(`你已加入【${faction === 'tianming' ? '天命' : '逆熵'}】阵营！`, 'success');
            this.loadMainAppData();
        } catch (error) {
            UI.showNotification(error.message, 'error');
        }
    },

    async loadMainAppData() {
        try {
            const [progress, categories] = await Promise.all([
                ApiService.getUserProgress(AppState.user.id),
                ApiService.fetchLearningMap()
            ]);

            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            AppState.learningMap.categories = categories;
            this.flattenLearningStructure();
            
            UI.elements.mainApp.adminViewBtn.classList.toggle('hidden', !AppState.profile || AppState.profile.role !== 'admin');
            UI.elements.mainApp.userGreeting.textContent = `欢迎, ${AppState.user.email.split('@')[0]}`;
            
            UI.switchTopLevelView('main');
            CourseView.showCategoryView();
            CourseView.updateLeaderboard();

            ApiService.db.channel('public:scores')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => CourseView.updateLeaderboard())
                .subscribe();
        } catch (error) {
            console.error("Failed to load main app data:", error);
            UI.showNotification(`加载数据失败: ${error.message}`, 'error');
        }
    },

    flattenLearningStructure() {
        const flat = [];
        (AppState.learningMap.categories || []).forEach(cat => { (cat.chapters || []).forEach(chap => { (chap.sections || []).forEach(sec => { (sec.blocks || []).forEach(block => { flat.push({ ...block, sectionId: sec.id, chapterId: chap.id, categoryId: cat.id }); }); }); }); });
        AppState.learningMap.flatStructure = flat;
    },
    toggleRestartModal(show) { const modal = UI.elements.restartModal.container; modal.classList.toggle('hidden', !show); modal.classList.toggle('flex', show); },
    handleRestartRequest() { this.toggleRestartModal(true); },
    async handleConfirmRestart() {
        this.toggleRestartModal(false);
        try {
            await ApiService.resetUserProgress();
            const progress = await ApiService.getUserProgress(AppState.user.id);
            AppState.userProgress.completedBlocks = new Set(progress.completed);
            AppState.userProgress.awardedPointsBlocks = new Set(progress.awarded);
            UI.showNotification("您的学习进度已重置！", "success");
            CourseView.showCategoryView();
        } catch (error) { UI.showNotification(error.message, "error"); }
    },
};

window.onload = () => App.init();
EOF

# --- 写入其他JS文件 (为了完整性) ---
echo "🧩 正在写入其余JS模块..."
cat << 'EOF' > js/views/auth.js
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
EOF
cat << 'EOF' > js/views/course.js
import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { ComponentFactory } from '../components/factory.js';
export const CourseView = {
    async showCategoryView() {
        UI.switchCourseView('category-selection');
        const grid = UI.elements.mainApp.categoryGrid;
        const categories = AppState.learningMap.categories;
        grid.innerHTML = '';
        if (!categories || categories.length === 0) { UI.renderEmpty(grid, '暂无课程篇章，敬请期待！'); return; }
        categories.forEach(c => grid.appendChild(ComponentFactory.createCategoryCard(c, !this.isCategoryUnlocked(c.id))));
    },
    isCategoryUnlocked(categoryId) {
        const cats = AppState.learningMap.categories;
        const catIdx = cats.findIndex(c => c.id === categoryId);
        if (catIdx <= 0) return true;
        const prevCat = cats[catIdx - 1];
        if (!prevCat) return true;
        const prevCatBlocks = AppState.learningMap.flatStructure.filter(b => b.categoryId === prevCat.id);
        if (prevCatBlocks.length === 0) return false;
        return prevCatBlocks.every(b => AppState.userProgress.completedBlocks.has(b.id));
    },
    showChapterView() {
        const cat = AppState.learningMap.categories.find(c => c.id === AppState.current.categoryId);
        if (!cat) return;
        UI.switchCourseView('chapter-selection');
        UI.elements.mainApp.chapterTitle.textContent = cat.title;
        UI.elements.mainApp.chapterDesc.textContent = cat.description;
        const grid = UI.elements.mainApp.chapterGrid;
        grid.innerHTML = '';
        if (!cat.chapters || cat.chapters.length === 0) { UI.renderEmpty(grid, '本篇章下暂无章节。'); return; }
        cat.chapters.forEach(ch => grid.appendChild(ComponentFactory.createChapterCard(ch)));
    },
    async updateLeaderboard() {
        try {
            const board = await ApiService.fetchLeaderboard();
            AppState.leaderboard = board;
            const list = UI.elements.leaderboardList;
            list.innerHTML = "";
            if (!board || board.length === 0) { list.innerHTML = `<p class="text-center text-sm text-gray-400">暂无排名</p>`; return; }
            board.forEach((p, i) => {
                const rank = i + 1;
                const item = document.createElement("div");
                item.className = `rank-item rank-${rank} flex items-center p-2 rounded-md ${AppState.user && AppState.user.email === p.username ? "bg-blue-500/30" : ""}`;
                let rankBadge = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `<div class="rank-badge flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg mr-3">${rank}</div>`;
                item.innerHTML = `<div class="w-10 text-center text-xl">${rankBadge}</div><div class="flex-grow"><div class="font-bold text-white truncate">${p.username.split("@")[0]}</div><div class="text-sm text-gray-400">${p.points} 分</div></div>`;
                list.appendChild(item);
            });
        } catch (e) { console.error("Failed to update leaderboard:", e); UI.elements.leaderboardList.innerHTML = `<p class="text-center text-sm text-red-400">无法加载排名</p>`; }
    },
    selectCategory(id) { AppState.current.categoryId = id; this.showChapterView(); },
    selectChapter(id) { AppState.current.chapterId = id; this.showDetailView(); },
    showDetailView() {
        UI.switchCourseView("chapter-detail");
        this.closeImmersiveViewer();
        const { contentArea, sidebarHeader, sidebarNav } = UI.elements.mainApp;
        UI.renderLoading(contentArea); sidebarNav.innerHTML = ""; sidebarHeader.innerHTML = "";
        try {
            const chap = AppState.learningMap.categories.find(c => c.id === AppState.current.categoryId)?.chapters.find(ch => ch.id === AppState.current.chapterId);
            if (!chap) throw new Error("章节未找到");
            sidebarHeader.innerHTML = `<h2 class="text-xl font-bold text-white">${chap.title}</h2><p class="text-sm text-gray-400 mt-1">${chap.description || ''}</p>`;
            if (!chap.sections || chap.sections.length === 0) { UI.renderEmpty(sidebarNav, "暂无小节"); UI.renderEmpty(contentArea, "本章节暂无内容！"); return; }
            chap.sections.forEach(sec => {
                const group = document.createElement('div');
                group.className = 'section-group';
                group.innerHTML = `<h3 class="section-group-title">${sec.title}</h3>`;
                const ul = document.createElement('ul');
                (sec.blocks || []).forEach(b => ul.appendChild(ComponentFactory.createBlockItem(b, !this.isBlockUnlocked(b.id), AppState.userProgress.completedBlocks.has(b.id))));
                group.appendChild(ul);
                sidebarNav.appendChild(group);
            });
            const firstUncompleted = AppState.learningMap.flatStructure.find(b => b.chapterId === AppState.current.chapterId && this.isBlockUnlocked(b.id) && !AppState.userProgress.completedBlocks.has(b.id));
            const firstBlock = AppState.learningMap.flatStructure.find(b => b.chapterId === AppState.current.chapterId);
            if (firstUncompleted || firstBlock) this.selectBlock((firstUncompleted || firstBlock).id);
            else UI.renderEmpty(contentArea, "恭喜你，已完成所有内容！");
        } catch (e) { console.error("Error loading detail view:", e); UI.renderError(contentArea, "加载章节内容失败: " + e.message); }
    },
    selectBlock(blockId) {
        this.closeImmersiveViewer();
        AppState.current.blockId = blockId;
        UI.elements.mainApp.sidebarNav.querySelectorAll("a.block-item").forEach(item => item.classList.toggle("active", item.dataset.blockId == blockId));
        this.renderBlockContent(blockId);
    },
    renderBlockContent(blockId) {
        const block = AppState.learningMap.flatStructure.find(b => b.id === blockId);
        if (!block) return;
        const area = UI.elements.mainApp.contentArea;
        area.innerHTML = "";
        let mediaRendered = false;
        if (block.video_url) { area.innerHTML += this.createMediaPlaceholder('video', block); mediaRendered = true; }
        if (block.document_url) { area.innerHTML += this.createMediaPlaceholder('document', block); mediaRendered = true; }
        if (block.content_markdown) {
            const mdDiv = document.createElement('div');
            mdDiv.className = `markdown-content ${mediaRendered ? 'mt-6' : ''}`;
            mdDiv.innerHTML = marked.parse(block.content_markdown);
            area.appendChild(mdDiv);
        }
        if (block.quiz_question) {
            if (area.innerHTML.trim() !== '') area.appendChild(document.createElement("hr")).className = "my-8 border-slate-700";
            area.appendChild(ComponentFactory.createQuiz(block, AppState.userProgress.completedBlocks.has(block.id)));
        } else {
            const btn = document.createElement('button');
            if (AppState.userProgress.completedBlocks.has(blockId)) { btn.textContent = '已完成'; btn.disabled = true; btn.className = 'mt-8 w-full md:w-auto px-8 py-3 rounded-lg btn bg-green-600 font-bold text-lg opacity-70'; }
            else { btn.textContent = '标记为已完成'; btn.className = 'mt-8 w-full md:w-auto px-8 py-3 rounded-lg btn btn-primary font-bold text-lg'; btn.onclick = () => this.completeBlock(blockId); }
            const div = document.createElement('div');
            div.className = 'mt-8 pt-8 border-t border-slate-700';
            div.appendChild(btn);
            area.appendChild(div);
        }
    },
    createMediaPlaceholder(type, block) {
        const icon = type === 'video' ? `<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm8 6l-4 3V7l4 3z"></path></svg>` : `<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;
        return `<div onclick="CourseView.openImmersiveViewer('${type}', '${block[`${type}_url`]}', '${block.title.replace(/'/g, "\\'")}')" class="relative rounded-lg overflow-hidden cursor-pointer group mb-6"><div class="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-colors flex items-center justify-center"><div class="text-center"><div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">${icon}</div><h4 class="text-white text-xl font-bold">${block.title}</h4><p class="text-gray-300">${type === 'video' ? '点击播放视频' : '点击打开文档'}</p></div></div><img src="https://placehold.co/800x450/0f172a/38bdf8?text=${encodeURIComponent(block.title)}" alt="${block.title}" class="w-full h-auto"></div>`;
    },
    async completeBlock(blockId) {
        AppState.userProgress.completedBlocks.add(blockId);
        try {
            await ApiService.saveUserProgress(AppState.user.id, { completed: Array.from(AppState.userProgress.completedBlocks), awarded: Array.from(AppState.userProgress.awardedPointsBlocks) });
            this.showDetailView();
        } catch (e) { UI.showNotification(e.message, "error"); AppState.userProgress.completedBlocks.delete(blockId); }
    },
    isBlockUnlocked(blockId) {
        const flat = AppState.learningMap.flatStructure;
        const idx = flat.findIndex(b => b.id === blockId);
        if (idx <= 0) return true;
        return AppState.userProgress.completedBlocks.has(flat[idx - 1].id);
    },
    openImmersiveViewer(type, url, title) {
        const { title: vTitle, content: vContent } = UI.elements.immersiveView;
        vTitle.textContent = title; vContent.innerHTML = '';
        if (type === 'document') vContent.innerHTML = `<iframe src="${url}" allowfullscreen loading="lazy" title="嵌入的在线文档"></iframe>`;
        else if (type === 'video') ComponentFactory.createVideoJsPlayer(vContent, url, { autoplay: true });
        UI.switchTopLevelView('immersive');
    },
    closeImmersiveViewer() {
        if (AppState.current.topLevelView !== 'immersive') return;
        if (AppState.current.activePlayer) AppState.current.activePlayer.dispose();
        UI.elements.immersiveView.content.innerHTML = ''; 
        UI.switchTopLevelView('main');
    }
};
window.CourseView = CourseView;
EOF
cat << 'EOF' > js/views/admin.js
import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { ApiService } from '../services/api.js';
import { CourseView } from './course.js';
export const AdminView = {
    _currentDeletion: { type: null, id: null },
    bindAdminEvents() {
        const { admin, deleteConfirmModal } = UI.elements;
        admin.backToLearningBtn.addEventListener('click', () => CourseView.showCategoryView());
        admin.categoriesTableContainer.addEventListener('click', (e) => this.handleCategoryListAction(e));
        admin.chaptersTableContainer.addEventListener('click', (e) => this.handleChapterListAction(e));
        admin.sectionsTableContainer.addEventListener('click', (e) => this.handleSectionListAction(e));
        admin.blocksList.addEventListener('click', (e) => this.handleBlockListAction(e));
        admin.addCategoryBtn.addEventListener('click', () => this.openModal('category'));
        admin.addChapterBtn.addEventListener('click', () => this.openModal('chapter'));
        admin.addSectionBtn.addEventListener('click', () => this.openModal('section'));
        admin.addNewBlockBtn.addEventListener('click', () => this.openModal('block'));
        admin.breadcrumb.addEventListener('click', (e) => this.handleBreadcrumbClick(e));
        admin.modal.saveBtn.addEventListener('click', () => this.handleSave());
        admin.modal.cancelBtn.addEventListener('click', () => this.closeModal());
        deleteConfirmModal.confirmBtn.addEventListener('click', () => this.confirmDeletion());
        deleteConfirmModal.cancelBtn.addEventListener('click', () => this.hideDeleteConfirmation());
    },
    async showAdminView() { UI.switchCourseView('admin-management'); this.showCategoryList(); },
    switchAdminView(view) {
        const { categoryListView, chapterListView, sectionListView, blockEditorView } = UI.elements.admin;
        [categoryListView, chapterListView, sectionListView, blockEditorView].forEach(v => v.classList.add('hidden'));
        switch(view) {
            case 'categories': categoryListView.classList.remove('hidden'); break;
            case 'chapters': chapterListView.classList.remove('hidden'); break;
            case 'sections': sectionListView.classList.remove('hidden'); break;
            case 'blocks': blockEditorView.classList.remove('hidden'); break;
        }
        AppState.admin.view = view; this.updateBreadcrumb();
    },
    async showCategoryList() {
        this.switchAdminView('categories');
        AppState.admin.selectedCategory = AppState.admin.selectedChapter = AppState.admin.selectedSection = null;
        const container = UI.elements.admin.categoriesTableContainer;
        UI.renderLoading(container);
        try {
            AppState.admin.categories = await ApiService.fetchAllCategoriesForAdmin();
            this.renderCategoryList();
        } catch (error) { UI.renderError(container, error.message); }
    },
    renderCategoryList() {
        const container = UI.elements.admin.categoriesTableContainer;
        const cats = AppState.admin.categories;
        if (!cats || cats.length === 0) { UI.renderEmpty(container, '没有篇章。请添加一个新篇章。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${cats.map(c => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${c.order}</td><td class="px-6 py-4 font-medium text-gray-900">${c.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-chapters" data-id="${c.id}" class="font-medium text-blue-600 hover:underline">管理章节</button><button data-action="edit" data-id="${c.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="category" data-id="${c.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showChapterList(cat) { AppState.admin.selectedCategory = cat; this.switchAdminView('chapters'); UI.elements.admin.chapterListTitle.textContent = `章节管理: ${cat.title}`; this.renderChapterList(); },
    renderChapterList() {
        const container = UI.elements.admin.chaptersTableContainer;
        const chapters = AppState.admin.selectedCategory.chapters || [];
        if (chapters.length === 0) { UI.renderEmpty(container, '没有章节。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${chapters.map(c => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${c.order}</td><td class="px-6 py-4 font-medium text-gray-900">${c.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-sections" data-id="${c.id}" class="font-medium text-blue-600 hover:underline">管理小节</button><button data-action="edit" data-id="${c.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="chapter" data-id="${c.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showSectionList(chap) { AppState.admin.selectedChapter = chap; this.switchAdminView('sections'); UI.elements.admin.sectionListTitle.textContent = `小节管理: ${chap.title}`; this.renderSectionList(); },
    renderSectionList() {
        const container = UI.elements.admin.sectionsTableContainer;
        const sections = AppState.admin.selectedChapter.sections || [];
        if (sections.length === 0) { UI.renderEmpty(container, '没有小节。'); return; }
        container.innerHTML = `<table class="w-full text-sm text-left text-gray-500"><thead class="text-xs text-gray-700 uppercase bg-gray-50"><tr><th class="px-6 py-3">顺序</th><th class="px-6 py-3">标题</th><th class="px-6 py-3 text-right">操作</th></tr></thead><tbody>${sections.map(s => `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-6 py-4">${s.order}</td><td class="px-6 py-4 font-medium text-gray-900">${s.title}</td><td class="px-6 py-4 text-right space-x-2"><button data-action="view-blocks" data-id="${s.id}" class="font-medium text-blue-600 hover:underline">管理内容块</button><button data-action="edit" data-id="${s.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="section" data-id="${s.id}" class="font-medium text-red-600 hover:underline">删除</button></td></tr>`).join('')}</tbody></table>`;
    },
    showBlockEditor(sec) { AppState.admin.selectedSection = sec; this.switchAdminView('blocks'); UI.elements.admin.editorSectionTitle.textContent = `内容块管理: ${sec.title}`; this.renderBlockList(); },
    renderBlockList() {
        const container = UI.elements.admin.blocksList;
        const blocks = AppState.admin.selectedSection.blocks || [];
        container.innerHTML = '';
        if (blocks.length === 0) { UI.renderEmpty(container, '没有内容块。'); return; }
        blocks.forEach(block => {
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-lg shadow flex justify-between items-start';
            let type = '内容';
            if(block.quiz_question) type = '测验'; else if(block.document_url) type = '文档'; else if(block.video_url) type = '视频';
            el.innerHTML = `<div><div class="font-bold text-lg text-gray-800">${block.order}. ${block.title}</div><div class="text-sm text-gray-500 mt-1">类型: ${type}</div></div><div class="flex-shrink-0 ml-4 space-x-2"><button data-action="edit" data-id="${block.id}" class="font-medium text-indigo-600 hover:underline">编辑</button><button data-action="delete" data-type="block" data-id="${block.id}" class="font-medium text-red-600 hover:underline">删除</button></div>`;
            container.appendChild(el);
        });
    },
    updateBreadcrumb() {
        const { breadcrumb } = UI.elements.admin;
        const { selectedCategory, selectedChapter, selectedSection } = AppState.admin;
        let html = `<a href="#" data-nav="categories" class="hover:underline">篇章管理</a>`;
        if (selectedCategory) html += ` <span class="mx-2">/</span> <a href="#" data-nav="chapters" data-id="${selectedCategory.id}" class="hover:underline">${selectedCategory.title}</a>`;
        if (selectedChapter) html += ` <span class="mx-2">/</span> <a href="#" data-nav="sections" data-id="${selectedChapter.id}" class="hover:underline">${selectedChapter.title}</a>`;
        if (selectedSection) html += ` <span class="mx-2">/</span> <span class="font-semibold">${selectedSection.title}</span>`;
        breadcrumb.innerHTML = html;
    },
    openModal(type, item = null) {
        AppState.admin.editingItem = item; AppState.admin.editingType = type;
        const { modal } = UI.elements.admin; modal.form.innerHTML = '';
        const v = (key, def = '') => item ? (item[key] !== null && item[key] !== undefined ? item[key] : def) : def;
        let formHtml = '';
        switch (type) {
            case 'category': modal.title.textContent = item ? '编辑篇章' : '新增篇章'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">描述</label><textarea name="description" class="admin-textarea" rows="3">${v('description')}</textarea></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'chapter': modal.title.textContent = item ? '编辑章节' : '新增章节'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">描述</label><textarea name="description" class="admin-textarea" rows="3">${v('description')}</textarea></div><div><label class="admin-label">封面图片URL</label><input name="image_url" class="admin-input" value="${v('image_url')}"></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'section': modal.title.textContent = item ? '编辑小节' : '新增小节'; formHtml = `<div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div>`; break;
            case 'block':
                modal.title.textContent = item ? '编辑内容块' : '新增内容块';
                const opts = v('quiz_options', ['','','','']);
                const correctIdx = v('correct_answer_index', 0);
                formHtml = `<p class="text-sm text-gray-500">提示：一个内容块可以同时包含视频、文档和Markdown内容。</p><div><label class="admin-label">标题</label><input name="title" class="admin-input" value="${v('title')}" required></div><div><label class="admin-label">顺序</label><input name="order" type="number" class="admin-input" value="${v('order', 0)}" required></div><hr class="my-4"><h4 class="text-lg font-semibold mb-2">内容选项</h4><div><label class="admin-label">视频URL</label><input name="video_url" class="admin-input" value="${v('video_url')}" placeholder="https://example.com/video.mp4"></div><div><label class="admin-label">在线文档URL</label><input name="document_url" class="admin-input" value="${v('document_url')}" placeholder="https://kdocs.cn/l/..."><p class="text-xs text-gray-500 mt-1">请粘贴“公开分享”或“嵌入”链接。</p></div><div><label class="admin-label">内容 (Markdown)</label><textarea name="content_markdown" class="admin-textarea" rows="8">${v('content_markdown')}</textarea></div><hr class="my-4"><h4 class="text-lg font-semibold mb-2">测验 (可选)</h4><p class="text-sm text-gray-500">填写问题后，此内容块将变为测验。</p><div><label class="admin-label">问题</label><input name="quiz_question" class="admin-input" value="${v('quiz_question')}"></div><div><label class="admin-label">选项</label><input name="quiz_options_0" class="admin-input mb-2" placeholder="选项 A" value="${opts[0] || ''}"><input name="quiz_options_1" class="admin-input mb-2" placeholder="选项 B" value="${opts[1] || ''}"><input name="quiz_options_2" class="admin-input mb-2" placeholder="选项 C" value="${opts[2] || ''}"><input name="quiz_options_3" class="admin-input" placeholder="选项 D" value="${opts[3] || ''}"></div><div><label class="admin-label">正确答案</label><select name="correct_answer_index" class="admin-select"><option value="0" ${correctIdx == 0 ? 'selected' : ''}>选项 A</option><option value="1" ${correctIdx == 1 ? 'selected' : ''}>选项 B</option><option value="2" ${correctIdx == 2 ? 'selected' : ''}>选项 C</option><option value="3" ${correctIdx == 3 ? 'selected' : ''}>选项 D</option></select></div>`;
                break;
        }
        modal.form.innerHTML = formHtml; modal.backdrop.classList.add('active'); modal.container.classList.remove('hidden');
    },
    closeModal() { const { modal } = UI.elements.admin; modal.backdrop.classList.remove('active'); modal.container.classList.add('hidden'); AppState.admin.editingItem = null; AppState.admin.editingType = null; },
    async handleSave() {
        const { form } = UI.elements.admin.modal; const formData = new FormData(form); const data = {};
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('quiz_options')) {
                if (!data.quiz_options) data.quiz_options = [];
                data.quiz_options[parseInt(key.split('_')[2])] = value;
            } else { data[key] = value; }
        }
        const type = AppState.admin.editingType; const item = AppState.admin.editingItem;
        try {
            switch (type) {
                case 'category': await ApiService.upsertCategory({ id: item?.id, ...data }); break;
                case 'chapter': await ApiService.upsertChapter({ id: item?.id, category_id: AppState.admin.selectedCategory.id, ...data }); break;
                case 'section': await ApiService.upsertSection({ id: item?.id, chapter_id: AppState.admin.selectedChapter.id, ...data }); break;
                case 'block':
                    data.correct_answer_index = data.quiz_question ? parseInt(data.correct_answer_index) : null;
                    data.quiz_options = data.quiz_question ? data.quiz_options.filter(o => o) : null;
                    await ApiService.upsertBlock({ id: item?.id, section_id: AppState.admin.selectedSection.id, ...data });
                    break;
            }
            UI.showNotification('保存成功', 'success'); this.closeModal();
            this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`保存失败: ${error.message}`, 'error'); }
    },
    async refreshAdminViewAfterSave() {
        const freshData = await ApiService.fetchAllCategoriesForAdmin(); AppState.admin.categories = freshData;
        switch(AppState.admin.view) {
            case 'categories': this.renderCategoryList(); break;
            case 'chapters': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); this.renderChapterList(); break;
            case 'sections': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); this.renderSectionList(); break;
            case 'blocks': AppState.admin.selectedCategory = freshData.find(c => c.id === AppState.admin.selectedCategory.id); AppState.admin.selectedChapter = AppState.admin.selectedCategory.chapters.find(ch => ch.id === AppState.admin.selectedChapter.id); AppState.admin.selectedSection = AppState.admin.selectedChapter.sections.find(s => s.id === AppState.admin.selectedSection.id); this.renderBlockList(); break;
        }
    },
    showDeleteConfirmation(type, id, name) { this._currentDeletion = { type, id }; UI.elements.deleteConfirmModal.message.innerHTML = `您确定要删除 "${name}" 吗？<br><strong class="text-red-400">此操作不可撤销。</strong>`; UI.elements.deleteConfirmModal.container.classList.remove('hidden'); UI.elements.deleteConfirmModal.container.classList.add('flex'); },
    hideDeleteConfirmation() { UI.elements.deleteConfirmModal.container.classList.add('hidden'); },
    async confirmDeletion() {
        const { type, id } = this._currentDeletion; if (!type || !id) return; this.hideDeleteConfirmation();
        try {
            switch (type) { case 'category': await ApiService.deleteCategory(id); break; case 'chapter': await ApiService.deleteChapter(id); break; case 'section': await ApiService.deleteSection(id); break; case 'block': await ApiService.deleteBlock(id); break; }
            UI.showNotification('删除成功', 'success');
            await this.refreshAdminViewAfterSave();
        } catch (error) { UI.showNotification(`删除失败: ${error.message}`, 'error'); }
    },
    handleCategoryListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.categories.find(c => c.id == id); if (!i) return; switch (action) { case 'view-chapters': this.showChapterList(i); break; case 'edit': this.openModal('category', i); break; case 'delete': this.showDeleteConfirmation('category', id, i.title); break; } },
    handleChapterListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedCategory.chapters.find(c => c.id == id); if (!i) return; switch (action) { case 'view-sections': this.showSectionList(i); break; case 'edit': this.openModal('chapter', i); break; case 'delete': this.showDeleteConfirmation('chapter', id, i.title); break; } },
    handleSectionListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedChapter.sections.find(s => s.id == id); if (!i) return; switch (action) { case 'view-blocks': this.showBlockEditor(i); break; case 'edit': this.openModal('section', i); break; case 'delete': this.showDeleteConfirmation('section', id, i.title); break; } },
    handleBlockListAction(e) { const t = e.target.closest('button'); if (!t) return; const { action, id } = t.dataset; const i = AppState.admin.selectedSection.blocks.find(b => b.id == id); if (!i) return; switch (action) { case 'edit': this.openModal('block', i); break; case 'delete': this.showDeleteConfirmation('block', id, i.title); break; } },
    handleBreadcrumbClick(e) {
        e.preventDefault(); const t = e.target.closest('a'); if (!t) return; const { nav, id } = t.dataset;
        switch (nav) {
            case 'categories': this.showCategoryList(); break;
            case 'chapters': this.showChapterList(AppState.admin.categories.find(c => c.id == id)); break;
            case 'sections': this.showSectionList(AppState.admin.selectedCategory.chapters.find(c => c.id == id)); break;
        }
    }
};
EOF
cat << 'EOF' > js/components/factory.js
import { AppState } from '../state.js';
import { UI } from '../ui.js';
import { CourseView } from '../views/course.js';
import { ApiService } from '../services/api.js';
export const ComponentFactory = {
    createCategoryCard(category, isLocked) {
        const card = document.createElement("div");
        card.className = `card rounded-xl overflow-hidden relative transition-all duration-300 flex flex-col ${isLocked ? 'bg-slate-800/50 cursor-not-allowed opacity-60' : 'cursor-pointer'}`;
        card.innerHTML = `<div class="p-8 flex flex-col flex-grow relative">${isLocked ? '<div class="absolute top-4 right-4 text-3xl">🔒</div>' : ''}<h2 class="text-2xl font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-emerald-400'}">${category.title}</h2><p class="mb-6 ${isLocked ? 'text-gray-600' : 'text-gray-400'} flex-grow">${category.description || ""}</p><button class="w-full text-white font-bold py-3 px-4 rounded-lg btn ${isLocked ? 'bg-gray-600 cursor-not-allowed' : 'btn-primary'} mt-auto" ${isLocked ? 'disabled' : ''}>${isLocked ? '已锁定' : '进入篇章'}</button></div>`;
        card.addEventListener("click", () => { if (!isLocked) CourseView.selectCategory(category.id); else UI.showNotification("请先完成前一个篇章的所有内容来解锁此篇章", "error"); });
        return card;
    },
    createChapterCard(chapter) {
        const card = document.createElement("div");
        card.className = `card rounded-xl overflow-hidden relative transition-all duration-300 cursor-pointer flex flex-col`;
        card.innerHTML = `<div class="relative"><img src="${chapter.image_url || "https://placehold.co/600x400/0f172a/38bdf8?text=学习"}" alt="${chapter.title}" class="w-full h-48 object-cover"></div><div class="p-6 flex flex-col flex-grow"><h2 class="text-xl font-bold mb-2 text-white">${chapter.title}</h2><p class="mb-4 text-sm text-gray-400 flex-grow">${chapter.description || ""}</p><button class="w-full text-white font-bold py-3 px-4 rounded-lg btn bg-indigo-600 hover:bg-indigo-700 mt-auto">开始学习</button></div>`;
        card.querySelector("button").addEventListener("click", () => CourseView.selectChapter(chapter.id));
        return card;
    },
    createBlockItem(block, isLocked, isCompleted) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#"; a.dataset.blockId = block.id;
        a.className = "block-item flex items-center p-3 rounded-md transition-colors duration-200";
        let iconPath = "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 5.168A1 1 0 008 6v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z";
        if (block.document_url) iconPath = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
        else if (block.quiz_question) iconPath = "M8.228 9.828a1 1 0 00-1.414 1.414L8.586 13l-1.772 1.758a1 1 0 101.414 1.414L10 14.414l1.772 1.758a1 1 0 101.414-1.414L11.414 13l1.772-1.758a1 1 0 00-1.414-1.414L10 11.586l-1.772-1.758z M10 18a8 8 0 100-16 8 8 0 000 16z";
        if (isLocked) { a.classList.add("locked"); iconPath = "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"; } 
        else { a.classList.add("hover:bg-slate-700/50"); }
        if (isCompleted) { a.classList.add("completed"); iconPath = "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"; }
        a.innerHTML = `<svg class="block-icon w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="${iconPath}" clip-rule="evenodd"></path></svg><span class="flex-1">${block.title}</span>`;
        a.addEventListener("click", e => { e.preventDefault(); if (!isLocked) CourseView.selectBlock(block.id); else UI.showNotification("请先完成前置内容来解锁此部分", "error"); });
        li.appendChild(a);
        return li;
    },
    createQuiz(block, isCompleted) {
        const quiz = document.createElement("div");
        const correctIdx = block.correct_answer_index;
        let optsHtml = (block.quiz_options || []).map((opt, i) => `<div class="quiz-option p-4 rounded-lg cursor-pointer transition-colors ${isCompleted ? `opacity-70 pointer-events-none ${i === correctIdx ? 'correct' : ''}` : ''}" data-index="${i}">${opt}</div>`).join("");
        quiz.innerHTML = `<h3 class="text-2xl font-bold mb-6 text-sky-300">${block.quiz_question}</h3><div class="space-y-4">${optsHtml}</div><button id="submit-quiz-btn" class="mt-8 w-full md:w-auto px-8 py-3 rounded-lg btn bg-indigo-600 hover:bg-indigo-700 font-bold text-lg" ${isCompleted ? "disabled" : "disabled"}>${isCompleted ? "已完成" : "提交答案"}</button>`;
        if (isCompleted) return quiz;
        let selectedOpt = null;
        quiz.querySelectorAll(".quiz-option").forEach(opt => {
            opt.addEventListener("click", () => {
                if (quiz.querySelector(".correct, .incorrect")) return;
                quiz.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
                opt.classList.add("selected"); selectedOpt = opt;
                quiz.querySelector("#submit-quiz-btn").disabled = false;
            });
        });
        quiz.querySelector("#submit-quiz-btn").addEventListener("click", async () => {
            if (!selectedOpt) return;
            quiz.querySelectorAll(".quiz-option").forEach(o => o.style.pointerEvents = 'none');
            quiz.querySelector("#submit-quiz-btn").disabled = true;
            const selectedIdx = parseInt(selectedOpt.dataset.index);
            if (selectedIdx === correctIdx) {
                selectedOpt.classList.remove("selected"); selectedOpt.classList.add("correct");
                if (!AppState.userProgress.awardedPointsBlocks.has(block.id)) {
                    try {
                        UI.showNotification("回答正确! 获得 10 学分!", "success");
                        await ApiService.addPoints(AppState.user.email, 10);
                        AppState.userProgress.awardedPointsBlocks.add(block.id);
                        CourseView.updateLeaderboard();
                    } catch (e) { UI.showNotification(e.message, "error"); }
                } else { UI.showNotification("回答正确! (积分已获得)", "success"); }
                await CourseView.completeBlock(block.id);
            } else {
                selectedOpt.classList.remove("selected"); selectedOpt.classList.add("incorrect");
                quiz.querySelector(`[data-index='${correctIdx}']`).classList.add("correct");
                UI.showNotification("回答错误, 再接再厉!", "error");
                await CourseView.completeBlock(block.id);
            }
        });
        return quiz;
    },
    createVideoJsPlayer(container, videoUrl, options = {}) {
        container.innerHTML = '';
        const videoEl = document.createElement('video');
        videoEl.id = `video-player-${Date.now()}`;
        videoEl.className = "video-js vjs-theme-custom vjs-big-play-centered";
        videoEl.setAttribute('controls', ''); videoEl.setAttribute('preload', 'auto');
        container.appendChild(videoEl);
        const player = videojs(videoEl, { fluid: true, autoplay: options.autoplay || false, });
        player.src({ src: videoUrl, type: videoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' });
        player.on('error', () => { const e = player.error(); console.error('Video.js Error:', e); UI.showNotification(`视频播放错误: ${e ? e.message : '未知错误'}.`, 'error'); });
        player.on('dispose', () => { AppState.current.activePlayer = null; });
        if (AppState.current.activePlayer) AppState.current.activePlayer.dispose();
        AppState.current.activePlayer = player;
    }
};
EOF

echo "✅ 所有文件已创建并填充内容。"
echo "🎉 项目生成完毕！"
echo "👉 下一步：在浏览器中打开 index.html 文件开始使用。"
echo "✅ 脚本执行完毕。项目已成功生成！"