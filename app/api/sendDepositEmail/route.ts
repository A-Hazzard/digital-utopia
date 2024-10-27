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
  const depositData = await req.json();

  try {
    await sendDepositNotification(depositData);
    return NextResponse.json({
      message: "Deposit notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending deposit notification:", error);
    return NextResponse.json(
      { error: "Failed to send deposit notification" },
      { status: 500 }
    );
  }
}

const sendDepositNotification = async (depositData: {
  userId: string;
  userEmail: string;
  username: string;
  transactionId: string;
  receiptURL: string;
  amount: number;
}) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const adminMailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "New Deposit Request",
    html: createDepositNotificationTemplate(
      depositData.userEmail,
      depositData.username,
      depositData.transactionId,
      depositData.receiptURL,
      depositData.amount
    ),
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

const createDepositNotificationTemplate = (
  userEmail: string,
  username: string,
  transactionId: string,
  receiptURL: string,
  amount: number
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Deposit Request</title>
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="max-width: 150px; height: auto;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>New Deposit Request</h1>
                <p style="color: #eeeeee;">A user has submitted a deposit request:</p>
                <p style="color: #eeeeee;"><strong>Username:</strong> ${username}</p>
                <p style="color: #eeeeee;"><strong>User Email:</strong> ${userEmail}</p>
                <p style="color: #eeeeee;"><strong>Transaction ID:</strong> ${
                  transactionId ? transactionId : "<em>No Transaction ID</em>"
                }</p>
                <p style="color: #eeeeee;"><strong>Amount:</strong> ${amount} USDT</p>
                <p style="color: #eeeeee;"><strong>Receipt URL:</strong> ${
                  receiptURL
                    ? `<a href="${receiptURL}" style="color: #ff5722;">View Receipt</a>`
                    : "<em>No Receipt</em>"
                }</p>
            </div>
            <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #B5B5B5;">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
