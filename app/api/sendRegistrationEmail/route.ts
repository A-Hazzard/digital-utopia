import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});


const sendSignUpEmail = async (userData: { displayName: string; email: string }) => {
  console.log("Sending email to user and admin", userData);

  // Email to the new user
  const userMailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userData.email,
    subject: 'Welcome to Digital Utopia!',
    html: createEmailTemplate(userData.displayName),
    attachments: [
      {
        filename: 'logo.svg',
        path: 'public/logo.png',
        cid: 'logo',
      },
    ],
  };

  // Email to the admin
  const adminMailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL, // Admin email from environment variables
    subject: "New User Registration",
    html: createAdminNotificationTemplate(userData.displayName, userData.email),
    attachments: [
      {
        filename: "logo.svg",
        path: "public/logo.png",
        cid: "logo",
      },
    ],
  };

  // Send both emails
  await transporter.sendMail(userMailOptions);
  await transporter.sendMail(adminMailOptions);
};

export async function POST(req: Request) {
  const { displayName, email } = await req.json();

  try {
    await sendSignUpEmail({ displayName, email });
    console.log("Emails sent successfully");
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
        <style>
            body {
                font-family: 'Montserrat', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #393E46; /* --background */
                color: #eeeeee; /* --light */
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #16171a; /* --dark */
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            .header {
                text-align: center;
                padding: 20px 0;
            }
            .header img {
                width: 150px;
            }
            .content {
                padding: 20px;
                background-color: #141010; /* --darker */
                border-radius: 8px;
            }
            .footer {
                text-align: center;
                padding: 20px 0;
                font-size: 12px;
                color: #B5B5B5; /* --gray */
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #ff5722; /* --orange */
                color: #ffffff; /* --light */
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin-top: 20px;
                transition: background-color 0.3s;
            }
            .button:hover {
                background-color: #e64a19; /* Darker orange for hover effect */
            }
            .divider {
                height: 1px;
                background-color: #B5B5B5; /* --gray */
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo">
            </div>
            <div class="content">
                <h1>Welcome to Digital Utopia!</h1>
                <p>Hi ${displayName},</p>
                <p>Thank you for registering with us. We are excited to have you on board!</p>
                <p>To get started, please click the button below:</p>
                <a href="https://digital-utopia.vercel.app/dashboard" class="button">Get Started</a>
                <div class="divider"></div>
                <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
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
        <style>
            body {
                font-family: 'Montserrat', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #393E46; /* --background */
                color: #eeeeee; /* --light */
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #16171a; /* --dark */
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            .content {
                padding: 20px;
                background-color: #141010; /* --darker */
                border-radius: 8px;
            }
            .footer {
                text-align: center;
                padding: 20px 0;
                font-size: 12px;
                color: #B5B5B5; /* --gray */
            }
        </style>
    </head>
    <body>
        <div class="container">
        <div class="header">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo">
            </div>
            <div class="content">
                <h1>New User Registration</h1>
                <p>A new user has registered:</p>
                <p><strong>Name:</strong> ${displayName}</p>
                <p><strong>Email:</strong> ${email}</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
