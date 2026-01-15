var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');

// 浏览器实例缓存，用于优化性能
let cachedBrowser;

/**
 * 获取浏览器实例的辅助函数
 */
async function getBrowserInstance() {
  // 如果浏览器不存在或已断开连接，则启动新实例
  if (!cachedBrowser || !cachedBrowser.isConnected()) {
    cachedBrowser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process' // 进一步节省内存，适合 Render 免费版
      ],
      // 适配不同环境的 Chromium 路径
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    });

    // 监听浏览器关闭事件，清空缓存
    cachedBrowser.once('disconnected', () => {
      cachedBrowser = null;
    });
  }
  return cachedBrowser;
}

/* 根路径：确认服务在线 */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'HTML to Image Service' });
});

/* 核心接口：POST http://localhost:3000/convert */
router.post('/convert', async (req, res) => {
  const { html, width = 800, height = 600, type = 'png' } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing html content' });
  }

  let page;
  try {
    const browser = await getBrowserInstance();
    page = await browser.newPage();

    // 设置视口
    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height)
    });

    // 设置 HTML 内容
    // networkidle0 表示直到 500ms 内没有网络连接时才认为加载完成
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 截取图片
    const buffer = await page.screenshot({
      type: type === 'jpeg' ? 'jpeg' : 'png',
      fullPage: true
    });

    // 返回图片流
    res.set('Content-Type', `image/${type === 'jpeg' ? 'jpeg' : 'png'}`);
    res.send(buffer);

  } catch (e) {
    console.error('Puppeteer Error:', e);
    res.status(500).json({ error: 'Conversion failed', message: e.message });
  } finally {
    if (page) {
      await page.close(); // 仅关闭标签页，保留浏览器进程
    }
  }
});

module.exports = router;