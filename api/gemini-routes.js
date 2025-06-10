// Rotas específicas para Gemini 2.5 TTS
const express = require('express');
const { ttsManager } = require('../modules/tts-manager');
const router = express.Router();

// Middleware para verificar autenticação (APIs) - Híbrido: Sessão Web OU API Key
function isAuthenticatedAPI(req, res, next) {
  // 1. Verificar se há sessão web ativa (para interface web)
  if (req.session && req.session.user) {
    req.authMethod = 'session';
    req.userId = req.session.user.id || req.session.user.username;
    return next();
  }

  // 2. Verificar se há API Key no header (para uso programático)
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (apiKey) {
    // Verificar se a API Key é válida
    const validApiKeys = [
      process.env.TTS_API_KEY, // Sua API Key personalizada
      process.env.GEMINI_API_KEY // Permitir usar a mesma key do Gemini (opcional)
    ].filter(Boolean); // Remove valores undefined/null

    if (validApiKeys.includes(apiKey)) {
      req.authMethod = 'apikey';
      req.userId = 'api-user'; // Usuário genérico para API
      return next();
    } else {
      return res.status(401).json({
        success: false,
        error: 'API Key inválida',
        details: 'A API Key fornecida não é válida'
      });
    }
  }

  // 3. Nenhum método de autenticação válido
  res.status(401).json({
    success: false,
    error: 'Não autenticado',
    details: 'Você precisa fazer login ou fornecer uma API Key válida. Use o header "X-API-Key" ou "Authorization: Bearer <sua-key>"'
  });
}

// Middleware para logging de requisições
function logRequest(req, res, next) {
  const authInfo = req.authMethod === 'session'
    ? `Session: ${req.session?.user?.username || 'Unknown'}`
    : req.authMethod === 'apikey'
    ? 'API Key'
    : 'Anonymous';

  console.log(`🔗 API v2: ${req.method} ${req.originalUrl} - Auth: ${authInfo}`);
  next();
}

// Aplicar middlewares
router.use(logRequest);

// GET /api/v2/status - Status dos sistemas TTS
router.get('/status', (req, res) => {
  try {
    const status = ttsManager.getSystemStatus();
    const stats = ttsManager.getUsageStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      systems: status,
      statistics: stats,
      version: '2.0.0'
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status dos sistemas',
      details: error.message
    });
  }
});

// GET /api/v2/voices/all - Todas as vozes disponíveis
router.get('/voices/all', async (req, res) => {
  try {
    const voices = await ttsManager.getAllVoices();
    
    res.json({
      success: true,
      voices: voices,
      summary: {
        gemini: voices.gemini.length,
        googleCloud: voices.googleCloud.length,
        total: voices.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar todas as vozes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar vozes',
      details: error.message
    });
  }
});

// GET /api/v2/voices/gemini - Vozes Gemini específicas
router.get('/voices/gemini', (req, res) => {
  try {
    const { category, style } = req.query;
    let voices = ttsManager.gemini.getGeminiVoices();
    
    // Filtrar por categoria se especificada
    if (category) {
      voices = voices.filter(voice => voice.category === category);
    }
    
    // Filtrar por estilo se especificado
    if (style) {
      voices = voices.filter(voice => voice.style.toLowerCase() === style.toLowerCase());
    }
    
    // Agrupar por categoria
    const groupedByCategory = voices.reduce((acc, voice) => {
      if (!acc[voice.category]) {
        acc[voice.category] = [];
      }
      acc[voice.category].push(voice);
      return acc;
    }, {});
    
    res.json({
      success: true,
      voices: voices,
      groupedByCategory: groupedByCategory,
      filters: {
        category: category || 'all',
        style: style || 'all'
      },
      total: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar vozes Gemini:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar vozes Gemini',
      details: error.message
    });
  }
});

// GET /api/v2/voices/google-cloud - Vozes Google Cloud específicas
router.get('/voices/google-cloud', async (req, res) => {
  try {
    const { type, gender } = req.query;
    const allVoices = await ttsManager.getAllVoices();
    let voices = allVoices.googleCloud;
    
    // Filtrar por tipo se especificado
    if (type) {
      voices = voices.filter(voice => voice.type === type);
    }
    
    // Filtrar por gênero se especificado
    if (gender) {
      voices = voices.filter(voice => voice.ssmlGender === gender.toUpperCase());
    }
    
    // Agrupar por tipo
    const groupedByType = voices.reduce((acc, voice) => {
      if (!acc[voice.type]) {
        acc[voice.type] = [];
      }
      acc[voice.type].push(voice);
      return acc;
    }, {});
    
    res.json({
      success: true,
      voices: voices,
      groupedByType: groupedByType,
      filters: {
        type: type || 'all',
        gender: gender || 'all'
      },
      total: voices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar vozes Google Cloud:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar vozes Google Cloud',
      details: error.message
    });
  }
});

// POST /api/v2/generate-single - Gerar áudio single-speaker
router.post('/generate-single', isAuthenticatedAPI, async (req, res) => {
  try {
    const { text, voiceName, style, system } = req.body;
    
    // Validar parâmetros
    if (!text || !voiceName) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: 'Os parâmetros text e voiceName são obrigatórios'
      });
    }
    
    // Validar tamanho do texto
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Texto muito longo',
        details: 'O texto deve ter no máximo 5000 caracteres'
      });
    }
    
    console.log(`🎵 Gerando áudio single-speaker: ${voiceName} - ${text.substring(0, 50)}...`);
    
    const request = {
      type: 'single-speaker',
      text: text,
      voiceName: voiceName,
      style: style,
      system: system
    };
    
    // Validar requisição
    const validation = ttsManager.validateRequest(request);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Requisição inválida',
        details: validation.errors
      });
    }
    
    // Gerar áudio
    const audio = await ttsManager.generateAudio(request);
    
    res.json({
      success: true,
      message: 'Áudio single-speaker gerado com sucesso',
      audio: audio,
      request: {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        voiceName: voiceName,
        style: style,
        system: audio.type
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao gerar áudio single-speaker:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar áudio',
      details: error.message
    });
  }
});

// POST /api/v2/generate-multi - Gerar áudio multi-speaker
router.post('/generate-multi', isAuthenticatedAPI, async (req, res) => {
  try {
    const { dialogue, speakers } = req.body;
    
    // Validar parâmetros
    if (!dialogue || !speakers) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: 'Os parâmetros dialogue e speakers são obrigatórios'
      });
    }
    
    // Validar speakers
    if (!Array.isArray(speakers) || speakers.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Speakers inválidos',
        details: 'Exatamente 2 speakers são obrigatórios para multi-speaker'
      });
    }
    
    // Validar estrutura dos speakers
    for (const speaker of speakers) {
      if (!speaker.name || !speaker.voice) {
        return res.status(400).json({
          success: false,
          error: 'Speaker inválido',
          details: 'Cada speaker deve ter name e voice'
        });
      }
    }
    
    // Validar tamanho do diálogo
    if (dialogue.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Diálogo muito longo',
        details: 'O diálogo deve ter no máximo 10000 caracteres'
      });
    }
    
    console.log(`🎭 Gerando áudio multi-speaker: ${speakers.map(s => s.name).join(' & ')}`);
    
    const request = {
      type: 'multi-speaker',
      dialogue: dialogue,
      speakers: speakers
    };
    
    // Validar requisição
    const validation = ttsManager.validateRequest(request);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Requisição inválida',
        details: validation.errors
      });
    }
    
    // Gerar áudio
    const audio = await ttsManager.generateAudio(request);
    
    res.json({
      success: true,
      message: 'Áudio multi-speaker gerado com sucesso',
      audio: audio,
      request: {
        dialogue: dialogue.substring(0, 200) + (dialogue.length > 200 ? '...' : ''),
        speakers: speakers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao gerar áudio multi-speaker:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar áudio multi-speaker',
      details: error.message
    });
  }
});

// GET /api/v2/models - Modelos disponíveis
router.get('/models', (req, res) => {
  try {
    const geminiModels = ttsManager.gemini.getAvailableModels();
    
    const models = {
      gemini: geminiModels,
      googleCloud: [
        {
          name: 'google-cloud-tts',
          description: 'Google Cloud Text-to-Speech',
          singleSpeaker: true,
          multiSpeaker: false,
          voiceTypes: ['neural2', 'wavenet', 'standard', 'studio']
        }
      ]
    };
    
    res.json({
      success: true,
      models: models,
      total: geminiModels.length + 1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar modelos',
      details: error.message
    });
  }
});

// GET /api/v2/audios - Listar todos os áudios gerados
router.get('/audios', isAuthenticatedAPI, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    const audios = await ttsManager.getAllAudios();
    
    let filteredAudios = audios.total;
    
    // Filtrar por tipo se especificado
    if (type && type !== 'all') {
      filteredAudios = audios[type] || [];
    }
    
    // Aplicar paginação
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedAudios = filteredAudios.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      audios: paginatedAudios,
      pagination: {
        total: filteredAudios.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredAudios.length
      },
      summary: {
        gemini: audios.gemini.length,
        googleCloud: audios.googleCloud.length,
        total: audios.total.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar áudios:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar áudios',
      details: error.message
    });
  }
});

// GET /api/v2/recommendations - Recomendações de voz
router.get('/recommendations', (req, res) => {
  try {
    const { useCase = 'general', system = 'auto' } = req.query;
    
    const recommendations = ttsManager.getVoiceRecommendations(useCase, system);
    
    res.json({
      success: true,
      recommendations: recommendations,
      useCase: useCase,
      system: system,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter recomendações:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter recomendações',
      details: error.message
    });
  }
});

// POST /api/v2/validate - Validar requisição
router.post('/validate', (req, res) => {
  try {
    const validation = ttsManager.validateRequest(req.body);
    
    res.json({
      success: true,
      validation: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao validar requisição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao validar requisição',
      details: error.message
    });
  }
});

module.exports = router;
