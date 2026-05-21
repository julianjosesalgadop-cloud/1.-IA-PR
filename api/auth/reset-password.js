const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'nuwatch_dev_secret';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña requeridos.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  // Verificar token JWT
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'El enlace de restablecimiento ha expirado o es inválido.' });
  }

  // Verificar en BD que no fue usado
  const { data: resetRecord } = await supabase
    .from('password_resets')
    .select('*')
    .eq('user_id', decoded.id)
    .eq('token', token)
    .eq('used', false)
    .single();

  if (!resetRecord) {
    return res.status(400).json({ error: 'El enlace ya fue utilizado o no existe.' });
  }

  // Encriptar nueva contraseña
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Actualizar contraseña
  await supabase
    .from('admin_users')
    .update({ password_hash: passwordHash })
    .eq('id', decoded.id);

  // Marcar reset como usado
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('user_id', decoded.id);

  return res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
};
