const http = require('http');

module.exports = (req, res) => {
  // CORS cho Google Sheets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const vpsHost = '180.93.195.52';
  const vpsPort = 3000;
  const path = req.url || '/';

  const proxyReq = http.request({
    hostname: vpsHost,
    port: vpsPort,
    path: path,
    method: req.method,
    headers: { ...req.headers, host: `${vpsHost}:${vpsPort}` }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Cannot connect to VPS', details: err.message }));
  });

  req.pipe(proxyReq);
};
