const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = '1040277251666-jqg335ao99l0lpu346k0e75276ok0bck.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

console.log('\n⚠️  IMPORTANTE: Asegúrate de iniciar sesión con carterasdatsudara@gmail.com\n');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://mail.google.com/'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('\n🔐 PASO 1: Autoriza esta aplicación visitando este URL:\n');
console.log(authUrl);
console.log('\n📋 PASO 2: Google te mostrará un código directamente en la página');
console.log('📋 PASO 3: Copia ese código y pégalo aquí\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Pega el código de autorización aquí: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ ¡Tokens obtenidos exitosamente!\n');
    console.log('🔑 Copia estos valores a tu archivo .env:\n');
    console.log(`OAUTH_CLIENT_ID=${CLIENT_ID}`);
    console.log(`OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n✨ ¡Configuración completa!');
  } catch (error) {
    console.error('❌ Error obteniendo tokens:', error.message);
  }
  rl.close();
});
