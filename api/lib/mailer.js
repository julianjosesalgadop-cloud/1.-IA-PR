const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetUrl) {
  await transporter.sendMail({
    from: `"NuWatch Admin" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Restablecer contraseña – NuWatch Admin',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Inter, Arial, sans-serif; background: #f5f5f7; margin: 0; padding: 2rem;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 20px; padding: 2.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 2rem;">
            <span style="font-size: 2rem;">⌚</span>
            <h2 style="color: #111; margin: 0.5rem 0 0;">Nu<strong>Watch</strong> Admin</h2>
          </div>
          <h3 style="color: #111; margin-bottom: 1rem;">Restablecer contraseña</h3>
          <p style="color: #555; line-height: 1.6;">Recibiste este correo porque solicitaste restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva.</p>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${resetUrl}" style="background: #820AD1; color: #fff; padding: 1rem 2rem; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 1rem; display: inline-block;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color: #999; font-size: 0.85rem;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este mensaje.</p>
          <hr style="border: none; border-top: 1px solid #ebebf0; margin: 1.5rem 0;">
          <p style="color: #bbb; font-size: 0.75rem; text-align: center;">© 2026 NuWatch. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
