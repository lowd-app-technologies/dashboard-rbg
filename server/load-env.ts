import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Carrega as variáveis de ambiente do arquivo .env na raiz do projeto
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  console.log('Carregando variáveis de ambiente de:', envPath);
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error('Erro ao carregar o arquivo .env:', result.error);
    process.exit(1);
  }
  
  console.log('Variáveis de ambiente carregadas com sucesso');
} else {
  console.warn('Aviso: Nenhum arquivo .env encontrado em:', envPath);
  console.warn('Certifique-se de que as variáveis de ambiente necessárias estão definidas no sistema.');
}

// Verifica se as variáveis de ambiente necessárias estão definidas
const requiredEnvVars = [
  'FIREBASE_SERVICE_ACCOUNT',
  'DATABASE_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Erro: As seguintes variáveis de ambiente necessárias não estão definidas:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

export {};
