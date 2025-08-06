#!/bin/bash

# =================================================================
#  Git 智能同步脚本 (v2.0)
#
#  功能:
#  1. 自动暂存所有更改。
#  2. 检查并提交更改。
#  3. 交互式选择要推送的环境（测试或正式）。
#  4. 安全地将代码推送到指定环境。
# =================================================================

# --- 配置 ---
# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# 远程仓库别名
TEST_REMOTE="origin"
PROD_REMOTE="prod"

# --- 脚本开始 ---
echo -e "${YELLOW}🚀 开始执行 Git 智能同步...${NC}"

# 检查正式环境远程仓库是否存在
if ! git remote get-url "$PROD_REMOTE" > /dev/null 2>&1; then
    echo -e "${RED}❌ 错误：找不到名为 '$PROD_REMOTE' 的远程仓库。${NC}"
    echo -e "${CYAN}💡 请先运行 'git remote add prod <您的正式仓库URL>' 添加它。${NC}"
    exit 1
fi

# 1. 暂存所有本地更改
git add .
echo -e "${GREEN}✔ 步骤 1/4: 已暂存所有本地更改。${NC}"

# 2. 检查并提交更改
if git diff --staged --quiet; then
  echo -e "${GREEN}ℹ️  没有新的文件更改需要提交。${NC}"
else
  echo -e "${YELLOW}✨ 检测到新更改，准备提交...${NC}"
  COMMIT_MESSAGE=${1:-"chore: 自动同步于 $(date +'%Y-%m-%d %H:%M:%S')"}
  if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  未提供提交信息，使用默认信息: '${COMMIT_MESSAGE}'${NC}"
  fi
  git commit -m "$COMMIT_MESSAGE"
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 提交失败！请检查错误。${NC}"
    exit 1
  fi
  echo -e "${GREEN}✔ 步骤 2/4: 更改已成功提交。${NC}"
fi

# 3. 交互式选择推送环境
echo -e "${CYAN}请选择要推送到的环境:${NC}"
echo "  1) 测试环境 ($TEST_REMOTE)"
echo "  2) 正式环境 ($PROD_REMOTE)"
read -p "请输入选项 (1 或 2): " choice

REMOTE_NAME=""
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) # 获取当前分支名

case $choice in
    1)
        REMOTE_NAME="$TEST_REMOTE"
        echo -e "${YELLOW}📡 准备推送到 [测试环境]...${NC}"
        ;;
    2)
        REMOTE_NAME="$PROD_REMOTE"
        # 增加一个额外的确认步骤，防止误操作
        read -p "🚨 您确定要推送到 [正式环境] 吗？(y/n): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            echo -e "${YELLOW}操作已取消。${NC}"
            exit 0
        fi
        echo -e "${YELLOW}📡 准备推送到 [正式环境]...${NC}"
        ;;
    *)
        echo -e "${RED}❌ 无效的选项。脚本已中止。${NC}"
        exit 1
        ;;
esac

# 4. 检查是否有需要推送的提交并执行推送
if [[ $(git status -sb | grep "ahead") ]]; then
  echo -e "${CYAN}✔ 步骤 3/4: 检测到本地提交领先于远程，开始推送...${NC}"
  git push "$REMOTE_NAME" "$BRANCH_NAME"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ 步骤 4/4: 成功推送到 ${REMOTE_NAME} 的 ${BRANCH_NAME} 分支！${NC}"
    echo -e "${GREEN}🎉 同步完成！${NC}"
  else
    echo -e "${RED}❌ 推送失败！${NC}"
    echo -e "${CYAN}💡 提示: 远程仓库可能有您本地没有的更新，请尝试先执行 'git pull ${REMOTE_NAME} ${BRANCH_NAME}'。${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✔ 步骤 3/4 & 4/4: 本地与远程仓库已同步，无需推送。${NC}"
  echo -e "${GREEN}🎉 一切都已是最新状态！${NC}"
fi

exit 0