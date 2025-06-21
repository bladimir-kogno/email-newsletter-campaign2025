// api/unsubscribe.js
import crypto from 'crypto';

// Secret key for HMAC - set in your env
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'your-secret-key-here';

function verifyUnsubscribeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 4) throw new Error('Invalid token format');

    const [email, campaignId, timestamp, signature] = parts;
    if (Date.now() - parseInt(timestamp, 10) > 24 * 60 * 60 * 1000) {
      throw new Error('Token expired');
    }

    const hmac = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET);
    hmac.update(`${email}:${campaignId}:${timestamp}`);
    if (hmac.digest('hex') !== signature) {
      throw new Error('Invalid signature');
    }

    return { email, campaignId };
  } catch {
    throw new Error('Invalid or tampered token');
  }
}

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).send('Invalid unsubscribe link');
  }

  try {
    const { email, campaignId } = verifyUnsubscribeToken(token);

    // TODO: actually mark email unsubscribed in your database

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <title>Unsubscribed</title>
        <style>/* your styles here */</style>
      </head>
      <body>
        <h1>Successfully Unsubscribed</h1>
        <p><strong>${email}</strong> has been removed from Campaign ID ${campaignId}.</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width">
        <title>Error</title>
      </head>
      <body>
        <h1>Unsubscribe Error</h1>
        <p>Invalid or expired link.</p>
      </body>
      </html>
    `);
  }
}
