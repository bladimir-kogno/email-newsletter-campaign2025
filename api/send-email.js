// api/send-email.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipients, subject, content, fromEmail, campaignId } = req.body;

  if (!recipients || !subject || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients provided' });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const results = [];
    const errors = [];

    // Helper function to create unsubscribe link
    const createUnsubscribeLink = (email, campaignId) => {
      // Create a secure token with email and campaign info
      const token = Buffer.from(`${email}:${campaignId}:${Date.now()}`).toString('base64');
      const baseUrl = req.headers.origin || 'https://your-app.vercel.app';
      return `${baseUrl}/api/unsubscribe?token=${token}`;
    };

    // Enhanced HTML template with professional styling and unsubscribe
    const createEmailHTML = (content, email, campaignId, subject) => {
      const unsubscribeUrl = createUnsubscribeLink(email, campaignId);
      
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f8f9fa;
                }
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
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
                .email-header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                .email-content {
                    padding: 30px 20px;
                }
                .email-content h1, .email-content h2, .email-content h3 {
                    color: #2d3748;
                    margin-top: 0;
                }
                .email-content h1 {
                    font-size: 28px;
                    margin-bottom: 20px;
                }
                .email-content h2 {
                    font-size: 24px;
                    margin-bottom: 16px;
                }
                .email-content h3 {
                    font-size: 20px;
                    margin-bottom: 12px;
                }
                .email-content p {
                    margin-bottom: 16px;
                }
                .email-content a {
                    color: #667eea;
                    text-decoration: none;
                }
                .email-content a:hover {
                    text-decoration: underline;
                }
                .email-content strong {
                    font-weight: 600;
                    color: #2d3748;
                }
                .email-content em {
                    font-style: italic;
                }
                .email-content ul, .email-content ol {
                    margin-bottom: 16px;
                    padding-left: 20px;
                }
                .email-content li {
                    margin-bottom: 8px;
                }
                .email-content blockquote {
                    border-left: 4px solid #667eea;
                    margin: 16px 0;
                    padding-left: 16px;
                    font-style: italic;
                    color: #4a5568;
                }
                .email-footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                    color: #718096;
                }
                .unsubscribe-section {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                }
                .unsubscribe-link {
                    color: #718096;
                    text-decoration: none;
                    font-size: 11px;
                }
                .unsubscribe-link:hover {
                    text-decoration: underline;
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
                    .email-header h1 {
                        font-size: 20px;
                    }
                    .email-content h1 {
                        font-size: 24px;
                    }
                    .email-content h2 {
                        font-size: 20px;
                    }
                    .email-content h3 {
                        font-size: 18px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>${subject}</h1>
                </div>
                
                <div class="email-content">
                    ${content}
                </div>
                
                <div class="email-footer">
                    <p>You're receiving this email because you subscribed to our newsletter.</p>
                    <p>If you have any questions, feel free to reply to this email.</p>
                    
                    <div class="unsubscribe-section">
                        <a href="${unsubscribeUrl}" class="unsubscribe-link">
                            Unsubscribe from this mailing list
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;
    };

    // Convert plain text to HTML if needed and enhance formatting
    const processContent = (content) => {
      // If content already contains HTML tags, return as-is
      if (/<[a-z][\s\S]*>/i.test(content)) {
        return content;
      }
      
      // Convert plain text to HTML with enhanced formatting
      let processedContent = content
        // Convert **bold** to <strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Convert *italic* to <em>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Convert line breaks to <br> but preserve paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      // Wrap in paragraph tags if not already wrapped
      if (!processedContent.startsWith('<p>')) {
        processedContent = '<p>' + processedContent + '</p>';
      }
      
      return processedContent;
    };

    // Create plain text version from HTML
    const createPlainText = (content) => {
      return content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/\n\n+/g, '\n\n') // Clean up multiple line breaks
        .trim();
    };

    // Send emails to all recipients
    for (const recipient of recipients) {
      try {
        const processedContent = processContent(content);
        const htmlContent = createEmailHTML(processedContent, recipient.email, campaignId, subject);
        const plainTextContent = createPlainText(processedContent);

        const { data, error } = await resend.emails.send({
          from: fromEmail || 'Newsletter <onboarding@resend.dev>',
          to: [recipient.email],
          subject: subject,
          html: htmlContent,
          text: plainTextContent,
          // Add important headers for deliverability and compliance
          headers: {
            'X-Campaign-ID': campaignId || 'unknown',
            'List-Unsubscribe': `<${createUnsubscribeLink(recipient.email, campaignId)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Mailer': 'Email Campaign Manager',
            'Precedence': 'bulk'
          },
          // Add tags for tracking (optional, depends on your Resend plan)
          tags: [
            {
              name: 'campaign',
              value: campaignId ? `campaign_${campaignId}` : 'unknown'
            },
            {
              name: 'type',
              value: 'newsletter'
            }
          ]
        });

        if (error) {
          console.error('Resend error for', recipient.email, ':', error);
          errors.push({ 
            email: recipient.email, 
            error: error.message || 'Unknown error' 
          });
        } else {
          console.log('Email sent successfully to', recipient.email, 'with ID:', data.id);
          results.push({ 
            email: recipient.email, 
            id: data.id 
          });
        }
      } catch (emailError) {
        console.error('Email sending error for', recipient.email, ':', emailError);
        errors.push({ 
          email: recipient.email, 
          error: emailError.message || 'Unexpected error' 
        });
      }

      // Add small delay to avoid rate limiting (100ms between emails)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log summary
    console.log(`Email sending completed: ${results.length} successful, ${errors.length} failed`);

    // Return comprehensive results
    res.status(200).json({
      success: true,
      sent: results.length,
      failed: errors.length,
      total: recipients.length,
      results,
      errors: errors.length > 0 ? errors : undefined, // Only include errors if there are any
      summary: {
        campaign_id: campaignId,
        from_email: fromEmail,
        subject: subject,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API error:', error);
    
    // Return detailed error information
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send emails',
      details: error.message,
      sent: 0,
      failed: recipients?.length || 0
    });
  }
}
