# 選擇一個含有 Node.js 的基礎映像檔
FROM node:12.22.12

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 yarn.lock 到工作目錄
COPY package.json .
COPY yarn.lock .

# 安裝應用程序的依賴項
RUN yarn install --production

# 添加 bcrypt 最新版本
RUN yarn add bcrypt@latest

# 複製其他專案檔案到工作目錄
COPY . .

# 使用 yarn 命令構建前端應用
RUN yarn build

# 暴露容器運行時的端口
EXPOSE 80

# 定義容器啟動時執行的命令
CMD ["yarn", "start"]
