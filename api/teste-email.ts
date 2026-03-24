// import { sendConfirmationEmail } from './src/plugins/resend';
// import 'dotenv/config'
// // import { randomUUID } from 'crypto';

// async function testarEmail() {
//   try {
//     console.log('Enviando email de teste...');
    
//     // CORRIGIR A LOGICA DO CONFIRMTOKEN, TEM Q PEGAR DO BANCO
//     // const confirmToken = randomUUID();

//     const confirmLink = `http://localhost:3000/auth/confirm/${confirmToken}`;
    
//     await sendConfirmationEmail({
//       to: 'emmanuel.yokoyama@fatec.sp.gov.br',
//       name: 'Emmanuel Yokoyama',
//       confirmLink,
//     });
    
//     console.log('✅ Email enviado com sucesso!');
//     console.log('📧 Link de confirmação:', confirmLink);
//     console.log('🔑 Token:', confirmToken);
//   } catch (err) {
//     console.error('❌ Erro ao enviar email:', err);
//   }
// }

// testarEmail();
