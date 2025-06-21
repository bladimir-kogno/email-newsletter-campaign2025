// Vercel serverless function for sending emails via Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { recipients, subject, content, fromEmail, campaignId, isTest } = req.body;

        // Validation
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Recipients array is required and must not be empty'
            });
        }

        if (!subject || !content) {
            return res.status(400).json({
                success: false,
                error: 'Subject and content are required'
            });
        }

        if (!fromEmail || !fromEmail.includes('@lumail.co.uk')) {
            return res.status(400).json({
                success: false,
                error: 'Valid @lumail.co.uk from email is required'
            });
        }

        if (!process.env.RESEND_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Resend API key not configured'
            });
        }

        // Prepare email content with HTML formatting
        const htmlContent = formatEmailContent(content, fromEmail, isTest);
        
        let sentCount = 0;
        let failedCount = 0;
        const errors = [];

        // Send emails in batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            try {
                await Promise.all(batch.map(async (recipient) => {
                    try {
                        const result = await resend.emails.send({
                            from: `Lumail <${fromEmail}>`,
                            to: [recipient.email],
                            subject: isTest ? `[TEST] ${subject}` : subject,
                            html: htmlContent,
                            text: content, // Fallback plain text
                            headers: {
                                'X-Campaign-ID': campaignId || 'unknown',
                                'X-Entity-Ref-ID': `subscriber-${recipient.id || 'unknown'}`,
                            },
                            tags: [
                                {
                                    name: 'campaign',
                                    value: campaignId || 'unknown'
                                },
                                {
                                    name: 'type',
                                    value: isTest ? 'test' : 'campaign'
                                }
                            ]
                        });

                        if (result.id) {
                            sentCount++;
                        } else {
                            failedCount++;
                            errors.push(`Failed to send to ${recipient.email}: Unknown error`);
                        }
                    } catch (emailError) {
                        failedCount++;
                        errors.push(`Failed to send to ${recipient.email}: ${emailError.message}`);
                        console.error(`Email send error for ${recipient.email}:`, emailError);
                    }
                }));

                // Add delay between batches to respect rate limits
                if (i + batchSize < recipients.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (batchError) {
                console.error('Batch send error:', batchError);
                failedCount += batch.length;
                batch.forEach(recipient => {
                    errors.push(`Batch failed for ${recipient.email}: ${batchError.message}`);
                });
            }
        }

        // Log campaign results
        console.log(`Campaign ${campaignId} results: ${sentCount} sent, ${failedCount} failed`);
        if (errors.length > 0) {
            console.log('Send errors:', errors.slice(0, 5)); // Log first 5 errors
        }

        return res.status(200).json({
            success: sentCount > 0,
            sent: sentCount,
            failed: failedCount,
            total: recipients.length,
            errors: errors.slice(0, 10) // Return first 10 errors to client
        });

    } catch (error) {
        console.error('Send email API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

function formatEmailContent(content, fromEmail, isTest) {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/unsubscribe`;
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .email-container {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .email-header {
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .email-content {
                    margin-bottom: 30px;
                    white-space: pre-wrap;
                }
                .email-footer {
                    border-top: 1px solid #e9ecef;
                    padding-top: 20px;
                    font-size: 12px;
                    color: #6c757d;
                    text-align: center;
                }
                .unsubscribe-link {
                    color: #6c757d;
                    text-decoration: none;
                }
                .unsubscribe-link:hover {
                    text-decoration: underline;
                }
                ${isTest ? `
                .test-banner {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: bold;
                }
                ` : ''}
            </style>
        </head>
        <body>
            <div class="email-container">
                ${isTest ? '<div class="test-banner">🧪 This is a test email</div>' : ''}
                
                <div class="email-header">
                    <h2 style="margin: 0; color: #2c3e50;">Lumail Newsletter</h2>
                </div>
                
                <div class="email-content">
                    ${content.replace(/\n/g, '<br>')}
                </div>
                
                <div class="email-footer">
                    <p>
                        This email was sent from <strong>${fromEmail}</strong><br>
                        If you no longer wish to receive these emails, you can 
                        <a href="${unsubscribeUrl}" class="unsubscribe-link">unsubscribe here</a>.
                    </p>
                    <p>
                        Sent with ❤️ by Lumail Campaign Manager
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}
