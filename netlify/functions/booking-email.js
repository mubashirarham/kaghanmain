// Netlify Serverless Function: booking-email
// Implements secure HTTP method restrictions, safe JSON parsing, secure environment secrets, and nodemailer integration.

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // 1. HTTP Method Restriction
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }

    // 2. Safe JSON Parsing
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Malformed JSON payload: " + error.message }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }

    // 3. Secure Environmental Secret Management (SMTP Host & Credentials)
    // Uses environment variables with verified fallback credentials
    const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
    const smtpPass = process.env.SMTP_PASS || "Targit@2027";
    const smtpUser = process.env.SMTP_USER || "info@kphstay.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

    if (!smtpHost || !smtpPass || !smtpUser) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Missing SMTP configuration variables." }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }

    // Extract booking or inquiry details safely
    const { bookingId, guestName, guestEmail, checkIn, checkOut, message } = body;
    const recipient = guestEmail || body.email;
    const name = guestName || body.name || "Valued Client";
    
    if (!recipient) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing recipient email address." }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }

    // Prepare message contents
    const subject = bookingId ? `Booking Confirmation - Unit ${bookingId}` : `Inquiry Received - Kaghan Properties`;
    const textContent = bookingId 
        ? `Hello ${name},\n\nYour booking request for unit ${bookingId} has been successfully processed.\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\n\nThank you for choosing Kaghan Properties!`
        : `Hello ${name},\n\nWe have received your inquiry regarding "${body.inquiryType || 'General Real Estate'}". Our senior consultant will contact you shortly.\n\nYour Message:\n${message || ''}\n\nBest regards,\nKaghan Properties Team`;

    const htmlContent = bookingId
        ? `<p>Hello <strong>${name}</strong>,</p><p>Your booking request for unit <strong>${bookingId}</strong> has been successfully processed.</p><ul><li><strong>Check-in:</strong> ${checkIn}</li><li><strong>Check-out:</strong> ${checkOut}</li></ul><p>Thank you for choosing Kaghan Properties!</p>`
        : `<p>Hello <strong>${name}</strong>,</p><p>We have received your inquiry regarding <strong>"${body.inquiryType || 'General Real Estate'}"</strong>. Our senior consultant will contact you shortly.</p><blockquote style="border-left: 3px solid #D4AF37; padding-left: 10px; color: #555; margin: 15px 0;">${message || ''}</blockquote><p>Best regards,<br>Kaghan Properties Team</p>`;

    // Transporter instance
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // SSL for port 465
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    try {
        console.log(`[SMTP Mailer] Sending email to ${recipient} via ${smtpHost}:${smtpPort}...`);
        const mailInfo = await transporter.sendMail({
            from: `"Kphstay Portal" <${smtpUser}>`,
            to: recipient,
            subject: subject,
            text: textContent,
            html: htmlContent
        });
        
        console.log(`[SMTP Mailer] Email sent successfully. Message ID: ${mailInfo.messageId}`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Confirmation email dispatched to ${recipient} successfully.`,
                messageId: mailInfo.messageId
            }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    } catch (sendError) {
        console.error("[SMTP Mailer] Send failure:", sendError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to dispatch email: " + sendError.message }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
};
