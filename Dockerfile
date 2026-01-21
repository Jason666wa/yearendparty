# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 使用 npm ci 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端应用
RUN npm run build

# 构建后端 TypeScript
RUN npm run build:server

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 复制 package.json 和 package-lock.json 用于安装生产依赖
COPY package.json package-lock.json ./

# 使用 npm ci 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制前端构建产物
COPY --from=builder /app/dist ./dist

# 从构建阶段复制后端构建产物
COPY --from=builder /app/dist-server ./dist-server

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "dist-server/server.js"]
