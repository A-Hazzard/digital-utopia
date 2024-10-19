import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
  transactionId: string;
  receiptURL: string;
}) => {
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: "New Deposit Request",
    html: createDepositNotificationTemplate(depositData.userEmail, depositData.transactionId, depositData.receiptURL),
    attachments: [
      {
        filename: "logo.svg",
        path: "public/logo.png",
        cid: "logo",
      },
    ],
  };

  await transporter.sendMail(adminMailOptions);
};

const createDepositNotificationTemplate = (userEmail: string, transactionId: string, receiptURL: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Deposit Request</title>
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
                margin-bottom: 1rem;

            }
            .header img {
                max-width: 150px;
                height: auto;
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
                <h1>New Deposit Request</h1>
                <p>A user has submitted a deposit request:</p>
                <p><strong>User Email:</strong> ${userEmail}</p>
                <p><strong>Transaction ID:</strong> ${
                  transactionId ? transactionId : "<em>No Transaction ID</em>"
                }</p>
                <p><strong>Receipt URL:</strong> ${
                  receiptURL
                    ? `<a href="${receiptURL}">View Receipt</a>`
                    : "<em>No Receipt</em>"
                }</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
