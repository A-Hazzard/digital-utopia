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
    await sendClientInvoiceOverdue(invoiceData);
    return NextResponse.json({
      message: "Invoice overdue notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending invoice overdue notification:", error);
    return NextResponse.json(
      { error: "Failed to send invoice overdue notification" },
      { status: 500 }
    );
  }
}

const sendClientInvoiceOverdue = async (invoiceData: {
  userEmail: string;
  invoiceNumber: string;
  amount: string;
}) => {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');

  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error('Logo file not found');
  }

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: invoiceData.userEmail,
    subject: "Invoice Payment Overdue",
    html: createClientInvoiceOverdueTemplate(invoiceData),
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

const createClientInvoiceOverdueTemplate = (invoiceData: {
  invoiceNumber: string;
  amount: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice Payment Overdue</title>
        <style>
            body {
                font-family: 'Montserrat', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #393E46;
                color: #eeeeee;
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
            .status {
                font-weight: bold;
                color: #FF9800;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo">
            </div>
            <div class="content">
                <h1>Invoice Payment Overdue</h1>
                <p>Your invoice is now <span class="status">OVERDUE</span>.</p>
                <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
                <p><strong>Amount:</strong> ${invoiceData.amount} USDT</p>
                <p>Please make the payment as soon as possible to avoid any service interruptions. If you have already made the payment, please disregard this message.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
