// Rotas expandidas para gerenciamento de vozes
const express = require('express');
const { ttsManager } = require('../modules/tts-manager');
const router = express.Router();

// Middleware para logging
function logRequest(req, res, next) {
  console.log(`🎤 Voice API: ${req.method} ${req.originalUrl}`);
  next();
}

router.use(logRequest);

// GET /api/voices/search - Buscar vozes por critérios
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      system, 
      category, 
      style, 
      gender, 
      language = 'pt-BR',
      limit = 20 
    } = req.query;
    
    const allVoices = await ttsManager.getAllVoices();
    let results = [];
    
    // Combinar todas as vozes
    if (system === 'gemini' || !system) {
      results = results.concat(allVoices.gemini.map(v => ({ ...v, system: 'gemini' })));
    }
    
    if (system === 'google-cloud' || !system) {
      results = results.concat(allVoices.googleCloud.map(v => ({ ...v, system: 'google-cloud' })));
    }
    
    // Aplicar filtros
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(voice => 
        voice.name.toLowerCase().includes(searchTerm) ||
        (voice.style && voice.style.toLowerCase().includes(searchTerm)) ||
        (voice.category && voice.category.toLowerCase().includes(searchTerm))
      );
    }
    
    if (category) {
      results = results.filter(voice => voice.category === category);
    }
    
    if (style) {
      results = results.filter(voice => voice.style && voice.style.toLowerCase() === style.toLowerCase());
    }
    
    if (gender) {
      results = results.filter(voice => 
        voice.ssmlGender === gender.toUpperCase() ||
        (voice.gender && voice.gender.toUpperCase() === gender.toUpperCase())
      );
    }
    
    if (language) {
      results = results.filter(voice => {
        if (voice.languages) {
          return voice.languages.includes(language);
        }
        if (voice.languageCode) {
          return voice.languageCode === language;
        }
        return true;
      });
    }
    
    // Aplicar limite
    results = results.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      voices: results,
      total: results.length,
      filters: {
        query: query || null,
        system: system || 'all',
        category: category || null,
        style: style || null,
        gender: gender || null,
        language: language,
        limit: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro na busca de vozes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na busca de vozes',
      details: error.message
    });
  }
});

// GET /api/voices/categories - Listar categorias disponíveis
router.get('/categories', async (req, res) => {
  try {
    const allVoices = await ttsManager.getAllVoices();
    
    // Extrair categorias únicas do Gemini
    const geminiCategories = [...new Set(allVoices.gemini.map(v => v.category))];
    
    // Extrair tipos únicos do Google Cloud
    const googleCloudTypes = [...new Set(allVoices.googleCloud.map(v => v.type))];
    
    // Extrair estilos únicos do Gemini
    const geminiStyles = [...new Set(allVoices.gemini.map(v => v.style))];
    
    res.json({
      success: true,
      categories: {
        gemini: {
          categories: geminiCategories.sort(),
          styles: geminiStyles.sort()
        },
        googleCloud: {
          types: googleCloudTypes.sort()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar categorias',
      details: error.message
    });
  }
});

// GET /api/voices/compare - Comparar vozes
router.get('/compare', async (req, res) => {
  try {
    const { voices } = req.query;
    
    if (!voices) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro voices é obrigatório',
        details: 'Forneça uma lista de nomes de vozes separados por vírgula'
      });
    }
    
    const voiceNames = voices.split(',').map(v => v.trim());
    const allVoices = await ttsManager.getAllVoices();
    
    // Combinar todas as vozes
    const combinedVoices = [
      ...allVoices.gemini.map(v => ({ ...v, system: 'gemini' })),
      ...allVoices.googleCloud.map(v => ({ ...v, system: 'google-cloud' }))
    ];
    
    // Encontrar vozes solicitadas
    const foundVoices = voiceNames.map(name => {
      const voice = combinedVoices.find(v => v.name === name);
      return voice || { name: name, found: false };
    });
    
    // Separar encontradas e não encontradas
    const found = foundVoices.filter(v => v.found !== false);
    const notFound = foundVoices.filter(v => v.found === false).map(v => v.name);
    
    res.json({
      success: true,
      comparison: {
        found: found,
        notFound: notFound,
        total: found.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro na comparação de vozes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na comparação de vozes',
      details: error.message
    });
  }
});

// GET /api/voices/random - Obter vozes aleatórias
router.get('/random', async (req, res) => {
  try {
    const { 
      count = 5, 
      system, 
      category, 
      style 
    } = req.query;
    
    const allVoices = await ttsManager.getAllVoices();
    let voices = [];
    
    // Selecionar vozes baseado no sistema
    if (system === 'gemini' || !system) {
      voices = voices.concat(allVoices.gemini.map(v => ({ ...v, system: 'gemini' })));
    }
    
    if (system === 'google-cloud' || !system) {
      voices = voices.concat(allVoices.googleCloud.map(v => ({ ...v, system: 'google-cloud' })));
    }
    
    // Aplicar filtros
    if (category) {
      voices = voices.filter(voice => voice.category === category);
    }
    
    if (style) {
      voices = voices.filter(voice => voice.style && voice.style.toLowerCase() === style.toLowerCase());
    }
    
    // Embaralhar e selecionar
    const shuffled = voices.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(count));
    
    res.json({
      success: true,
      voices: selected,
      total: selected.length,
      availablePool: voices.length,
      filters: {
        count: parseInt(count),
        system: system || 'all',
        category: category || null,
        style: style || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter vozes aleatórias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter vozes aleatórias',
      details: error.message
    });
  }
});

// GET /api/voices/stats - Estatísticas das vozes
router.get('/stats', async (req, res) => {
  try {
    const allVoices = await ttsManager.getAllVoices();
    
    // Estatísticas Gemini
    const geminiStats = {
      total: allVoices.gemini.length,
      byCategory: {},
      byStyle: {}
    };
    
    allVoices.gemini.forEach(voice => {
      // Por categoria
      if (!geminiStats.byCategory[voice.category]) {
        geminiStats.byCategory[voice.category] = 0;
      }
      geminiStats.byCategory[voice.category]++;
      
      // Por estilo
      if (!geminiStats.byStyle[voice.style]) {
        geminiStats.byStyle[voice.style] = 0;
      }
      geminiStats.byStyle[voice.style]++;
    });
    
    // Estatísticas Google Cloud
    const googleCloudStats = {
      total: allVoices.googleCloud.length,
      byType: {},
      byGender: {}
    };
    
    allVoices.googleCloud.forEach(voice => {
      // Por tipo
      if (!googleCloudStats.byType[voice.type]) {
        googleCloudStats.byType[voice.type] = 0;
      }
      googleCloudStats.byType[voice.type]++;
      
      // Por gênero
      if (!googleCloudStats.byGender[voice.ssmlGender]) {
        googleCloudStats.byGender[voice.ssmlGender] = 0;
      }
      googleCloudStats.byGender[voice.ssmlGender]++;
    });
    
    res.json({
      success: true,
      statistics: {
        total: allVoices.total,
        gemini: geminiStats,
        googleCloud: googleCloudStats,
        distribution: {
          geminiPercentage: Math.round((allVoices.gemini.length / allVoices.total) * 100),
          googleCloudPercentage: Math.round((allVoices.googleCloud.length / allVoices.total) * 100)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      details: error.message
    });
  }
});

// GET /api/voices/favorites - Vozes favoritas/recomendadas
router.get('/favorites', async (req, res) => {
  try {
    const { useCase = 'general' } = req.query;
    
    const recommendations = ttsManager.getVoiceRecommendations(useCase);
    const allVoices = await ttsManager.getAllVoices();
    
    // Combinar todas as vozes
    const combinedVoices = [
      ...allVoices.gemini.map(v => ({ ...v, system: 'gemini' })),
      ...allVoices.googleCloud.map(v => ({ ...v, system: 'google-cloud' }))
    ];
    
    // Encontrar vozes recomendadas
    const favorites = {
      gemini: [],
      googleCloud: [],
      all: []
    };
    
    if (recommendations.gemini) {
      favorites.gemini = recommendations.gemini.map(name => 
        combinedVoices.find(v => v.name === name && v.system === 'gemini')
      ).filter(Boolean);
    }
    
    if (recommendations.googleCloud) {
      favorites.googleCloud = recommendations.googleCloud.map(name => 
        combinedVoices.find(v => v.name === name && v.system === 'google-cloud')
      ).filter(Boolean);
    }
    
    favorites.all = [...favorites.gemini, ...favorites.googleCloud];
    
    res.json({
      success: true,
      favorites: favorites,
      useCase: useCase,
      total: favorites.all.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao obter favoritas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter vozes favoritas',
      details: error.message
    });
  }
});

module.exports = router;
