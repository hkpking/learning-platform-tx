#!/bin/bash

# =================================================================
# 优化后的 Git 自动同步脚本
#
# 功能:
# 1. 自动暂存所有更改。
# 2. 检查是否有实际更改，如有则提交。
# 3. 检查是否有本地未推送的提交。
# 4. 将所有需要同步的内容推送到远程仓库。
#
# 使用方法:
#   1. ./sync-git.sh "你的提交信息" (推荐)
#   2. ./sync-git.sh (使用默认的提交信息)
# =================================================================

# --- 配置 ---
# 设置颜色变量，用于美化输出
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- 脚本开始 ---
echo -e "${YELLOW}🚀 开始执行 Git 同步...${NC}"

# 1. 暂存所有本地更改
git add .
echo -e "${GREEN}✔ 步骤 1/4: 已尝试将所有更改添加到暂存区 (git add .)。${NC}"

# 2. 检查是否有文件被暂存以待提交
# 使用 `git diff --staged --quiet` 命令，如果暂存区为空，它会返回 0
if git diff --staged --quiet; then
  echo -e "${GREEN}ℹ️  没有新的文件更改需要提交。${NC}"
else
  echo -e "${YELLOW}✨ 检测到新的文件更改，正在准备提交...${NC}"
  # 2.1 提交更改
  # 检查用户是否提供了提交信息作为参数
  if [ -n "$1" ]; then
    # 如果提供了参数，则使用用户的提交信息
    COMMIT_MESSAGE="$1"
  else
    # 如果未提供，则使用带有当前时间的默认信息
    COMMIT_MESSAGE="chore: 自动同步于 $(date +'%Y-%m-%d %H:%M:%S')"
    echo -e "${YELLOW}⚠️  未提供提交信息，将使用默认信息: '${COMMIT_MESSAGE}'${NC}"
  fi

  # 执行提交命令
  git commit -m "$COMMIT_MESSAGE"

  # 检查提交是否成功
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 提交失败！请检查是否存在 Git 冲突或其他错误。${NC}"
    exit 1
  fi
  echo -e "${GREEN}✔ 步骤 2/4: 已成功提交更改。${NC}"
fi

# 3. 检查本地是否领先于远程（即是否有未推送的提交）
# 使用 `git status -sb` 并通过 grep 查找 "ahead" 关键词
if [[ $(git status -sb) == *"ahead"* ]]; then
  echo -e "${YELLOW}📡 步骤 3/4: 检测到本地有领先于远程的提交，正在推送到远程仓库...${NC}"
  # 4. 推送到远程仓库
  git push

  # 检查推送是否成功
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ 步骤 4/4: 推送成功！${NC}"
    echo -e "${GREEN}🎉 同步完成！您的代码已更新到远程仓库。${NC}"
  else
    echo -e "${RED}❌ 推送失败！请检查您的网络连接、远程仓库配置或权限。${NC}"
    # 提示用户可能需要先拉取更新
    echo -e "${YELLOW}💡 提示: 推送失败可能是因为远程仓库有您本地没有的更新。请尝试先执行 'git pull'。${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✔ 步骤 3/4 & 4/4: 本地与远程仓库已同步，无需推送。${NC}"
  echo -e "${GREEN}🎉 一切都已是最新状态！${NC}"
fi

exit 0