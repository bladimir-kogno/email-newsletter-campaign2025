// api/send-email.js
// Vercel serverless function for sending emails via Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('Email API called with body:', req.body);

    const { recipients, subject, content, fromEmail, campaignId, isTest } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipients array is required and must not be empty' 
      });
    }

    if (!subject || !content || !fromEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject, content, and fromEmail are required' 
      });
    }

    // Ensure fromEmail uses lumail.co.uk domain
    if (!fromEmail.includes('@lumail.co.uk')) {
      return res.status(400).json({ 
        success: false, 
        error: 'From email must use @lumail.co.uk domain' 
      });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Resend API key not configured. Add RESEND_API_KEY to environment variables.' 
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
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .email-content { 
            padding: 30px 20px; 
          }
          .email-footer { 
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #718096;
          }
          .unsubscribe-link {
            color: #718096;
            text-decoration: none;
            font-size: 12px;
          }
          .unsubscribe-link:hover {
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
          /* Mobile responsiveness */
          @media only screen and (max-width: 600px) {
            .email-container {
              margin: 0;
              border-radius: 0;
            }
            .email-header, .email-content {
              padding: 20px 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Lumail Newsletter</p>
          </div>
          <div class="email-content">
            ${content}
          </div>
          <div class="email-footer">
            <p style="margin: 0 0 10px 0;">You received this email because you subscribed to our newsletter.</p>
            <p style="margin: 0;">
              <a href="mailto:${fromEmail}?subject=Unsubscribe%20Request" class="unsubscribe-link">
                Unsubscribe from this list
              </a>
            </p>
            <p style="margin: 10px 0 0 0;">© 2025 Lumail. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`Sending to ${recipients.length} recipients...`);

    // Send emails to all recipients
    for (const recipient of recipients) {
      try {
        console.log(`Sending to: ${recipient.email}`);
        
        const emailData = {
          from: fromEmail,
          to: recipient.email,
          subject: subject,
          html: htmlContent,
          headers: {
            'X-Campaign-ID': campaignId || 'unknown',
            'X-Test-Email': isTest ? 'true' : 'false'
          }
        };

        // Add reply-to for better deliverability
        if (fromEmail !== 'noreply@lumail.co.uk') {
          emailData.reply_to = fromEmail;
        }

        const result = await resend.emails.send(emailData);
        
        console.log(`Email sent successfully to ${recipient.email}, ID: ${result.id}`);
        sent++;
        
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failed++;
        failures.push({
          email: recipient.email,
          error: error.message || 'Unknown error'
        });
      }
    }

    // Return success response
    const response = {
      success: true,
      sent,
      failed,
      message: isTest 
        ? `Test email sent successfully to ${sent} recipient(s)!` 
        : `Campaign sent successfully to ${sent} out of ${recipients.length} recipients`,
      campaignId: campaignId
    };

    // Include failure details if any
    if (failures.length > 0) {
      response.failures = failures;
      response.message += ` (${failed} failed)`;
    }

    console.log('Email sending completed:', response);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('API Error:', error);
    
    // Return detailed error information
    return res.status(500).json({
      success: false,
      error: 'Failed to send emails',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}
