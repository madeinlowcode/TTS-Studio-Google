// Módulo para geração de áudio usando a API do Google Cloud Text-to-Speech
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

// Classe para gerenciar a conexão com a API do Google Cloud Text-to-Speech
class AudioGenerator {
  constructor() {
    this.ttsClient = null;
    this.initialize();
  }

  // Inicializar o cliente Text-to-Speech
  initialize() {
    try {
      // Verificar se o arquivo de credenciais existe
      const credentialsPath = path.join(__dirname, 'google', 'madeinlowcode.json');
      if (fs.existsSync(credentialsPath)) {
        this.ttsClient = new TextToSpeechClient({
          keyFilename: credentialsPath
        });
        console.log('Cliente Text-to-Speech inicializado com sucesso');
      } else {
        console.error('Arquivo de credenciais não encontrado:', credentialsPath);
      }
    } catch (error) {
      console.error('Erro ao inicializar o cliente Text-to-Speech:', error);
    }
  }

  // Verificar se o cliente está inicializado
  isInitialized() {
    return this.ttsClient !== null;
  }
  
  // Listar vozes disponíveis
  async listVoices(languageCode = 'pt-BR') {
    if (!this.isInitialized()) {
      throw new Error('Cliente Text-to-Speech não inicializado');
    }
    
    try {
      const [result] = await this.ttsClient.listVoices({ languageCode });
      return result.voices.map(voice => ({
        name: voice.name,
        gender: voice.ssmlGender,
        languageCode: voice.languageCodes[0],
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }));
    } catch (error) {
      console.error('Erro ao listar vozes:', error);
      throw error;
    }
  }
  
  // Gerar áudio a partir de texto
  async generateAudio(text, voiceName) {
    if (!this.isInitialized()) {
      throw new Error('Cliente Text-to-Speech não inicializado');
    }
    
    if (!text || !voiceName) {
      throw new Error('Os parâmetros text e voiceName são obrigatórios');
    }
    
    try {
      // Extrair o código de idioma da voz (ex: pt-BR-Neural2-A -> pt-BR)
      const languageCode = voiceName.split('-').slice(0, 2).join('-');
      
      // Preparar a requisição para a API Text-to-Speech
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          name: voiceName
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1.1
        }
      };
      
      console.log('Enviando requisição para geração de áudio:', request);
      
      // Fazer a requisição para a API Text-to-Speech
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Verificar se o diretório de uploads existe, se não, criar
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Gerar nome único para o arquivo
      const fileName = `audio_${randomUUID()}.mp3`;
      const filePath = path.join(uploadsDir, fileName);
      
      // Salvar o arquivo de áudio
      fs.writeFileSync(filePath, response.audioContent);
      
      // Retornar informações do áudio gerado
      return {
        fileName: fileName,
        filePath: filePath,
        url: `/uploads/${fileName}`,
        mimeType: 'audio/mp3',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      throw error;
    }
  }
  
  // Listar áudios gerados
  listAudios() {
    try {
      const uploadsDir = path.join(__dirname, 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return [];
      }
      
      const files = fs.readdirSync(uploadsDir);
      const audioFiles = files.filter(file => file.endsWith('.mp3'));
      
      return audioFiles.map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          fileName: file,
          url: `/uploads/${file}`,
          mimeType: 'audio/mp3',
          createdAt: stats.mtime.toISOString(),
          size: stats.size
        };
      });
    } catch (error) {
      console.error('Erro ao listar áudios:', error);
      throw error;
    }
  }
}

// Criar uma instância do gerador de áudio
const audioGenerator = new AudioGenerator();

// Exportar o módulo
module.exports = {
  AudioGenerator,
  audioGenerator
};
