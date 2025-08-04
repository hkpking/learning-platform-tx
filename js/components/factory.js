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
                        // [CONSISTENCY CHANGE] Pass user ID instead of email
                        await ApiService.addPoints(AppState.user.id, 10);
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
