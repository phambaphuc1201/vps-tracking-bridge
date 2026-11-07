// ==========================================================================================
// 🛡️ CẦU NỐI TRUNG GIAN GITHUB + VERCEL EDGE PROXY
// Ẩn 100% IP VPS (180.93.195.52) - Cung cấp tên miền HTTPS miễn phí trọn đời cho Google Sheets
// ==========================================================================================

export const config = {
  runtime: 'edge', // Tốc độ phản hồi dưới 50ms trên toàn cầu
};

export default async function handler(request) {
  // Xử lý CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-License-Key, X-Sheet-Id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);

  // IP VPS của bạn (được bảo vệ tuyệt mật phía máy chủ Vercel)
  const VPS_TARGET = process.env.VPS_TARGET || "http://180.93.195.52:3000";
  const targetUrl = new URL(url.pathname + url.search, VPS_TARGET).toString();

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('host', new URL(VPS_TARGET).host);
  forwardHeaders.set('x-forwarded-host', url.host);

  try {
    const vpsResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
      redirect: 'follow',
    });

    const respHeaders = new Headers(vpsResponse.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-License-Key, X-Sheet-Id');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    return new Response(vpsResponse.body, {
      status: vpsResponse.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      message: "Loi ket noi VPS Gateway: " + err.message
    }), {
      status: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}
