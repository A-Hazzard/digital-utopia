import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from 'path';
import fs from 'fs';

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  const withdrawData = await req.json();

  try {
    await sendWithdrawNotification(withdrawData);
    return NextResponse.json({
      message: "Withdrawal notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending withdrawal notification:", error);
    return NextResponse.json(
      { error: "Failed to send withdrawal notification" },
      { status: 500 }
    );
  }
}

const sendWithdrawNotification = async (withdrawData: {
  userId: string;
  userEmail: string;
  amount: string;
  address: string;
}) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  // Check if the file exists
  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const adminMailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "New Withdrawal Request",
    html: createWithdrawNotificationTemplate(withdrawData),
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  await transporter.sendMail(adminMailOptions);
};

const createWithdrawNotificationTemplate = (withdrawData: {
  userEmail: string;
  amount: string;
  address: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Withdrawal Request</title>
        <style>
            body {
                font-family: 'Montserrat', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #393E46; /* --background */
                color: #ffffff; /* Change text color to white */
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
            .header {
                text-align: center;
                margin-bottom: 1rem;
            }
            .header img {
                max-width: 150px;
                height: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo">
            </div>
            <div class="content">
                <h1>New Withdrawal Request</h1>
                <p>A user has requested a withdrawal:</p>
                <p><strong>User Email:</strong> ${withdrawData.userEmail}</p>
                <p><strong>Amount:</strong> ${withdrawData.amount} USDT</p>
                <p><strong>Withdrawal Address:</strong> ${withdrawData.address}</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
