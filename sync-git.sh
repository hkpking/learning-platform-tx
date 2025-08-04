#!/bin/bash

# =================================================================
# Git 自动同步脚本
# 功能: 自动暂存、提交和推送所有本地更改。
# 使用方法:
#   1. ./sync-git.sh "你的提交信息" (推荐)
#   2. ./sync-git.sh (使用默认的提交信息)
# =================================================================

# 设置颜色变量，用于美化输出
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 开始执行 Git 同步...${NC}"

# 1. 暂存所有更改
git add .
echo -e "${GREEN}✔ 步骤 1/3: 已将所有更改添加到暂存区 (git add .)。${NC}"

# 2. 提交更改
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
  echo -e "${RED}❌ 提交失败！请检查暂存区是否有内容或是否存在其他 Git 错误。${NC}"
  exit 1
fi
echo -e "${GREEN}✔ 步骤 2/3: 已成功提交更改。${NC}"

# 3. 推送到远程仓库
echo -e "${YELLOW}📡 正在推送到远程仓库 (git push)...${NC}"
git push

# 检查推送是否成功
if [ $? -eq 0 ]; then
  echo -e "${GREEN}🎉 同步成功！您的代码已更新到远程仓库。${NC}"
else
  echo -e "${RED}❌ 推送失败！请检查您的网络连接、远程仓库配置或权限。${NC}"
  exit 1
fi

exit 0