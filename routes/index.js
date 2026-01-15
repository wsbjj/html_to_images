var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');

// 浏览器实例缓存，用于优化性能
let cachedBrowser;

/**
 * 获取浏览器实例的辅助函数
 */
async function getBrowserInstance() {
  if (!cachedBrowser || !cachedBrowser.isConnected()) {
    cachedBrowser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    });

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

/* 核心接口：POST /convert */
router.post('/convert', async (req, res) => {
  const { html, width = 800, height = 600, type = 'png' } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing html content' });
  }

  let page;
  try {
    const browser = await getBrowserInstance();
    page = await browser.newPage();

    await page.setViewport({
      width: parseInt(width),
      height: parseInt(height)
    });

    // 优化：针对 Render 环境放宽等待条件并增加超时时间
    await page.setContent(html, {
      waitUntil: 'domcontentloaded', // 只要 DOM 加载完就截图，不等待网络空闲
      timeout: 60000                 // 将超时增加到 60 秒以适配 Render 的慢速环境
    });

    // 截取图片
    const buffer = await page.screenshot({
      type: type === 'jpeg' ? 'jpeg' : 'png',
      fullPage: true
    });

    // --- 核心修改点：将二进制转为 Base64 JSON 返回 ---
    const base64Image = buffer.toString('base64');
    res.json({
      image_url: `data:image/png;base64,${base64Image}`,
      status: "success"
    });
    // ------------------------------------------------

  } catch (e) {
    console.error('Puppeteer Error:', e);
    res.status(500).json({ error: 'Conversion failed', message: e.message });
  } finally {
    if (page) {
      await page.close();
    }
  }
});

module.exports = router;