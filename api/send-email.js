// api/send-email.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipients, subject, content } = req.body;

  if (!recipients || !subject || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Newsletter <onboarding@resend.dev>', // Use Resend's test domain for now
          to: [recipient.email],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>${subject}</h2>
              <div style="line-height: 1.6;">
                ${content.replace(/\n/g, '<br>')}
              </div>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                You're receiving this because you subscribed to our newsletter.
              </p>
            </div>
          `,
        });

        if (error) {
          errors.push({ email: recipient.email, error: error.message });
        } else {
          results.push({ email: recipient.email, id: data.id });
        }
      } catch (emailError) {
        errors.push({ email: recipient.email, error: emailError.message });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.status(200).json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send emails',
      details: error.message 
    });
  }
}
