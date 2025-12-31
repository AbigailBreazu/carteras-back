const { Client } = require('pg');

async function changePassword() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.CURRENT_PG_PASSWORD || 'admin 123',
  });

  try {
    await client.connect();
    console.log('Conectado a Postgres. Ejecutando ALTER USER...');
    await client.query("ALTER USER postgres WITH PASSWORD 'admin123';");
    console.log('✅ Contraseña cambiada a `admin123`.');
  } catch (err) {
    console.error('Error al cambiar la contraseña:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

changePassword();
