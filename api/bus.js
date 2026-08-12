export default async function handler(req, res) {
  // 設定 CORS 與 Cache
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=5');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  // 安全白名單限制
  const allowedHosts = ['data.etabus.gov.hk', 'data.etagmb.gov.hk'];
  try {
    const target = new URL(url);
    if (!allowedHosts.includes(target.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }

    // 設定 4 秒連線 Timeout 斷路器
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Fetch failed' });
  }
}
