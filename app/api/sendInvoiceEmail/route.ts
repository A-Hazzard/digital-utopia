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
  const invoiceData = await req.json();

  try {
    await sendInvoiceNotification(invoiceData);
    return NextResponse.json({
      message: "Invoice notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending invoice notification:", error);
    return NextResponse.json(
      { error: "Failed to send invoice notification" },
      { status: 500 }
    );
  }
}

const sendInvoiceNotification = async (invoiceData: {
  userId: string;
  userEmail: string;
  transactionId: string;
  amount: string;
  receiptURL: string;
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
    subject: "New Invoice Submission",
    html: createInvoiceNotificationTemplate(
      invoiceData.userEmail,
      invoiceData.transactionId,
      invoiceData.amount,
      invoiceData.receiptURL
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

const createInvoiceNotificationTemplate = (
  userEmail: string,
  transactionId: string,
  amount: string,
  receiptURL: string
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Invoice Submission</title>
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
                <h1>New Invoice Submission</h1>
                <p>A user has submitted an invoice:</p>
                <p><strong>User Email:</strong> ${userEmail}</p>
                <p><strong>Invoice Number:</strong> ${
                  transactionId ? transactionId : "<em>No Invoice Number</em>"
                }</p>
                <p><strong>Amount:</strong> ${
                  amount ? amount + " USDT" : "<em>No Amount Provided</em>"
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