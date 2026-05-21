const { execSync } = require('child_process');

const envs = {
  SUPABASE_URL: 'https://jubtrbkafcroumcekfto.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YnRyYmthZmNyb3VtY2VrZnRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTMwMTY3MywiZXhwIjoyMDk0ODc3NjczfQ.zrMUcVuDSqsl1fCLxWeZj4HvEUVwCmjz0oER7kDsAc0',
  JWT_SECRET: 'nuwatch_prod_2026_xK9mPqR7vL3nW8sY',
  APP_URL: 'https://1-ia-pr.vercel.app',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  EMAIL_FROM: 'noreply@nuwatch.com'
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Configurando ${key}...`);
  try {
      execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
  } catch (e) {
      // Ignorar error si no existe
  }
  
  try {
      execSync(`npx vercel env add ${key} production --value "${value}"`, { stdio: 'inherit' });
  } catch(e) {
      console.error(`Error configurando ${key}`);
  }
}
console.log('Variables configuradas en Vercel.');
