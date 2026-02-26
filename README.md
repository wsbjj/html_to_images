# HTML 转图片服务 (HTML to Image Service)

一个基于 Node.js、Express 和 Puppeteer 构建的轻量级、可靠的微服务，可将 HTML 内容转换为高保真的图片（PNG/JPEG）。

## 功能特点

- **快速且可靠**：复用单个无头 Chrome 浏览器实例（`puppeteer`），以获得最佳性能并降低资源消耗。
- **RESTful API**：通过简单的 `POST /convert` 接口即可轻松集成到任何应用中。
- **平台优化**：专为类似 Render 这样的云平台设计，放宽了等待条件（`domcontentloaded`）并延长了超时时间，以确保渲染的稳定性。
- **支持 Docker**：开箱即用的容器化支持（包含 `Dockerfile` 和 `docker-compose.yml`），便于部署。

## 前置条件

- Node.js (推荐 v14+ 版本)
- Docker & Docker Compose (可选，用于容器化部署)

## 快速开始

### 本地开发

1. 克隆代码仓库并进入项目根目录。
2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动服务：

   ```bash
   npm start
   ```

   服务将在本地启动（通常是 3000 端口，除非在 `bin/www` 中另有指定）。

### Docker 部署

使用 Docker Compose 构建并运行应用：

```bash
docker-compose up -d
```

## API 文档

### POST `/convert`

将 HTML 字符串转换为图片，并返回可供访问的公开 URL。

**请求体 (JSON):**

| 参数 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `html` | `String` | **必填** | 需要转换的 HTML 内容。 |
| `width` | `Number` | `800` | 视口宽度（像素）。 |
| `height` | `Number` | `600` | 视口高度（像素）。 |
| `type` | `String` | `"png"` | 输出的图片格式（`"png"` 或 `"jpeg"`）。 |

**请求示例：**

```json
{
  "html": "<div style=\"padding: 20px; background: linear-gradient(to right, #ff7e5f, #feb47b); color: white; border-radius: 10px;\"><h1>你好，世界！</h1><p>HTML 转图片成功！</p></div>",
  "width": 1024,
  "height": 768,
  "type": "png"
}
```

**响应示例：**

```json
{
  "image_url": "https://html-to-images.onrender.com/1678901234567.png",
  "status": "success"
}
```

> **注意**：生成的图片会保存在本地的 `/public` 目录中，返回的 URL 使用了预先配置的生产域名。如果你在其他地方托管，请记得在 `routes/index.js` 中更新基础 URL。

## 架构与基础设施说明

- **静态资源**：生成的图片存储在本地的 `public` 文件夹中，由 Express 作为静态文件提供服务。
- **无头 Chrome (Headless Chrome)**：支持较大的 HTML 负载（最高 10MB）。该 API 具有足够的鲁棒性，能够绕过标准的沙盒机制，在受内存限制的容器化环境中有效运行（`--no-sandbox`, `--disable-dev-shm-usage`）。
