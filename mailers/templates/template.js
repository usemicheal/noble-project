export const verifyEmailTemplate = (url, brandColor = "#2563EB") => ({
  subject: "Confirm your QFS Ledger Vault account",
  text: `Please verify your email address by clicking the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-weight:bold; font-size: 24px; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .header img { max-width: 40px; margin-bottom: 10px; }
      .content { padding: 20px; text-align: center; }
      .content h1 { font-size: 24px; color: #333333; }
      .content p { font-size: 16px; color: #666666; margin: 10px 0 20px; }
      .button { display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold;  background-color: ${brandColor}; color: #fff!important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
    </style></head><body>
      <div class="container">
        <div class="header">QFS Ledger Vault</div>
        <div class="content">
          <h1>Confirm Your Email Address</h1>
          <p>Thank you for signing up! Please confirm your account by clicking the button below.</p>
          <a href="${url}" class="button">Confirm account</a>
          <p>Ensure you connect your wallet.</p>
          <p>If you did not create this account, please disregard this email.</p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        </div>
      </div>
    </body></html>
  `,
});

export const passwordResetTemplate = (url, brandColor = "#2563EB") => ({
  subject: "Reset Your Password",
  text: `To reset your password, please click the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-size: 24px;  font-weight:bold; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .header img { max-width: 40px; margin-bottom: 10px; }
      .content { padding: 20px; text-align: center; }
      .content h1 { font-size: 24px; color: #333333; }
      .content p { font-size: 16px; color: #666666; margin: 10px 0 20px; }
      .button { display: inline-block; padding: 15px 25px; font-size: 16px; font-weight: bold; background-color: ${brandColor};  color: #fff !important; border-radius: 5px; text-decoration: none; margin-top: 20px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; }
    </style></head><body>
      <div class="container">
        <div class="header">Airtime Ace</div>
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to proceed with resetting your password.</p>
          <a href="${url}" class="button">Reset Password</a>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to reply to this email or contact our support team.</p>
        </div>
      </div>
    </body></html>
  `,
});

export const supportEmailTemplate = (
  fullName,
  email,
  category,
  message,
  brandColor = "#2563EB",
) => ({
  subject: `Support Request: ${category} - ${fullName}`,
  text: `
Support Request from ${fullName}

Email: ${email}
Category: ${category}
Message: ${message}

Please respond to the customer at: ${email}
  `,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-weight:bold; font-size: 24px; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .content { padding: 20px; }
      .content h1 { font-size: 24px; color: #333333; margin-bottom: 20px; }
      .field { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid ${brandColor}; border-radius: 4px; }
      .field-label { font-weight: bold; color: ${brandColor}; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
      .field-value { font-size: 16px; color: #333333; word-wrap: break-word; }
      .message-field { background-color: #ffffff; border: 2px solid #e5e5e5; padding: 20px; border-radius: 6px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; margin-top: 20px; }
      .priority { background-color: #fff3cd; border-left-color: #ffc107; }
    </style></head><body>
      <div class="container">
        <div class="header">🎧 Airtime Ace Support</div>
        <div class="content">
          <h1>New Support Request</h1>
          
          <div class="field">
            <div class="field-label">Customer Name</div>
            <div class="field-value">${fullName}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Email Address</div>
            <div class="field-value"><a href="mailto:${email}" style="color: ${brandColor}; text-decoration: none;">${email}</a></div>
          </div>
          
          <div class="field ${
            category === "technical" || category === "payment" ? "priority" : ""
          }">
            <div class="field-label">Issue Category</div>
            <div class="field-value">${getCategoryDisplayName(category)}</div>
          </div>
          
          <div class="field message-field">
            <div class="field-label">Customer Message</div>
            <div class="field-value">${message.replace(/\n/g, "<br>")}</div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Action Required:</strong> Please respond to the customer at <a href="mailto:${email}" style="color: ${brandColor};">${email}</a></p>
          <p>This message was sent from the Airtime Ace support form.</p>
        </div>
      </div>
    </body></html>
  `,
});

// Helper function to convert category values to display names
function getCategoryDisplayName(category) {
  const categoryMap = {
    payment: "💳 Payment Issue",
    account: "👤 Account Problem",
    technical: "🐛 Technical Bug",
    feedback: "💬 Feedback",
  };
  return categoryMap[category] || category;
}

export const partnerEmailTemplate = (
  email,

  brandColor = "#0e9c34",
) => ({
  subject: `Partnership Request: ${email}}`,
  text: `
Partnership Request from ${email}

Email: ${email}


Please respond to the potential partner at: ${email}
  `,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-weight:bold; font-size: 24px; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .content { padding: 20px; }
      .content h1 { font-size: 24px; color: #333333; margin-bottom: 20px; }
      .field { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid ${brandColor}; border-radius: 4px; }
      .field-label { font-weight: bold; color: ${brandColor}; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; }
      .field-value { font-size: 16px; color: #333333; word-wrap: break-word; }
      .message-field { background-color: #ffffff; border: 2px solid #e5e5e5; padding: 20px; border-radius: 6px; }
      .footer { font-size: 14px; color: #999999; text-align: center; padding: 20px; border-top: 1px solid #e5e5e5; margin-top: 20px; }
      .priority { background-color: #fff3cd; border-left-color: #ffc107; }
    </style></head><body>
      <div class="container">
        <div class="header">Airtime Ace Partnership</div>
        <div class="content">
          <h1>New Partnership Request</h1>
          
          <div class="field">
            <div class="field-label">Customer Email</div>
            <div class="field-value">${email}</div>
          </div>
          
          <div class="field">
            <div class="field-label">Email Address</div>
            <div class="field-value"><a href="mailto:${email}" style="color: ${brandColor}; text-decoration: none;">${email}</a></div>
          </div>
          
       
        
        <div class="footer">
          <p><strong>Action Required:</strong> Please respond to the potential partner at <a href="mailto:${email}" style="color: ${brandColor};">${email}</a></p>
          <p>This message was sent from the Airtime Ace Partner Page.</p>
        </div>
      </div>
    </body></html>
  `,
});

export const appointmentApprovalTemplate = (senderName, brandColor = "#2563EB") => ({
  subject: "Your MedBed Quantum Appointment Has Been Approved",
  text: `
Dear ${senderName},

Great news! Your MedBed Quantum appointment booking has been approved.

A member of our team will be reaching out to you shortly with the next steps and the necessary forms to complete your appointment.

Please ensure your contact details are up to date so we can follow up with you promptly.

If you have any questions in the meantime, feel free to contact our support team.

Thank you for choosing MedBed Quantum.

Warm regards,
The QFS Ledger Vault Team
  `,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); }
      .header { background-color: ${brandColor}; font-weight: bold; font-size: 24px; color: #ffffff; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
      .content { padding: 30px 20px; text-align: center; }
      .content h1 { font-size: 24px; color: #333333; margin-bottom: 10px; }
      .content p { font-size: 16px; color: #666666; margin: 10px 0; line-height: 1.6; }
      .badge { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 16px 0; }
      .info-box { background-color: #f0f9ff; border-left: 4px solid ${brandColor}; padding: 16px 20px; border-radius: 4px; text-align: left; margin: 20px 0; }
      .info-box p { margin: 0; font-size: 15px; color: #1e40af; }
      .footer { font-size: 13px; color: #999999; text-align: center; padding: 20px; border-top: 1px solid #eeeeee; margin-top: 10px; }
    </style></head><body>
      <div class="container">
        <div class="header">QFS Ledger Vault — MedBed Quantum</div>
        <div class="content">
          <h1>Appointment Approved! 🎉</h1>
          <div class="badge">✓ Confirmed</div>
          <p>Dear <strong>${senderName}</strong>,</p>
          <p>
            Your MedBed Quantum appointment booking has been <strong>approved</strong>.
            We are excited to have you on board.
          </p>
          <div class="info-box">
            <p>
              📋 A member of our team will be reaching out to you shortly with the necessary
              forms and next steps to complete your appointment process.
              Please ensure your contact details are up to date.
            </p>
          </div>
          <p>
            If you have any questions in the meantime, please do not hesitate to
            contact our support team.
          </p>
          <p style="margin-top: 24px;">Thank you for choosing MedBed Quantum.</p>
        </div>
        <div class="footer">
          <p>This email was sent by QFS Ledger Vault. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body></html>
  `,
});
