const supabase = require('../_lib/supabase');
const { verifyToken } = require('../_lib/jwt');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: registrar un evento (visita o click en carrito)
  if (req.method === 'POST') {
    const { event, productId } = req.body;
    if (!event) return res.status(400).json({ error: 'Evento requerido.' });

    await supabase.from('analytics_events').insert({
      event_type: event,
      product_id: productId || null,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ ok: true });
  }

  // GET: resumen de estadísticas (requiere auth)
  if (req.method === 'GET') {
    const auth = verifyToken(req);
    if (!auth.valid) return res.status(401).json({ error: auth.error });

    const [{ count: views }, { count: cartClicks }, { data: productStats }] = await Promise.all([
      supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
      supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'cart_add'),
      supabase.rpc('get_product_stats'),
    ]);

    return res.status(200).json({ views: views || 0, cartClicks: cartClicks || 0, productStats: productStats || [] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
