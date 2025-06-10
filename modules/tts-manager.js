// Gerenciador unificado para ambos os sistemas TTS
const { geminiTTS } = require('./gemini-tts');
const { googleCloudTTS } = require('./google-cloud-tts');
const fs = require('fs');
const path = require('path');

// Classe para gerenciar ambos os sistemas TTS
class TTSManager {
  constructor() {
    this.gemini = geminiTTS;
    this.googleCloud = googleCloudTTS;
    this.cache = new Map();
    this.stats = {
      geminiRequests: 0,
      googleCloudRequests: 0,
      totalRequests: 0,
      errors: 0
    };
  }

  // Verificar status de ambos os sistemas
  getSystemStatus() {
    return {
      gemini: {
        available: this.gemini.isInitialized(),
        name: 'Gemini 2.5 TTS',
        features: ['single-speaker', 'multi-speaker', 'style-control', '30-voices']
      },
      googleCloud: {
        available: this.googleCloud.isInitialized(),
        name: 'Google Cloud TTS',
        features: ['single-speaker', 'voice-variety', 'audio-config', 'reliable']
      },
      unified: {
        available: this.gemini.isInitialized() || this.googleCloud.isInitialized(),
        preferredSystem: this.getPreferredSystem()
      }
    };
  }

  // Determinar sistema preferido baseado na disponibilidade
  getPreferredSystem() {
    if (this.gemini.isInitialized() && this.googleCloud.isInitialized()) {
      return 'both'; // Ambos disponíveis
    } else if (this.gemini.isInitialized()) {
      return 'gemini';
    } else if (this.googleCloud.isInitialized()) {
      return 'google-cloud';
    }
    return 'none';
  }

  // Listar todas as vozes disponíveis (unificado)
  async getAllVoices() {
    const cacheKey = 'all-voices';
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutos
        return cached.data;
      }
    }

    try {
      const voices = {
        gemini: [],
        googleCloud: [],
        total: 0
      };

      // Obter vozes Gemini
      if (this.gemini.isInitialized()) {
        voices.gemini = this.gemini.getGeminiVoices();
      }

      // Obter vozes Google Cloud
      if (this.googleCloud.isInitialized()) {
        voices.googleCloud = await this.googleCloud.listVoices();
      }

      voices.total = voices.gemini.length + voices.googleCloud.length;

      // Armazenar no cache
      this.cache.set(cacheKey, {
        data: voices,
        timestamp: Date.now()
      });

      return voices;
    } catch (error) {
      console.error('❌ Erro ao listar todas as vozes:', error);
      throw error;
    }
  }

  // Gerar áudio com roteamento automático
  async generateAudio(request) {
    this.stats.totalRequests++;

    try {
      const { type, text, voiceName, style, speakers, dialogue, system } = request;

      // Validar parâmetros básicos
      if (!text && !dialogue) {
        throw new Error('Texto ou diálogo é obrigatório');
      }

      // Roteamento baseado no tipo de requisição
      switch (type) {
        case 'single-speaker':
          return await this.generateSingleSpeaker(text, voiceName, style, system);
        
        case 'multi-speaker':
          return await this.generateMultiSpeaker(dialogue, speakers, system);
        
        case 'google-cloud':
          return await this.generateGoogleCloud(text, voiceName, request.options);
        
        default:
          // Auto-detectar melhor sistema
          return await this.autoGenerate(request);
      }
    } catch (error) {
      this.stats.errors++;
      console.error('❌ Erro na geração de áudio:', error);
      throw error;
    }
  }

  // Gerar áudio single-speaker
  async generateSingleSpeaker(text, voiceName, style = null, preferredSystem = null) {
    // Determinar qual sistema usar
    const useGemini = preferredSystem === 'gemini' || 
                     (preferredSystem !== 'google-cloud' && this.gemini.isInitialized());

    if (useGemini) {
      this.stats.geminiRequests++;
      return await this.gemini.generateSingleSpeaker(text, voiceName, style);
    } else if (this.googleCloud.isInitialized()) {
      this.stats.googleCloudRequests++;
      return await this.googleCloud.generateAudio(text, voiceName);
    } else {
      throw new Error('Nenhum sistema TTS disponível');
    }
  }

  // Gerar áudio multi-speaker (apenas Gemini)
  async generateMultiSpeaker(dialogue, speakers, preferredSystem = null) {
    if (!this.gemini.isInitialized()) {
      throw new Error('Gemini TTS não disponível para multi-speaker');
    }

    this.stats.geminiRequests++;
    return await this.gemini.generateMultiSpeaker(dialogue, speakers);
  }

  // Gerar áudio Google Cloud
  async generateGoogleCloud(text, voiceName, options = {}) {
    if (!this.googleCloud.isInitialized()) {
      throw new Error('Google Cloud TTS não disponível');
    }

    this.stats.googleCloudRequests++;
    return await this.googleCloud.generateAudio(text, voiceName, options);
  }

  // Auto-detectar melhor sistema para a requisição
  async autoGenerate(request) {
    const { text, voiceName, style, speakers } = request;

    // Se tem múltiplos speakers, usar Gemini
    if (speakers && speakers.length > 1) {
      return await this.generateMultiSpeaker(request.dialogue, speakers);
    }

    // Se tem estilo específico, preferir Gemini
    if (style && this.gemini.isInitialized()) {
      return await this.generateSingleSpeaker(text, voiceName, style, 'gemini');
    }

    // Se a voz é do Gemini, usar Gemini
    const geminiVoices = this.gemini.getGeminiVoices();
    const isGeminiVoice = geminiVoices.some(v => v.name === voiceName);
    
    if (isGeminiVoice && this.gemini.isInitialized()) {
      return await this.generateSingleSpeaker(text, voiceName, style, 'gemini');
    }

    // Caso contrário, usar Google Cloud ou fallback
    if (this.googleCloud.isInitialized()) {
      return await this.generateGoogleCloud(text, voiceName);
    } else if (this.gemini.isInitialized()) {
      return await this.generateSingleSpeaker(text, voiceName, style, 'gemini');
    } else {
      throw new Error('Nenhum sistema TTS disponível');
    }
  }

  // Listar todos os áudios gerados
  async getAllAudios() {
    try {
      const audios = {
        gemini: [],
        googleCloud: [],
        total: []
      };

      // Obter áudios do diretório uploads
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        
        files.forEach(file => {
          if (file.endsWith('.mp3') || file.endsWith('.wav')) {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            
            const audioInfo = {
              fileName: file,
              url: `/uploads/${file}`,
              size: this.formatFileSize(stats.size),
              created: stats.birthtime.toISOString(),
              type: this.detectAudioType(file)
            };

            // Categorizar por tipo
            if (file.startsWith('gemini_')) {
              audios.gemini.push(audioInfo);
            } else if (file.startsWith('google_')) {
              audios.googleCloud.push(audioInfo);
            }
            
            audios.total.push(audioInfo);
          }
        });

        // Ordenar por data de criação (mais recente primeiro)
        audios.total.sort((a, b) => new Date(b.created) - new Date(a.created));
        audios.gemini.sort((a, b) => new Date(b.created) - new Date(a.created));
        audios.googleCloud.sort((a, b) => new Date(b.created) - new Date(a.created));
      }

      return audios;
    } catch (error) {
      console.error('❌ Erro ao listar áudios:', error);
      return { gemini: [], googleCloud: [], total: [] };
    }
  }

  // Detectar tipo de áudio baseado no nome do arquivo
  detectAudioType(fileName) {
    if (fileName.startsWith('gemini_multi_')) return 'gemini-multi';
    if (fileName.startsWith('gemini_')) return 'gemini-single';
    if (fileName.startsWith('google_')) return 'google-cloud';
    if (fileName.startsWith('audio_')) return 'google-cloud'; // Compatibilidade
    return 'unknown';
  }

  // Formatar tamanho do arquivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obter estatísticas de uso
  getUsageStats() {
    return {
      ...this.stats,
      systems: this.getSystemStatus(),
      cacheSize: this.cache.size,
      uptime: process.uptime()
    };
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    console.log('✅ Cache do TTS Manager limpo');
  }

  // Validar requisição
  validateRequest(request) {
    const errors = [];

    if (!request.type) {
      errors.push('Tipo de requisição é obrigatório');
    }

    if (request.type === 'single-speaker') {
      if (!request.text) errors.push('Texto é obrigatório para single-speaker');
      if (!request.voiceName) errors.push('Nome da voz é obrigatório');
    }

    if (request.type === 'multi-speaker') {
      if (!request.dialogue) errors.push('Diálogo é obrigatório para multi-speaker');
      if (!request.speakers || request.speakers.length !== 2) {
        errors.push('Exatamente 2 speakers são obrigatórios para multi-speaker');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Obter recomendações de voz
  getVoiceRecommendations(useCase = 'general', system = 'auto') {
    const recommendations = {
      general: {
        gemini: ['Kore', 'Puck', 'Zephyr'],
        googleCloud: ['pt-BR-Neural2-A', 'pt-BR-Neural2-B', 'pt-BR-Wavenet-A']
      },
      professional: {
        gemini: ['Kore', 'Orus', 'Charon'],
        googleCloud: ['pt-BR-Neural2-C', 'pt-BR-Wavenet-C']
      },
      casual: {
        gemini: ['Puck', 'Aoede', 'Achird'],
        googleCloud: ['pt-BR-Wavenet-A', 'pt-BR-Standard-B']
      },
      narration: {
        gemini: ['Charon', 'Sadaltager', 'Iapetus'],
        googleCloud: ['pt-BR-Neural2-A', 'pt-BR-Wavenet-C']
      }
    };

    const caseRecs = recommendations[useCase] || recommendations.general;
    
    if (system === 'gemini') return caseRecs.gemini;
    if (system === 'google-cloud') return caseRecs.googleCloud;
    
    // Auto: retornar ambos
    return {
      gemini: caseRecs.gemini,
      googleCloud: caseRecs.googleCloud
    };
  }
}

// Exportar instância única
const ttsManager = new TTSManager();
module.exports = { ttsManager, TTSManager };
