# 使用官方 Node.js 基础镜像
FROM node:16-slim

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

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y --no-install-recommends \
    libnss3 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm1\
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8081

# 定义挂载点
VOLUME ["/app/UserData"]

# 安装项目依赖
RUN npm install

# 运行应用
CMD ["npm", "run", "start"]