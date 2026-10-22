// HTML Template for FunMaza Voice Privacy Policy & Terms of Service
exports.getPrivacyPolicyHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - FunMaza Voice</title>
  <style>
    :root {
      --bg: #0F0F1A;
      --card: #181829;
      --primary: #6366F1;
      --accent: #FFFC00;
      --text: #F3F4F6;
      --text-muted: #9CA3AF;
      --border: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: var(--card);
      padding: 40px;
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 14px;
      color: var(--text-muted);
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      color: #A5B4FC;
      margin: 28px 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    p, li {
      font-size: 15px;
      color: #D1D5DB;
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 16px;
    }
    li {
      margin-bottom: 6px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818CF8;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .contact-box {
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 20px;
      margin-top: 32px;
    }
    a {
      color: #818CF8;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">FunMaza App &bull; com.funmaza.app</span>
      <h1 style="margin-top: 12px;">Privacy Policy</h1>
      <p class="meta">Effective Date: October 2026 &bull; Last Updated: October 22, 2026</p>
    </div>

    <p>Welcome to <strong>FunMaza Voice</strong> ("we", "our", or "us"). FunMaza Voice is a social voice chat, live audio room, and entertainment platform designed to connect people globally. We respect your privacy and are committed to protecting the personal information you share with us.</p>
    <p>This Privacy Policy explains how we collect, use, store, and safeguard your data when you use our mobile application (Package Name: <code>com.funmaza.app</code>) and related online services.</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly to us when creating an account, personalizing your profile, and participating in audio chat rooms:</p>
    <ul>
      <li><strong>Account Credentials:</strong> Name, chosen username, email address, phone number (if registering via OTP), and user avatar.</li>
      <li><strong>Third-Party Social Authentication:</strong>
        <ul>
          <li><strong>Snapchat Login Kit:</strong> If you choose to log in or link your account with Snapchat, we receive your Snapchat display name, public external ID, and Bitmoji avatar (if provided). We use this information solely to create/authenticate your user profile and display your Bitmoji. We do not access your private Snapchat friends or stories.</li>
          <li><strong>Google Sign-In:</strong> If you authenticate with Google, we receive your name, verified email address, and Google profile picture.</li>
          <li><strong>Facebook & Twitter OAuth:</strong> If you connect via Facebook or Twitter, we receive your public display name and profile picture.</li>
        </ul>
      </li>
      <li><strong>Real-Time Audio & In-App Communications:</strong> When you speak in voice chat rooms, your audio stream is transmitted live via WebRTC / Socket.io to participants in the room. We do not store or sell live audio conversations.</li>
      <li><strong>Virtual Economy & In-App Items:</strong> Records of your in-app wallet balance, virtual coins, gifts sent/received, badges, and VIP levels.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the collected information for the following legitimate purposes:</p>
    <ul>
      <li>To authenticate your identity and facilitate fast, secure sign-in across your devices.</li>
      <li>To host real-time voice rooms, games (such as Ludo), and virtual gift exchanges.</li>
      <li>To enforce community safety, prevent abusive behavior, and ban bad actors via our reporting system.</li>
      <li>To display your public profile (display name, avatar / Bitmoji, level, and gifts) to friends in voice rooms.</li>
      <li>To provide technical support and resolve app bugs.</li>
    </ul>

    <h2>3. Sharing of Information</h2>
    <p>We do not sell, rent, or monetize your personal data to third-party advertisers. We only share information with trusted service providers essential for app operation:</p>
    <ul>
      <li><strong>Cloud Infrastructure & Database:</strong> MongoDB Atlas and hosting servers for secure data storage with encryption.</li>
      <li><strong>Third-Party Identity Providers:</strong> Snap Inc. (Snap Kit), Google LLC (Firebase / Google Sign-In), and Meta Platforms for authentication verification.</li>
      <li><strong>Legal Requirements:</strong> If required by law, subpoena, or to protect the vital rights and physical safety of any person.</li>
    </ul>

    <h2>4. Data Retention and Account Deletion</h2>
    <p>We retain your profile data as long as your account remains active. You have the right at any time to request complete deletion of your account and associated personal data.</p>
    <p>To delete your account or wipe your linked third-party credentials (Snapchat, Google, Facebook), you can either:</p>
    <ul>
      <li>Go to in-app <strong>Settings &rarr; Account Binding</strong> and unlink any connected provider.</li>
      <li>Email our data protection team directly at <a href="mailto:shivamraie09@gmail.com">shivamraie09@gmail.com</a> with your Account ID. We will permanently delete your account and data within 7 business days.</li>
    </ul>

    <h2>5. Children's Privacy</h2>
    <p>FunMaza Voice is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a user under 13 has provided us with personal information, we immediately delete such accounts.</p>

    <h2>6. Security</h2>
    <p>We employ modern industry-standard security protocols, including HTTPS / SSL encryption for all network traffic, password hashing via bcrypt, and secure JWT authentication tokens to protect your information against unauthorized access.</p>

    <div class="contact-box">
      <h3 style="margin-bottom: 8px; color: #FFFFFF;">Contact Us</h3>
      <p style="margin-bottom: 4px;">If you have any questions, concerns, or privacy requests regarding this Privacy Policy, please contact our Developer & Support Team:</p>
      <p><strong>App Name:</strong> FunMaza Voice (com.funmaza.app)</p>
      <p><strong>Developer Email:</strong> <a href="mailto:shivamraie09@gmail.com">shivamraie09@gmail.com</a></p>
      <p><strong>Support URL:</strong> <a href="https://nodeapp2-yl8c.onrender.com/privacy">https://nodeapp2-yl8c.onrender.com/privacy</a></p>
    </div>
  </div>
</body>
</html>
`;
