// api/ck-dash.js — proxy Vercel → Apps Script (Central Kitchen)
// Fungsinya sama seperti api/soyasuka-dash.js: menghindari masalah CORS
// dan meneruskan payload besar (foto base64) lewat POST.
//
// URL deployment Apps Script CK (update kalau kamu buat versi deployment baru).
// (Deploy → New deployment → Web app → Anyone → salin URL /exec).

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyz4gIZBH327C4yIMa373qt2sGLMVoIF9GzU9iivf-L2wWbeApktvuth92XXYpmBgu8bg/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let upstream;

    if (req.method === 'POST') {
      // Body sudah berupa x-www-form-urlencoded dari frontend
      let body = req.body;
      if (typeof body === 'object' && body !== null) {
        body = new URLSearchParams(body).toString();
      }
      upstream = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body || '',
        redirect: 'follow'
      });
    } else {
      const qs = new URLSearchParams(req.query).toString();
      upstream = await fetch(GAS_URL + '?' + qs, { redirect: 'follow' });
    }

    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.ok ? 200 : upstream.status).send(text);
  } catch (err) {
    return res.status(502).json({ ok: false, error: 'Proxy error: ' + err.message });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }   // foto absensi/wastage base64
  }
};
