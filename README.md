# Lumail Campaign Manager

A professional email campaign manager for @lumail.co.uk domains, built with modern web technologies and best practices.

## Features

- 🔐 **Secure Authentication** with Clerk
- 📧 **Professional Email Campaigns** via Resend API
- 👥 **Subscriber Management** with local storage
- 📊 **Campaign Analytics** and tracking
- 📱 **Mobile Responsive** design
- 🎨 **Modern UI** with Tailwind CSS
- ⚡ **Fast Performance** with vanilla JavaScript

## Project Structure

```
lumail-campaign-manager/
├── index.html              # Main entry point
├── css/
│   └── styles.css          # Custom styles and responsive design
├── js/
│   ├── auth.js            # Authentication management with Clerk
│   ├── storage.js         # Data storage and management
│   ├── components.js      # UI components and rendering
│   └── app.js             # Main application logic
├── api/
│   └── send-email.js      # Serverless email sending endpoint
├── package.json           # Dependencies and scripts
├── vercel.json           # Deployment configuration
└── README.md             # This file
```

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lumail-campaign-manager
npm install
```

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Resend API (for sending emails)
RESEND_API_KEY=your_resend_api_key_here

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# App URL (for unsubscribe links)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Set up Resend

1. Sign up at [Resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add and verify your @lumail.co.uk domain
4. Set up SPF and DKIM records as instructed by Resend

**Required DNS Records:**
```
# SPF Record
TXT: "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (provided by Resend)
CNAME: resend._domainkey.lumail.co.uk → [resend-provided-value]
```

### 4. Set up Clerk Authentication

1. Sign up at [Clerk.com](https://clerk.com)
2. Create a new application
3. Get your publishable and secret keys
4. Configure sign-in/sign-up methods as needed

### 5. Update Clerk Integration

In `index.html`, replace `your_clerk_publishable_key_here` with your actual Clerk publishable key:

```html
<script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="pk_test_your_actual_key_here"
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    onload="window.Clerk?.load()"
></script>
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use CLI:
vercel env add RESEND_API_KEY
vercel env add CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

## Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

## Usage

### Authentication
- Users can sign up/sign in with email and password
- Demo mode available for testing without authentication
- Secure session management with Clerk

### Managing Subscribers
1. Navigate to "Subscribers" section
2. Add subscribers manually with email and optional name
3. View subscriber status and management options

### Creating Campaigns
1. Click "Create New Campaign"
2. **Step 1:** Enter campaign title, subject, and content
3. **Step 2:** Select recipients from subscriber list
4. **Step 3:** Review and send (with test email option)

### Settings
- Configure "From" email address (must use @lumail.co.uk)
- Set company name and other preferences

## API Endpoints

### POST /api/send-email
Sends email campaigns via Resend API.

**Request Body:**
```json
{
  "recipients": [
    {"email": "user@example.com", "name": "User Name"}
  ],
  "subject": "Email Subject",
  "content": "Email content...",
  "fromEmail": "newsletter@lumail.co.uk",
  "campaignId": "12345",
  "isTest": false
}
```

**Response:**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total
