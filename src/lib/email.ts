import nodemailer from "nodemailer"

export async function sendInviteEmail({
  to,
  workspaceName,
  inviteLink,
}: {
  to: string
  workspaceName: string
  inviteLink: string
}) {
  // Support both standard SMTP and ClicsHQ-style GMAIL environment variables
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? "smtp.gmail.com" : undefined)
  const port = process.env.SMTP_PORT || "465"
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD
  const from = process.env.SMTP_FROM || `"${process.env.APP_NAME || "Cyberbay PMO"}" <${user || "no-reply@cyberbay.com"}>`

  let transporter

  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === "465",
      auth: {
        user,
        pass,
      },
    })
  } else {
    // Generate Ethereal Email test account for testing fallback
    console.log("No SMTP or Gmail credentials found in .env, generating Ethereal test account...")
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #e4e4e7; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #1e1e1e; border: 1px solid #2d2d2d; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
        <div style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px;">
          Cyberbay PMO
        </div>
        <h2 style="font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">
          You've been invited to join a workspace!
        </h2>
        <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          You have been invited to collaborate in <strong>${workspaceName}</strong>. 
          Click the button below to accept the invitation and set up your account.
        </p>
        <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(to right, #9333ea, #2563eb); color: #ffffff; font-size: 13px; font-weight: bold; text-decoration: none; padding: 12px 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3); margin-bottom: 24px;">
          Accept Invitation & Join
        </a>
        <div style="border-top: 1px solid #2d2d2d; padding-top: 16px; font-size: 11px; color: #71717a;">
          If the button doesn't work, copy and paste this link in your browser:<br/>
          <a href="${inviteLink}" style="color: #a855f7; text-decoration: none; word-break: break-all;">${inviteLink}</a>
        </div>
      </div>
    </div>
  `

  const info = await transporter.sendMail({
    from,
    to,
    subject: `Invitation to join ${workspaceName} on Cyberbay PMO`,
    html,
  })

  // Log preview URL if Ethereal
  if (!host) {
    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log("-----------------------------------------")
    console.log("✉️ Ethereal Testing Invitation Sent!")
    console.log(`To: ${to}`)
    console.log(`Preview URL: ${previewUrl}`)
    console.log("-----------------------------------------")
    return { previewUrl }
  }

  return { success: true }
}
