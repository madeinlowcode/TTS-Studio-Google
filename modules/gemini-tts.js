// Módulo para geração de áudio usando Gemini 2.5 TTS
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const wav = require('wav');

// Classe para gerenciar a conexão com Gemini 2.5 TTS
class GeminiTTS {
  constructor() {
    this.genAI = null;
    this.isReady = false;
    this.initialize();
  }

  // Inicializar o cliente Gemini
  initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('❌ GEMINI_API_KEY não encontrada nas variáveis de ambiente');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isReady = true;
      console.log('✅ Cliente Gemini 2.5 TTS inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar Gemini TTS:', error);
    }
  }

  // Verificar se está inicializado
  isInitialized() {
    return this.isReady && this.genAI !== null;
  }

  // Lista das 30 vozes Gemini disponíveis
  getGeminiVoices() {
    return [
      // Bright voices
      { name: 'Zephyr', style: 'Bright', category: 'energetic', languages: ['en-US', 'pt-BR'] },
      { name: 'Autonoe', style: 'Bright', category: 'energetic', languages: ['en-US', 'pt-BR'] },
      
      // Upbeat voices
      { name: 'Puck', style: 'Upbeat', category: 'cheerful', languages: ['en-US', 'pt-BR'] },
      { name: 'Laomedeia', style: 'Upbeat', category: 'cheerful', languages: ['en-US', 'pt-BR'] },
      
      // Firm voices
      { name: 'Kore', style: 'Firm', category: 'professional', languages: ['en-US', 'pt-BR'] },
      { name: 'Alnilam', style: 'Firm', category: 'professional', languages: ['en-US', 'pt-BR'] },
      
      // Calm voices
      { name: 'Callirrhoe', style: 'Calm', category: 'soothing', languages: ['en-US', 'pt-BR'] },
      { name: 'Umbriel', style: 'Calm', category: 'soothing', languages: ['en-US', 'pt-BR'] },
      
      // Clear voices
      { name: 'Iapetus', style: 'Clear', category: 'crisp', languages: ['en-US', 'pt-BR'] },
      { name: 'Erinome', style: 'Clear', category: 'crisp', languages: ['en-US', 'pt-BR'] },
      
      // Smooth voices
      { name: 'Algieba', style: 'Smooth', category: 'elegant', languages: ['en-US', 'pt-BR'] },
      { name: 'Despina', style: 'Smooth', category: 'elegant', languages: ['en-US', 'pt-BR'] },
      { name: 'Achernar', style: 'Smooth', category: 'elegant', languages: ['en-US', 'pt-BR'] },
      
      // Informative voices
      { name: 'Charon', style: 'Informative', category: 'educational', languages: ['en-US', 'pt-BR'] },
      { name: 'Rasalgethi', style: 'Informative', category: 'educational', languages: ['en-US', 'pt-BR'] },
      
      // Excitable voices
      { name: 'Fenrir', style: 'Excitable', category: 'dynamic', languages: ['en-US', 'pt-BR'] },
      
      // Youthful voices
      { name: 'Leda', style: 'Youthful', category: 'young', languages: ['en-US', 'pt-BR'] },
      
      // Business voices
      { name: 'Orus', style: 'Business', category: 'corporate', languages: ['en-US', 'pt-BR'] },
      
      // Breezy voices
      { name: 'Aoede', style: 'Breezy', category: 'casual', languages: ['en-US', 'pt-BR'] },
      
      // Breathy voices
      { name: 'Enceladus', style: 'Breathy', category: 'intimate', languages: ['en-US', 'pt-BR'] },
      
      // Gravelly voices
      { name: 'Algenib', style: 'Gravelly', category: 'textured', languages: ['en-US', 'pt-BR'] },
      
      // Even voices
      { name: 'Schedar', style: 'Even', category: 'balanced', languages: ['en-US', 'pt-BR'] },
      
      // Mature voices
      { name: 'Gacrux', style: 'Mature', category: 'experienced', languages: ['en-US', 'pt-BR'] },
      
      // Forward voices
      { name: 'Pulcherrima', style: 'Forward', category: 'assertive', languages: ['en-US', 'pt-BR'] },
      
      // Friendly voices
      { name: 'Achird', style: 'Friendly', category: 'warm', languages: ['en-US', 'pt-BR'] },
      
      // Casual voices
      { name: 'Zubenelgenubi', style: 'Casual', category: 'relaxed', languages: ['en-US', 'pt-BR'] },
      
      // Gentle voices
      { name: 'Vindemiatrix', style: 'Gentle', category: 'soft', languages: ['en-US', 'pt-BR'] },
      
      // Lively voices
      { name: 'Sadachbia', style: 'Lively', category: 'vibrant', languages: ['en-US', 'pt-BR'] },
      
      // Knowledgeable voices
      { name: 'Sadaltager', style: 'Knowledgeable', category: 'wise', languages: ['en-US', 'pt-BR'] },
      
      // Warm voices
      { name: 'Sulafat', style: 'Warm', category: 'comforting', languages: ['en-US', 'pt-BR'] }
    ];
  }

  // Função para salvar arquivo WAV
  async saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
    return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
    });
  }

  // Gerar áudio single-speaker
  async generateSingleSpeaker(text, voiceName, style = null) {
    if (!this.isInitialized()) {
      throw new Error('Cliente Gemini TTS não inicializado');
    }

    if (!text || !voiceName) {
      throw new Error('Os parâmetros text e voiceName são obrigatórios');
    }

    try {
      // Construir prompt com estilo se fornecido
      let prompt = text;
      if (style) {
        prompt = `Say ${style}: ${text}`;
      }

      console.log(`🎵 Gerando áudio single-speaker com voz ${voiceName}`);
      console.log(`📝 Prompt: ${prompt}`);

      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-tts" 
      });

      const response = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName }
            }
          }
        }
      });

      const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error('Nenhum dado de áudio retornado pela API');
      }

      // Converter base64 para buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Verificar se o diretório de uploads existe
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Gerar nome único para o arquivo
      const fileName = `gemini_${randomUUID()}.wav`;
      const filePath = path.join(uploadsDir, fileName);

      // Salvar como arquivo WAV
      await this.saveWaveFile(filePath, audioBuffer);

      console.log(`✅ Áudio gerado: ${fileName}`);

      return {
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${fileName}`,
        mimeType: 'audio/wav',
        type: 'gemini-single',
        voiceName: voiceName,
        style: style,
        prompt: prompt,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar áudio single-speaker:', error);
      throw error;
    }
  }

  // Gerar áudio multi-speaker
  async generateMultiSpeaker(dialogue, speakers) {
    if (!this.isInitialized()) {
      throw new Error('Cliente Gemini TTS não inicializado');
    }

    if (!dialogue || !speakers || speakers.length !== 2) {
      throw new Error('Diálogo e exatamente 2 speakers são obrigatórios');
    }

    try {
      console.log(`🎭 Gerando áudio multi-speaker`);
      console.log(`📝 Diálogo: ${dialogue}`);
      console.log(`👥 Speakers:`, speakers);

      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-preview-tts" 
      });

      const response = await model.generateContent({
        contents: [{ parts: [{ text: dialogue }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: speakers.map(speaker => ({
                speaker: speaker.name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: speaker.voice }
                }
              }))
            }
          }
        }
      });

      const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error('Nenhum dado de áudio retornado pela API');
      }

      // Converter base64 para buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Verificar se o diretório de uploads existe
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Gerar nome único para o arquivo
      const fileName = `gemini_multi_${randomUUID()}.wav`;
      const filePath = path.join(uploadsDir, fileName);

      // Salvar como arquivo WAV
      await this.saveWaveFile(filePath, audioBuffer);

      console.log(`✅ Áudio multi-speaker gerado: ${fileName}`);

      return {
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${fileName}`,
        mimeType: 'audio/wav',
        type: 'gemini-multi',
        speakers: speakers,
        dialogue: dialogue,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar áudio multi-speaker:', error);
      throw error;
    }
  }

  // Listar modelos disponíveis
  getAvailableModels() {
    return [
      {
        name: 'gemini-2.5-flash-preview-tts',
        description: 'Modelo rápido para TTS',
        singleSpeaker: true,
        multiSpeaker: true,
        maxTokens: 32000
      },
      {
        name: 'gemini-2.5-pro-preview-tts',
        description: 'Modelo avançado para TTS',
        singleSpeaker: true,
        multiSpeaker: true,
        maxTokens: 32000
      }
    ];
  }
}

// Exportar instância única
const geminiTTS = new GeminiTTS();
module.exports = { geminiTTS, GeminiTTS };
