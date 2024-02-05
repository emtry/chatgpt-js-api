# 使用官方 Node.js 基础镜像
FROM node:14

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

RUN apt update && apt install -y jq

# 安装项目依赖
RUN npm install

EXPOSE 8081

# 运行应用
CMD ["npm", "run", "start"]