import sgMail from '@sendgrid/mail';
import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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

  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo file not found');
  }

  const adminMailOptions = {
    from: {
      email: process.env.ADMIN_EMAIL!,
      name: 'Digital Utopia'
    },
    to: process.env.ADMIN_SECONDARY_EMAIL!,
    subject: "New Invoice Submission",
    html: createInvoiceNotificationTemplate(
      invoiceData.userEmail,
      invoiceData.transactionId,
      invoiceData.amount,
      invoiceData.receiptURL
    ),
    attachments: [
      {
        content: fs.readFileSync(logoPath).toString('base64'),
        filename: 'logo.png',
        type: 'image/png',
        disposition: 'inline',
        content_id: 'logo'
      }
    ]
  };

  await sgMail.send(adminMailOptions);
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
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="max-width: 150px; height: auto;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>New Invoice Submission</h1>
                <p style="color: #eeeeee;">A user has submitted an invoice:</p>
                <p style="color: #eeeeee;"><strong>User Email:</strong> ${userEmail}</p>
                <p style="color: #eeeeee;"><strong>Invoice Number:</strong> ${
                  transactionId ? transactionId : "<em>No Invoice Number</em>"
                }</p>
                <p style="color: #eeeeee;"><strong>Amount:</strong> ${
                  amount ? amount + " USDT" : "<em>No Amount Provided</em>"
                }</p>
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
