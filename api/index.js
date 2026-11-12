import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { action, username, password, target, bugType, senderType, phone } = req.body;

  if (action === 'login') {
    if (username === 'JEPRI' && password === '147') {
      return res.status(200).json({ status: 'success', role: 'RESSELER', expired: '2077/8/0' });
    }
    return res.status(401).json({ status: 'error', message: 'Username/Password Salah!' });
  }

  if (action === 'sendBug') {
    const key = senderType === 'Pribadi' ? 'sender_pribadi' : 'sender_global';
    let count = await redis.get(key) || 0;
    
    if (count <= 0) return res.status(400).json({ status: 'error', message: 'Sender habis!' });
    
    await redis.decr(key);
    return res.status(200).json({ status: 'success', message: 'Bug terkirim!', newSender: count - 1 });
  }

  if (action === 'pairWa') {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await redis.set(`pair_${phone}`, code, { ex: 300 });
    
    const key = senderType === 'Pribadi' ? 'sender_pribadi' : 'sender_global';
    await redis.incr(key);
    
    return res.status(200).json({ status: 'success', code: code });
  }

  return res.status(400).json({ status: 'error', message: 'Aksi tidak valid!' });
}
