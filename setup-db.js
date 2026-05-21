// Script para crear el esquema directamente en Supabase via pg
const { Client } = require('pg');

const DB_URL = `postgresql://postgres:Lq%23jgA%24hKJ.9a5%2A@db.jubtrbkafcroumcekfto.supabase.co:5432/postgres`;

const SQL = `
-- 1. Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de restablecimiento de contraseñas
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL,
  description TEXT,
  img JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de eventos de analíticas
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Función para estadísticas por producto
CREATE OR REPLACE FUNCTION get_product_stats()
RETURNS TABLE(product_id UUID, count BIGINT) AS $$
  SELECT product_id, COUNT(*) as count
  FROM analytics_events
  WHERE event_type = 'cart_add' AND product_id IS NOT NULL
  GROUP BY product_id
  ORDER BY count DESC;
$$ LANGUAGE SQL;

-- 6. Usuario superadmin inicial (password: Admin2026!)
INSERT INTO admin_users (name, email, password_hash, role) VALUES (
  'Super Admin',
  'admin@nuwatch.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS6vkP6',
  'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- 7. Productos por defecto
INSERT INTO products (name, category, price, description, img, features) VALUES
  ('NuWatch Pro', 'pro', 3999, 'Acero inoxidable y cristal de zafiro.',
   '["images/products/pro/1.png","images/products/pro/2.png"]',
   '["\u2764\ufe0f ECG","\ud83d\udcb3 NFC","\ud83c\udfca IP68"]'),
  ('NuWatch Ultra Sport', 'sport', 4599, 'GPS de doble frecuencia y titanio.',
   '["images/products/sport/1.png","images/products/sport/2.png"]',
   '["\ud83c\udfc3 GPS","\ud83d\udca7 SpO2","\ud83c\udf21\ufe0f Temp."]'),
  ('NuWatch Elite', 'classic', 5299, 'Acabados en oro de 18k.',
   '["images/products/elite/1.png","images/products/elite/2.png"]',
   '["\ud83d\udc8e Premium","\u23f1\ufe0f Garantia 2A"]'),
  ('NuWatch Hero', 'pro', 3299, 'Nuestra version mas ligera.',
   '["images/products/hero/1.png","images/products/hero/2.png"]',
   '["\ud83d\udcf1 App","\u2764\ufe0f Salud"]')
ON CONFLICT DO NOTHING;
`;

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('🔄 Conectando a Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado!');
    
    console.log('🔄 Ejecutando esquema SQL...');
    await client.query(SQL);
    console.log('✅ Tablas creadas exitosamente!');
    
    // Verificar
    const { rows } = await client.query('SELECT name, email, role FROM admin_users');
    console.log('👤 Usuarios creados:', rows);
    
    const { rows: prods } = await client.query('SELECT name, price FROM products');
    console.log('⌚ Productos creados:', prods);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
