// Módulo refatorado para Google Cloud Text-to-Speech
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

// Classe para gerenciar Google Cloud TTS
class GoogleCloudTTS {
  constructor() {
    this.ttsClient = null;
    this.isReady = false;
    this.initialize();
  }

  // Inicializar o cliente Text-to-Speech
  initialize() {
    try {
      // Verificar se o arquivo de credenciais existe
      const credentialsPath = path.join(__dirname, '..', 'google', 'madeinlowcode.json');
      if (fs.existsSync(credentialsPath)) {
        this.ttsClient = new TextToSpeechClient({
          keyFilename: credentialsPath
        });
        this.isReady = true;
        console.log('✅ Cliente Google Cloud TTS inicializado com sucesso');
      } else {
        console.error('❌ Arquivo de credenciais não encontrado:', credentialsPath);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Cloud TTS:', error);
    }
  }

  // Verificar se está inicializado
  isInitialized() {
    return this.isReady && this.ttsClient !== null;
  }

  // Listar vozes disponíveis
  async listVoices() {
    if (!this.isInitialized()) {
      throw new Error('Cliente Google Cloud TTS não inicializado');
    }

    try {
      const [result] = await this.ttsClient.listVoices({});
      const voices = result.voices;

      // Filtrar e formatar vozes
      return voices
        .filter(voice => voice.languageCodes.some(code => code.startsWith('pt-BR')))
        .map(voice => ({
          name: voice.name,
          languageCode: voice.languageCodes[0],
          ssmlGender: voice.ssmlGender,
          naturalSampleRateHertz: voice.naturalSampleRateHertz,
          type: this.getVoiceType(voice.name),
          category: 'google-cloud'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('❌ Erro ao listar vozes:', error);
      throw error;
    }
  }

  // Determinar tipo de voz baseado no nome
  getVoiceType(voiceName) {
    if (voiceName.includes('Neural2')) return 'neural2';
    if (voiceName.includes('Wavenet')) return 'wavenet';
    if (voiceName.includes('Standard')) return 'standard';
    if (voiceName.includes('Studio')) return 'studio';
    return 'standard';
  }

  // Gerar áudio a partir de texto
  async generateAudio(text, voiceName, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('Cliente Google Cloud TTS não inicializado');
    }
    
    if (!text || !voiceName) {
      throw new Error('Os parâmetros text e voiceName são obrigatórios');
    }
    
    try {
      // Extrair o código de idioma da voz
      const languageCode = voiceName.split('-').slice(0, 2).join('-');
      
      // Configurações padrão
      const defaultOptions = {
        pitch: 0,
        speakingRate: 1.1,
        audioEncoding: 'MP3'
      };
      
      const config = { ...defaultOptions, ...options };
      
      // Preparar a requisição
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          name: voiceName
        },
        audioConfig: {
          audioEncoding: config.audioEncoding,
          pitch: config.pitch,
          speakingRate: config.speakingRate
        }
      };
      
      console.log(`🎵 Gerando áudio Google Cloud TTS com voz ${voiceName}`);
      console.log(`📝 Texto: ${text.substring(0, 100)}...`);
      
      // Fazer a requisição
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Verificar se o diretório de uploads existe
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Gerar nome único para o arquivo
      const extension = config.audioEncoding.toLowerCase() === 'mp3' ? 'mp3' : 'wav';
      const fileName = `google_${randomUUID()}.${extension}`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Salvar o arquivo de áudio
      fs.writeFileSync(filePath, response.audioContent);
      
      console.log(`✅ Áudio Google Cloud gerado: ${fileName}`);
      
      // Retornar informações do áudio gerado
      return {
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${fileName}`,
        mimeType: `audio/${extension}`,
        type: 'google-cloud',
        voiceName: voiceName,
        languageCode: languageCode,
        config: config,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar áudio Google Cloud:', error);
      throw error;
    }
  }

  // Listar áudios gerados (compatibilidade com sistema atual)
  listAudios() {
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return [];
      }
      
      const files = fs.readdirSync(uploadsDir);
      
      return files
        .filter(file => file.startsWith('google_') && (file.endsWith('.mp3') || file.endsWith('.wav')))
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            fileName: file,
            url: `/uploads/${file}`,
            size: this.formatFileSize(stats.size),
            created: stats.birthtime.toISOString(),
            type: 'google-cloud'
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      console.error('❌ Erro ao listar áudios:', error);
      return [];
    }
  }

  // Formatar tamanho do arquivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obter configurações de voz recomendadas
  getVoiceRecommendations(useCase = 'general') {
    const recommendations = {
      general: ['pt-BR-Neural2-A', 'pt-BR-Neural2-B', 'pt-BR-Wavenet-A'],
      professional: ['pt-BR-Neural2-C', 'pt-BR-Wavenet-C', 'pt-BR-Standard-A'],
      casual: ['pt-BR-Wavenet-A', 'pt-BR-Wavenet-B', 'pt-BR-Standard-B'],
      narration: ['pt-BR-Neural2-A', 'pt-BR-Neural2-C', 'pt-BR-Wavenet-C']
    };
    
    return recommendations[useCase] || recommendations.general;
  }

  // Validar configurações de áudio
  validateAudioConfig(config) {
    const validEncodings = ['MP3', 'WAV', 'OGG_OPUS'];
    const validPitchRange = [-20, 20];
    const validSpeedRange = [0.25, 4.0];
    
    const errors = [];
    
    if (config.audioEncoding && !validEncodings.includes(config.audioEncoding)) {
      errors.push(`Encoding inválido: ${config.audioEncoding}`);
    }
    
    if (config.pitch && (config.pitch < validPitchRange[0] || config.pitch > validPitchRange[1])) {
      errors.push(`Pitch fora do range válido: ${validPitchRange[0]} a ${validPitchRange[1]}`);
    }
    
    if (config.speakingRate && (config.speakingRate < validSpeedRange[0] || config.speakingRate > validSpeedRange[1])) {
      errors.push(`Speaking rate fora do range válido: ${validSpeedRange[0]} a ${validSpeedRange[1]}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Obter estatísticas de uso
  getUsageStats() {
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return { totalFiles: 0, totalSize: 0, lastGenerated: null };
      }
      
      const files = fs.readdirSync(uploadsDir)
        .filter(file => file.startsWith('google_'));
      
      let totalSize = 0;
      let lastGenerated = null;
      
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        
        if (!lastGenerated || stats.birthtime > lastGenerated) {
          lastGenerated = stats.birthtime;
        }
      });
      
      return {
        totalFiles: files.length,
        totalSize: this.formatFileSize(totalSize),
        lastGenerated: lastGenerated ? lastGenerated.toISOString() : null
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { totalFiles: 0, totalSize: 0, lastGenerated: null };
    }
  }
}

// Exportar instância única
const googleCloudTTS = new GoogleCloudTTS();
module.exports = { googleCloudTTS, GoogleCloudTTS };
