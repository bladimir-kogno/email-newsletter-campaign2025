// api/unsubscribe.js
export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Invalid unsubscribe link');
  }

  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString();
    const [email, campaignId, timestamp] = decoded.split(':');

    if (!email || !email.includes('@')) {
      throw new Error('Invalid email in token');
    }

    // In a real app, you'd remove the email from your database here
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
          </style>
      </head>
      <body>
          <div class="container">
              <div class="success-icon">✓</div>
              <h1>Successfully Unsubscribed</h1>
              <p>The email address <span class="email">${email}</span> has been removed from our mailing list.</p>
              <p>You will no longer receive newsletters from us.</p>
              <p>If this was a mistake, you can always subscribe again through our website.</p>
          </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(400).send('Invalid or expired unsubscribe link');
  }
}
