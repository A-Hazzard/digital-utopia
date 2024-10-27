import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

export async function POST(req: Request) {
  const cancellationData = await req.json();

  try {
    await sendCancellationNotification(cancellationData);
    return NextResponse.json({
      message: "Cancellation notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending cancellation notification:", error);
    return NextResponse.json(
      { error: "Failed to send cancellation notification" },
      { status: 500 }
    );
  }
}

const sendCancellationNotification = async (cancellationData: {
  userEmail: string;
  withdrawalId: string;
  username: string;
}) => {
  const logoPath = path.join(process.cwd(), "public", "logo.png");

  if (!fs.existsSync(logoPath)) {
    console.error(`Logo file not found at path: ${logoPath}`);
    throw new Error("Logo file not found");
  }

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: "Withdrawal Request Cancelled",
    html: createCancellationTemplate(cancellationData),
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

const createCancellationTemplate = (cancellationData: {
  userEmail: string;
  withdrawalId: string;
  username: string;
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Cancelled</title>
    </head>
    <body style="font-family: 'Montserrat', sans-serif; margin: 0; padding: 0; background-color: #393E46; color: #eeeeee;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #16171a; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);">
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="cid:logo" alt="Digital Utopia Logo" aria-label="Digital Utopia Logo" style="max-width: 150px; height: auto;">
            </div>
            <div style="padding: 20px; background-color: #141010; border-radius: 8px;">
                <h1>Withdrawal Request Cancelled</h1>
                <p style="color: #eeeeee;">The user has cancelled their withdrawal request.</p>
                <p style="color: #eeeeee;"><strong>User Email:</strong> ${cancellationData.userEmail}</p>
                <p style="color: #eeeeee;"><strong>Withdrawal ID:</strong> ${cancellationData.withdrawalId}</p>
                <p style="color: #eeeeee;"><strong>Username:</strong> ${cancellationData.username}</p>
            </div>
            <div style="text-align: center; padding: 20px 0; font-size: 12px; color: #B5B5B5;">
                <p>&copy; 2024 Digital Utopia. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
