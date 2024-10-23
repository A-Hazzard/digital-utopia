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
  const withdrawalData = await req.json();

  try {
    await sendClientWithdrawalNotification(withdrawalData);
    return NextResponse.json({
      message: "Withdrawal confirmation sent successfully",
    });
  } catch (error) {
    console.error("Error sending withdrawal confirmation:", error);
    return NextResponse.json(
      { error: "Failed to send withdrawal confirmation" },
      { status: 500 }
    );
  }
}

const sendClientWithdrawalNotification = async (withdrawalData: {
  userEmail: string;
  amount: string;
  date: string;
  withdrawalId: string; // Add withdrawalId
}) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  // Check if the file exists
  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: withdrawalData.userEmail,
    subject: "Withdrawal Confirmation",
    html: createWithdrawalConfirmationTemplate(withdrawalData),
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

// Update the template to include withdrawalId
const createWithdrawalConfirmationTemplate = (withdrawalData: {
  amount: string;
  date: string;
  withdrawalId: string; // Add withdrawalId
  userEmail: string; // Include userEmail for the template
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Confirmation</title>
        <style>
            body {
                font-family: 'Montserrat', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #393E46;
                color: #eeeeee;
                color: white;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #16171a;
                border-radius: 8px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            .header {
                text-align: center;
                margin-bottom: 1rem;
            }
            .header img {
                max-width: 150px;
                height: auto;
            }
            .content {
                padding: 20px;
                background-color: #141010;
                border-radius: 8px;
            }
            .footer {
                text-align: center;
                padding: 20px 0;
                font-size: 12px;
                color: #B5B5B5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo">
            </div>
            <div class="content">
                <h1>Withdrawal Confirmation</h1>
                <p>Your withdrawal has been confirmed.</p>
                <p><strong>Withdrawal ID:</strong> ${withdrawalData.withdrawalId}</p>
                <p><strong>Amount:</strong> ${withdrawalData.amount} USDT</p>
                <p><strong>Date:</strong> ${withdrawalData.date}</p>
                <p>Thank you for your transaction!</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
