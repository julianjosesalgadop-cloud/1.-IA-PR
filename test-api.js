// Test local de la función products.js
process.env.SUPABASE_URL = 'https://jubtrbkafcroumcekfto.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YnRyYmthZmNyb3VtY2VrZnRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMwMTY3MywiZXhwIjoyMDk0ODc3NjczfQ.zrMUcVuDSqsl1fCLxWeZj4HvEUVwCmjz0oER7kDsAc0';
process.env.JWT_SECRET = 'nuwatch_prod_2026_xK9mPqR7vL3nW8sY';

const handler = require('./api/products.js');

const req = {
  method: 'GET',
  headers: {},
  body: {}
};

const res = {
  headers: {},
  statusCode: 200,
  setHeader(k, v) { this.headers[k] = v; },
  status(code) { this.statusCode = code; return this; },
  json(data) { console.log('Response:', this.statusCode, JSON.stringify(data, null, 2)); },
  end() { console.log('Response ended'); }
};

handler(req, res).catch(err => console.error('Error en handler:', err));
