import crypto from 'crypto';

// Secret key for HMAC - should be in environment variables
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'your-secret-key-here';

// Function to create secure unsubscribe token
export function createUnsubscribeToken(email, campaignId) {
  const timestamp = Date.now();
  const data = `${email}:${campaignId}:${timestamp}`;
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  // Combine data and signature
  const token = Buffer.from(`${data}:${signature}`).toString('base64url');
  return token;
}

// Function to verify unsubscribe token
function verifyUnsubscribeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid token format');
    }
    
    const [email, campaignId, timestamp, signature] = parts;
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      throw new Error('Token expired');
    }
    
    // Verify signature
    const data = `${email}:${campaignId}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', UNSUBSCRIBE_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    return { email, campaignId, timestamp };
  } catch (error) {
    throw new Error('Invalid or tampered token');
  }
}

export default async function handler(req, res) {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send('Invalid unsubscribe link');
  }
  
  try {
    // Verify and decode the token
    const { email, campaignId } = verifyUnsubscribeToken(token);
    
    // TODO: In a real app, update the subscriber status in your database here
    // For now, we'll just show a success message
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Successfully Unsubscribed</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 600px;
                  margin: 100px auto;
                  padding: 40px 20px;
                  text-align: center;
                  background-color: #f8f9fa;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .success-icon {
                  font-size: 64px;
                  color: #22c55e;
                  margin-bottom: 20px;
              }
              h1 {
                  color: #1f2937;
                  margin-bottom: 16px;
              }
              p {
                  color: #6b7280;
                  line-height: 1.6;
                  margin-bottom: 20px;
              }
              .email {
                  background-color: #f3f4f6;
                  padding: 8px 16px;
                  border-radius: 4px;
                  display: inline-block;
                  font-family: monospace;
                  margin: 10px 0;
              }
              .info {
                  font-size: 14px;
                  color: #9ca3af;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e7eb;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="success-icon">✓</div>
              <h1>Successfully Unsubscribed</h1>
              <p>The email address <span class="email">${email}</span> has been removed from our mailing list.</p>
              <p>You will no longer receive newsletters from us.</p>
              <p>If this was a mistake, you can always subscribe again through our website.</p>
              <div class="info">
                Campaign ID: ${campaignId}<br>
                Unsubscribed at: ${new Date().toLocaleString()}
              </div>
          </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribe Error</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 600px;
                  margin: 100px auto;
                  padding: 40px 20px;
                  text-align: center;
                  background-color: #f8f9fa;
              }
              .container {
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .error-icon {
                  font-size: 64px;
                  color: #ef4444;
                  margin-bottom: 20px;
              }
              h1 {
                  color: #1f2937;
                  margin-bottom: 16px;
              }
              p {
                  color: #6b7280;
                  line-height: 1.6;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="error-icon">⚠️</div>
              <h1>Unsubscribe Error</h1>
              <p>Invalid or expired unsubscribe link.</p>
              <p>If you're trying to unsubscribe, please contact us directly or use a more recent unsubscribe link from our emails.</p>
          </div>
      </body>
      </html>
    `);
  }
}
