const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const DB_URL = `postgresql://postgres:Lq%23jgA%24hKJ.9a5%2A@db.jubtrbkafcroumcekfto.supabase.co:5432/postgres`;

async function run() {
  // Generar hash correcto
  const password = 'Admin2026!';
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash generado:', hash);

  // Verificar que el hash funciona
  const valid = await bcrypt.compare(password, hash);
  console.log('Verificación local:', valid ? '✅ OK' : '❌ FALLO');

  // Actualizar en la BD
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(
    `UPDATE admin_users SET password_hash = $1 WHERE email = 'admin@nuwatch.com'`,
    [hash]
  );
  console.log('✅ Hash actualizado en Supabase correctamente!');

  // Verificar
  const { rows } = await client.query(`SELECT email, role FROM admin_users WHERE email = 'admin@nuwatch.com'`);
  console.log('Usuario:', rows[0]);

  await client.end();
}

run().catch(console.error);
