const http = require('http');

module.exports = (req, res) => {
  // CORS Headers cho Google Sheets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const vpsHost = '180.93.195.52';
  const vpsPort = 3000;
  const path = req.headers['x-matched-path'] || req.url || '/';

  // 1. Khi truy cập trang chủ /: Trả về trạng thái sạch sẽ 100%, giấu hoàn toàn IP VPS
  if (path === '/' || path === '') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: "online",
      service: "Cloud License & Tracking Gateway",
      secure: true,
      time: new Date().toISOString()
    }));
  }

  // 2. Chuyển tiếp các API (/api/license/verify, /api/shopee/check, /admin...) về VPS
  const headers = { ...req.headers };
  headers['host'] = `${vpsHost}:${vpsPort}`;

  const proxyReq = http.request({
    hostname: vpsHost,
    port: vpsPort,
    path: path,
    method: req.method,
    headers: headers
  }, (proxyRes) => {
    // Tự động tẩy sạch và che giấu mọi dấu vết IP nếu có trong nội dung trả về
    const chunks = [];
    proxyRes.on('data', chunk => chunks.push(chunk));
    proxyRes.on('end', () => {
      let body = Buffer.concat(chunks).toString('utf-8');
      body = body.split('180.93.195.52:3000').join('vps-tracking-bridge-api.vercel.app');
      body = body.split('180.93.195.52').join('vps-tracking-bridge-api.vercel.app');

      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Cannot connect to VPS Gateway', 
      details: err.message 
    }));
  });

  req.pipe(proxyReq);
};
