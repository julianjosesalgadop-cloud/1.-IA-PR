const supabase = require('../lib/supabase');
const { verifyToken } = require('../lib/jwt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET es público (para la tienda)
  // Escritura requiere autenticación
  const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
  if (isWrite) {
    const auth = verifyToken(req);
    if (!auth.valid) return res.status(401).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { name, category, price, desc, img, features } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nombre y precio requeridos.' });

    const { data, error } = await supabase
      .from('products')
      .insert({ name, category, price: parseFloat(price), description: desc, img: Array.isArray(img) ? img : [img], features: features || [], is_active: true })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido.' });

    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.img && !Array.isArray(updates.img)) updates.img = [updates.img];

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido.' });

    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Producto eliminado.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
