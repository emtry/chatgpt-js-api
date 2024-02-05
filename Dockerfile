# 使用官方 Node.js 基础镜像
FROM node:16-slim

# 设置工作目录为 /app
WORKDIR /app

# 将当前目录内容复制到位于 /app 的容器中
COPY . /app

# 设置环境变量
ENV USERNAME=""
ENV PASSWORD=""
ENV PROCESS_WORKERS=5
ENV LOGLEVEL="info"
ENV PROXY=""
ENV TIMEOUT=60000
ENV HEADLESS="new"

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libxkbcommon0 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libatspi2.0-0 libgtk-3-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安装项目依赖
RUN npm install

# 定义挂载点
VOLUME ["/app/UserData"]

EXPOSE 8081

# 运行应用
CMD ["npm", "run", "start"]