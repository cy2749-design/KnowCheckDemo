# 多阶段构建 Dockerfile
FROM node:20-alpine AS base

# 安装阶段
FROM base AS install
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# 安装依赖
RUN npm ci && \
    cd server && npm ci && \
    cd ../client && npm ci

# 构建阶段
FROM base AS build
WORKDIR /app

# 复制依赖和源代码
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/server/node_modules ./server/node_modules
COPY --from=install /app/client/node_modules ./client/node_modules

COPY . .

# 构建前端
RUN cd client && npm run build

# 构建后端
RUN cd server && npm run build

# 生产阶段
FROM base AS production
WORKDIR /app

# 只复制必要的文件
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/src/config ./server/src/config

# 安装生产依赖
RUN cd server && npm ci --production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server/dist/index.js"]

