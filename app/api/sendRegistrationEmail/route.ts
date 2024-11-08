import sgMail from '@sendgrid/mail';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendSignUpEmail = async (userData: { displayName: string; email: string }) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const userMailOptions = {
    from: {
      email: process.env.ADMIN_EMAIL!,
      name: 'Digital Utopia'
    },
    to: userData.email,
    subject: 'Welcome to Digital Utopia!',
    html: createEmailTemplate(userData.displayName),
    attachments: [
      {
        filename: 'logo.png',
        type: 'image/png',
        content_id: 'unique-logo-id',
        content: fs.readFileSync(logoPath).toString('base64'),
        disposition: 'inline'
      }
    ]
  };

  const adminMailOptions = {
    from: {
      email: process.env.ADMIN_EMAIL!,
      name: 'Digital Utopia'
    },
    to: process.env.ADMIN_SECONDARY_EMAIL!,
    subject: "New User Registration",
    html: createAdminNotificationTemplate(userData.displayName, userData.email),
    attachments: [
      {
        filename: 'logo.png',
        type: 'image/png',
        content_id: 'unique-logo-id',
        content: fs.readFileSync(logoPath).toString('base64'),
        disposition: 'inline'
      }
    ]
  };

  await sgMail.send(userMailOptions);
  await sgMail.send(adminMailOptions);
};

export async function POST(req: Request) {
  const { displayName, email } = await req.json();

  try {
    await sendSignUpEmail({ displayName, email });
    return NextResponse.json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}

const createEmailTemplate = (displayName: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Digital Utopia</title>
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; padding: 20px 0;">
                <img src="cid:unique-logo-id" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="width: 150px;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>Welcome to Digital Utopia!</h1>
                <p style="color: #eeeeee;">Hi ${displayName},</p>
                <p style="color: #eeeeee;">Thank you for registering with us. We are excited to have you on board!</p>
                <p style="color: #eeeeee;">To get started, please click the button below:</p>
                <a href="https://digital-utopia.vercel.app/" style="display: inline-block; padding: 10px 20px; background-color: #ff5722; color: #eeeeee; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">Get Started</a>
                <div style="height: 1px; background-color: #B5B5B5; margin: 20px 0;"></div>
                <p style="color: #eeeeee;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #B5B5B5;">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const createAdminNotificationTemplate = (displayName: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; padding: 20px 0;">
                <img src="cid:unique-logo-id" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="width: 150px;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>New User Registration</h1>
                <p>A new user has registered:</p>
                <p><strong>Name:</strong> ${displayName}</p>
                <p><strong>Email:</strong> ${email}</p>
            </div>
            <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #B5B5B5;">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
