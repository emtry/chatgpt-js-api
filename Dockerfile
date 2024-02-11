# 使用官方 Node.js 基础镜像
FROM node:16-slim

RUN apt update && apt install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libxss1 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录为 /app
WORKDIR /app

# 将当前目录内容复制到位于 /app 的容器中
COPY . /app

# 设置环境变量
ENV USERNAME=""
ENV PASSWORD=""
ENV PROCESS_WORKERS=2
ENV LOGLEVEL="info"
ENV PROXY=""
ENV TIMEOUT=60000
ENV HEADLESS="new"

# 定义挂载点
VOLUME ["/app/UserData"]

EXPOSE 8081

# 安装项目依赖
RUN npm install

# 运行应用
CMD ["npm", "run", "start"]
