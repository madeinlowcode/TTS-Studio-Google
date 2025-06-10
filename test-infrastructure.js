// Teste da infraestrutura TTS
require('dotenv').config();
const { ttsManager } = require('./modules/tts-manager');

async function testInfrastructure() {
  console.log('🧪 === TESTE DA INFRAESTRUTURA TTS ===\n');

  // 1. Testar status dos sistemas
  console.log('1️⃣ Testando status dos sistemas...');
  const status = ttsManager.getSystemStatus();
  console.log('📊 Status:', JSON.stringify(status, null, 2));
  console.log('');

  // 2. Testar listagem de vozes
  console.log('2️⃣ Testando listagem de vozes...');
  try {
    const voices = await ttsManager.getAllVoices();
    console.log(`✅ Vozes Gemini: ${voices.gemini.length}`);
    console.log(`✅ Vozes Google Cloud: ${voices.googleCloud.length}`);
    console.log(`✅ Total de vozes: ${voices.total}`);
    
    // Mostrar algumas vozes Gemini
    if (voices.gemini.length > 0) {
      console.log('\n🎭 Primeiras 5 vozes Gemini:');
      voices.gemini.slice(0, 5).forEach(voice => {
        console.log(`  - ${voice.name} (${voice.style}) - ${voice.category}`);
      });
    }
    
    // Mostrar algumas vozes Google Cloud
    if (voices.googleCloud.length > 0) {
      console.log('\n🎤 Primeiras 5 vozes Google Cloud:');
      voices.googleCloud.slice(0, 5).forEach(voice => {
        console.log(`  - ${voice.name} (${voice.type}) - ${voice.ssmlGender}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar vozes:', error.message);
  }
  console.log('');

  // 3. Testar recomendações
  console.log('3️⃣ Testando recomendações de voz...');
  const recommendations = ttsManager.getVoiceRecommendations('professional');
  console.log('💼 Recomendações profissionais:', recommendations);
  console.log('');

  // 4. Testar validação de requisição
  console.log('4️⃣ Testando validação de requisições...');
  
  const validRequest = {
    type: 'single-speaker',
    text: 'Teste de validação',
    voiceName: 'Kore'
  };
  
  const invalidRequest = {
    type: 'multi-speaker'
    // Faltando parâmetros obrigatórios
  };
  
  const validResult = ttsManager.validateRequest(validRequest);
  const invalidResult = ttsManager.validateRequest(invalidRequest);
  
  console.log('✅ Requisição válida:', validResult);
  console.log('❌ Requisição inválida:', invalidResult);
  console.log('');

  // 5. Testar estatísticas
  console.log('5️⃣ Testando estatísticas...');
  const stats = ttsManager.getUsageStats();
  console.log('📈 Estatísticas:', JSON.stringify(stats, null, 2));
  console.log('');

  // 6. Testar listagem de áudios
  console.log('6️⃣ Testando listagem de áudios...');
  try {
    const audios = await ttsManager.getAllAudios();
    console.log(`🎵 Total de áudios: ${audios.total.length}`);
    console.log(`🎭 Áudios Gemini: ${audios.gemini.length}`);
    console.log(`🎤 Áudios Google Cloud: ${audios.googleCloud.length}`);
    
    if (audios.total.length > 0) {
      console.log('\n📂 Últimos 3 áudios:');
      audios.total.slice(0, 3).forEach(audio => {
        console.log(`  - ${audio.fileName} (${audio.type}) - ${audio.size}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar áudios:', error.message);
  }
  console.log('');

  console.log('🎉 === TESTE DA INFRAESTRUTURA CONCLUÍDO ===');
}

// Executar teste
testInfrastructure().catch(console.error);
