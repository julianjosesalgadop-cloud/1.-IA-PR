const supabase = require('../lib/supabase');
const { generateResetToken } = require('../lib/jwt');
const { sendPasswordResetEmail } = require('../lib/mailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido.' });

  // Verificar que el usuario existe
  const { data: user } = await supabase
    .from('admin_users')
    .select('id, email, name')
    .eq('email', email.toLowerCase())
    .single();

  // Siempre responder OK (evitar enumerar usuarios)
  if (!user) {
    return res.status(200).json({ message: 'Si el correo existe, recibirás un enlace.' });
  }

  // Generar token de reset y guardarlo en la BD
  const resetToken = generateResetToken({ id: user.id, email: user.email });
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

  await supabase.from('password_resets').upsert({
    user_id: user.id,
    token: resetToken,
    expires_at: expiresAt,
    used: false,
  }, { onConflict: 'user_id' });

  const appUrl = process.env.APP_URL || 'https://tu-proyecto.vercel.app';
  const resetUrl = `${appUrl}/reset-password.html?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Error al enviar el correo. Verifica la configuración SMTP.' });
  }

  return res.status(200).json({ message: 'Si el correo existe, recibirás un enlace.' });
};
