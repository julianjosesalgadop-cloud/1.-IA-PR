-- ============================================================
-- NuWatch: Script SQL para Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

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
  desc TEXT,
  img JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla de eventos de analíticas
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,  -- 'page_view', 'cart_add'
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Función para obtener estadísticas por producto
CREATE OR REPLACE FUNCTION get_product_stats()
RETURNS TABLE(product_id UUID, count BIGINT) AS $$
  SELECT product_id, COUNT(*) as count
  FROM analytics_events
  WHERE event_type = 'cart_add' AND product_id IS NOT NULL
  GROUP BY product_id
  ORDER BY count DESC;
$$ LANGUAGE SQL;

-- 6. Deshabilitar Row Level Security (para acceso desde service key)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- 7. Usuario superadmin inicial
-- IMPORTANTE: reemplaza 'TU_HASH_AQUI' con el hash bcrypt de tu contraseña.
-- Puedes generar uno en: https://bcrypt-generator.com (cost factor 12)
-- Por defecto la contraseña de ejemplo es: Admin2026!
INSERT INTO admin_users (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@nuwatch.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS6vkP6',
  'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- 8. Productos por defecto
INSERT INTO products (name, category, price, desc, img, features) VALUES
  ('NuWatch Pro', 'pro', 3999, 'Acero inoxidable y cristal de zafiro.',
   '["images/products/pro/1.png","images/products/pro/2.png"]',
   '["❤️ ECG","💳 NFC","🏊 IP68"]'),
  ('NuWatch Ultra Sport', 'sport', 4599, 'GPS de doble frecuencia y titanio.',
   '["images/products/sport/1.png","images/products/sport/2.png"]',
   '["🏃 GPS","💧 SpO2","🌡️ Temp."]'),
  ('NuWatch Elite', 'classic', 5299, 'Acabados en oro de 18k.',
   '["images/products/elite/1.png","images/products/elite/2.png"]',
   '["💎 Premium","⏱️ Garantía 2A"]'),
  ('NuWatch Hero', 'pro', 3299, 'Nuestra versión más ligera.',
   '["images/products/hero/1.png","images/products/hero/2.png"]',
   '["📱 App","❤️ Salud"]')
ON CONFLICT DO NOTHING;
