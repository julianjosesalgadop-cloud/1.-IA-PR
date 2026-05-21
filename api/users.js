const bcrypt = require('bcryptjs');
const supabase = require('./lib/supabase');
const { verifyToken } = require('./lib/jwt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verificar autenticación
  const auth = verifyToken(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  // GET /api/users → listar todos los administradores
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, name, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST /api/users → crear nuevo administrador (solo superadmin)
  if (req.method === 'POST') {
    if (auth.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadmin puede crear usuarios.' });
    }

    const { name, email, password, role = 'admin' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // Verificar que el email no exista
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) return res.status(409).json({ error: 'Este email ya está registrado.' });

    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('admin_users')
      .insert({ name, email: email.toLowerCase(), password_hash: passwordHash, role, is_active: true })
      .select('id, name, email, role, is_active, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PUT /api/users → editar usuario (nombre, rol, estado activo)
  if (req.method === 'PUT') {
    if (auth.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadmin puede editar usuarios.' });
    }

    const { id, name, role, is_active, newPassword } = req.body;
    if (!id) return res.status(400).json({ error: 'ID de usuario requerido.' });

    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
      updates.password_hash = await bcrypt.hash(newPassword, 12);
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, is_active')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE /api/users → eliminar usuario
  if (req.method === 'DELETE') {
    if (auth.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadmin puede eliminar usuarios.' });
    }

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido.' });

    // No permitir auto-eliminarse
    if (id === auth.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Usuario eliminado.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
