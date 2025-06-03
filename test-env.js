// Carrega as variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config();

// Verifica se a variável FIREBASE_SERVICE_ACCOUNT existe
try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('❌ Erro: FIREBASE_SERVICE_ACCOUNT não está definida');
    process.exit(1);
  }

  // Tenta fazer o parse do JSON para verificar se está no formato correto
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  console.log('✅ FIREBASE_SERVICE_ACCOUNT está configurada corretamente');
  console.log('📋 Detalhes da conta de serviço:');
  console.log(`- Project ID: ${serviceAccount.project_id}`);
  console.log(`- Client Email: ${serviceAccount.client_email}`);
  
} catch (error) {
  console.error('❌ Erro ao processar FIREBASE_SERVICE_ACCOUNT:');
  console.error(error.message);
  process.exit(1);
}
