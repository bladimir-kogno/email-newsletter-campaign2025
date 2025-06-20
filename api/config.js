// api/config.js
export default async function handler(req, res) {
  res.status(200).json({
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  });
}
