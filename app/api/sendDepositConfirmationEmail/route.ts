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
  const { userEmail, amount, status } = await req.json();

  try {
    await sendDepositNotification(userEmail, amount, status);
    return NextResponse.json({
      message: "Deposit confirmation notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending deposit confirmation notification:", error);
    return NextResponse.json(
      { error: "Failed to send deposit confirmation notification" },
      { status: 500 }
    );
  }
}

const sendDepositNotification = async (userEmail: string, amount: number, status: string) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userEmail,
    subject: `Deposit ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: createDepositNotificationTemplate(amount, status),
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

const createDepositNotificationTemplate = (amount: number, status: string) => {
  const supportMessage = status === 'failed' 
    ? `<p style="color: #eeeeee;">We're sorry to inform you that your deposit of <strong>${amount} USDT</strong> has <span style="font-weight: bold; color: #FF5252;">failed</span>. Please reach out to our support team for assistance.</p>`
    : `<p style="color: #eeeeee;">Your deposit of <strong>${amount} USDT</strong> has been <span style="font-weight: bold; color: #4CAF50;">confirmed</span>.</p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Status Update</title>
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="max-width: 150px; height: auto;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>Your Deposit Status Has Been Updated</h1>
                ${supportMessage}
                <p>Thank you for your transaction!</p>
            </div>
            <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #B5B5B5;">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
