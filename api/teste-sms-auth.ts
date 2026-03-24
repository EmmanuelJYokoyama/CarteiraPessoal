import axios from 'axios';
import 'dotenv/config';

const API_BASE_URL = 'http://localhost:3000';

// Simular armazenamento do código enviado (em produção seria via SMS real)
let lastSmsCode: string | null = null;

// Interceptar para capturar o código SMS
const captureOtpCode = () => {
  // Nota: Em desenvolvimento, você precisaria monitorar os logs do Twilio
  // ou implementar um mock do Twilio
  console.log('\n⚠️  Aguardando código SMS...');
  console.log('💡 Tip: Verifique o console/logs do servidor para o código SMS enviado');
};

async function testAuthFlow() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testPhone = '+55999999999'; // Twilio test number
  const testName = 'Test User';

  try {
    console.log('🚀 Iniciando teste do fluxo de autenticação com SMS\n');

    // ===== PASSO 1: REGISTRAR USUÁRIO =====
    console.log('📝 PASSO 1: Registrando novo usuário...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Telefone: ${testPhone}`);

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      name: testName,
      email: testEmail,
      password: testPassword,
      phoneNumber: testPhone,
    });

    const { userId, message } = registerResponse.data;
    console.log(`✅ Usuário registrado com sucesso!`);
    console.log(`   ID: ${userId}`);
    console.log(`   Mensagem: ${message}\n`);

    // ===== PASSO 2: CAPTURAR CÓDIGO SMS =====
    console.log('📱 PASSO 2: Código SMS será enviado via Twilio');
    captureOtpCode();
    console.log('\n💬 Código SMS (Verifique os logs do servidor ou Twilio Dashboard)\n');

    // Para teste, você pode usar um código mock
    // Em produção, receberia via SMS real
    const mockCode = '123456'; // Substituir pelo código real do SMS

    // ===== PASSO 3: CONFIRMAR COM CÓDIGO SMS =====
    console.log('🔐 PASSO 3: Confirmando conta com código SMS...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Código: ${mockCode}`);

    const confirmResponse = await axios.post(`${API_BASE_URL}/auth/confirm-sms`, {
      email: testEmail,
      code: mockCode,
    });

    const { accessToken, refreshToken, expiresIn, message: confirmMessage } = confirmResponse.data;
    console.log(`✅ ${confirmMessage}`);
    console.log(`   Access Token: ${accessToken.substring(0, 30)}...`);
    console.log(`   Refresh Token: ${refreshToken.substring(0, 30)}...`);
    console.log(`   Expira em: ${expiresIn}s\n`);

    // ===== PASSO 4: FAZER LOGIN =====
    console.log('🔑 PASSO 4: Fazendo login com as credenciais...');
    console.log(`   Email: ${testEmail}`);

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    const { accessToken: loginAccessToken, expiresIn: loginExpiresIn } = loginResponse.data;
    console.log(`✅ Login realizado com sucesso!`);
    console.log(`   Access Token: ${loginAccessToken.substring(0, 30)}...`);
    console.log(`   Expira em: ${loginExpiresIn}s\n`);

    // ===== PASSO 5: REENVIAR CÓDIGO SMS =====
    console.log('📤 PASSO 5: Testando reenvio de código SMS (se necessário)...');

    const resendResponse = await axios.post(`${API_BASE_URL}/auth/resend-confirmation-sms`, {
      email: testEmail,
    });

    console.log(`✅ ${resendResponse.data.message}\n`);

    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('\n❌ ERRO:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    process.exit(1);
  }
}

// Função auxiliar para você inserir um código manualmente
async function confirmWithManualCode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Digite o código SMS recebido (6 dígitos): ', async (code: string) => {
      rl.close();
      console.log(`\nUsando código: ${code}`);
      resolve(code);
    });
  });
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  TESTE DE AUTENTICAÇÃO COM SMS (Twilio)                      ║
╚═══════════════════════════════════════════════════════════════╝

⚠️  IMPORTANTE:
• Certifique-se de que o servidor está rodando em http://localhost:3000
• Verifique se as credenciais do Twilio estão configuradas no .env
• Este teste registra um novo usuário e testa todo o fluxo de autenticação

FLUXO:
1️⃣  Registrar novo usuário
2️⃣  SMS com código será enviado via Twilio
3️⃣  Confirmar conta com código SMS
4️⃣  Fazer login
5️⃣  Testar reenvio de SMS

`);

testAuthFlow().catch(console.error);
