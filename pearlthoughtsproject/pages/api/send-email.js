// pages/api/send-email.js
import nodemailer from 'nodemailer';

// Primary email service configuration
const primaryTransporter = nodemailer.createTransport({
  host: 'smtp.primary-service.com',
  port: 587,
  secure: false,
  auth: {
    user: 'primary@example.com',
    pass: 'primary-password',
  },
});

// Backup email service configuration
const backupTransporter = nodemailer.createTransport({
  host: 'smtp.backup-service.com',
  port: 587,
  secure: false,
  auth: {
    user: 'backup@example.com',
    pass: 'backup-password',
  },
});

let retryCount = 0;

const sendEmail = async (transporter, mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    retryCount = 0; // Reset retry count on success
  } catch (error) {
    console.error('Error sending email:', error.message);
    retryCount++;
    if (retryCount >= 3) {
      console.log('Switching to backup transporter');
      retryCount = 0;
      await sendEmail(backupTransporter, mailOptions);
    } else {
      console.log('Retrying with primary transporter');
      await sendEmail(transporter, mailOptions);
    }
  }
};

export default async (req, res) => {
  if (req.method === 'POST') {
    const { to, subject, text } = req.body;

    const mailOptions = {
      from: '"Notification Service" <no-reply@example.com>',
      to,
      subject,
      text,
    };

    try {
      await sendEmail(primaryTransporter, mailOptions);
      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      res.status(500).json({ message: `Failed to send email: ${error.message}` });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
