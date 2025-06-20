// api/send-email.js
// This file should be placed in your GitHub repo at: /api/send-email.js

import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipients, subject, content, fromEmail, campaignId, isTest } = req.body;

    // Validate required fields
    if (!recipients || !subject || !content || !fromEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipients, subject, content, fromEmail' 
      });
    }

    // Ensure fromEmail uses your domain
    if (!fromEmail.includes('@lumail.co.uk')) {
      return res.status(400).json({ 
        error: 'From email must use @lumail.co.uk domain' 
      });
    }

    let sent = 0;
    let failed = 0;
    const failures = [];

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .content { 
            padding: 30px 20px; 
          }
          .footer { 
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #718096;
          }
          .unsubscribe {
            color: #718096;
            text-decoration: none;
            font-size: 12px;
          }
          .unsubscribe:hover {
            text-decoration: underline;
          }
          /* Make images responsive */
          img {
            max-width: 100%;
            height: auto;
          }
          /* Style buttons */
          a[style*="background-color"] {
            display: inline-block !important;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You received this email because you subscribed to our newsletter.</p>
            <p>
              <a href="https://your-app-url.vercel.app/unsubscribe?email={{email}}" class="unsubscribe">
                Unsubscribe from this list
              </a>
            </p>
            <p>© 2025 LUMail. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails to recipients
    for (const recipient of recipients) {
      try {
        const personalizedContent = htmlContent.replace('{{email}}', recipient.email);
        
        await resend.emails.send({
          from: fromEmail,
          to: recipient.email,
          subject: subject,
          html: personalizedContent,
          headers: {
            'X-Campaign-ID': campaignId || 'unknown',
            'X-Test-Email': isTest ? 'true' : 'false'
          }
        });
        
        sent++;
        console.log(`Email sent successfully to ${recipient.email}`);
      } catch (error) {
        failed++;
        failures.push({
          email: recipient.email,
          error: error.message
        });
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      sent,
      failed,
      failures: failures.length > 0 ? failures : undefined,
      message: isTest ? 'Test email sent successfully!' : `Campaign sent to ${sent} recipients`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send emails',
      details: error.message
    });
  }
}
