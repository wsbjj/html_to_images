# 1. 使用官方 Puppeteer 镜像
FROM ghcr.io/puppeteer/puppeteer:latest

# 2. 切换到 root 用户进行高权限操作
USER root

# 3. 安装中文字体
RUN apt-get update \
    && apt-get install -y fonts-wqy-zenhei fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

# 4. 设置工作目录
WORKDIR /home/pptruser/app

# 5. 复制 package 相关文件
# 先复制这些是为了利用 Docker 缓存层
COPY package*.json ./

# 6. 关键步骤：修正目录所有权，确保 pptruser 有权写入
# 我们把目录的所有者改为 pptruser
RUN chown -R pptruser:pptruser /home/pptruser/app

# 7. 切换回低权限用户 pptruser 执行安装
USER pptruser

# 8. 执行安装 (此时 pptruser 已经有权限写入这个目录了)
RUN npm install

# 9. 切换回 root 复制剩下的源代码并再次修正权限
USER root
COPY . .
RUN chown -R pptruser:pptruser /home/pptruser/app

# 10. 最终以 pptruser 身份运行
USER pptruser

EXPOSE 3000
CMD ["npm", "start"]