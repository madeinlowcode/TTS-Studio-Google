// Importando módulos necessários
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config(); // Carregar variáveis de ambiente
const { authenticate } = require('./users');

// Carregar audio-generator de forma segura (compatibilidade)
let audioGenerator = null;
try {
  const audioModule = require('./audio-generator');
  audioGenerator = audioModule.audioGenerator;
  console.log('✅ Módulo audio-generator (legacy) carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar audio-generator:', error.message);
  console.log('⚠️ Servidor iniciará sem funcionalidades de áudio legacy');
}

// Carregar novo sistema TTS unificado
let ttsManager = null;
try {
  const ttsModule = require('./modules/tts-manager');
  ttsManager = ttsModule.ttsManager;
  console.log('✅ Sistema TTS unificado carregado com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar sistema TTS unificado:', error.message);
  console.log('⚠️ Servidor iniciará sem funcionalidades TTS v2');
}

// Inicializar o aplicativo Express
const app = express();

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Configurar middleware para processar JSON e dados de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configurar sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'texto-para-audio-secreto-default',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Em produção, defina como true para HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true, // Previne acesso via JavaScript
    path: '/' // Garantir que o cookie esteja disponível em todo o site
  }
}));

// Middleware para debug de sessão
app.use((req, res, next) => {
  console.log('Sessão atual:', req.session.id, req.session.user ? 'Autenticado' : 'Não autenticado');
  next();
});

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para verificar autenticação (páginas)
function isAuthenticated(req, res, next) {
  console.log('=== VERIFICAÇÃO DE AUTENTICAÇÃO ===');
  console.log('Session ID:', req.session.id);
  console.log('Session data:', req.session);
  console.log('User in session:', req.session.user);

  if (req.session && req.session.user) {
    console.log('✅ Usuário autenticado:', req.session.user.username);
    return next();
  }
  console.log('❌ Usuário não autenticado, redirecionando para login');
  res.redirect('/login.html');
}



// Verificar se o módulo de geração de áudio está inicializado (legacy)
if (audioGenerator && audioGenerator.isInitialized()) {
  console.log('✅ Módulo de geração de áudio legacy inicializado com sucesso');
} else {
  console.error('❌ Módulo de geração de áudio legacy não disponível');
  console.error('⚠️ Verifique se o arquivo de credenciais existe em: google/madeinlowcode.json');
}

// Verificar sistema TTS unificado
if (ttsManager) {
  const status = ttsManager.getSystemStatus();
  console.log('✅ Sistema TTS unificado inicializado');
  console.log(`🎭 Gemini TTS: ${status.gemini.available ? 'Disponível' : 'Indisponível'}`);
  console.log(`🎤 Google Cloud TTS: ${status.googleCloud.available ? 'Disponível' : 'Indisponível'}`);
  console.log(`🔄 Sistema preferido: ${status.unified.preferredSystem}`);
} else {
  console.error('❌ Sistema TTS unificado não disponível');
}



// Servir arquivos estáticos (sem proteção para arquivos básicos)
app.use(express.static(path.join(__dirname), {
  index: false // Não servir index.html automaticamente
}));

// Proteger páginas específicas
app.get('/pages/dashboard.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/pages/gemini-studio.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'gemini-studio.html'));
});

app.get('/pages/multi-speaker.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'multi-speaker.html'));
});

app.get('/pages/voice-lab.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'voice-lab.html'));
});

app.get('/pages/api-docs.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'api-docs.html'));
});

// Servir outras páginas sem proteção (login, etc)
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// Rotas de autenticação
app.post('/auth/login', async (req, res) => {
  console.log('=== TENTATIVA DE LOGIN ===');
  console.log('Body recebido:', req.body);
  console.log('Session ID antes do login:', req.session.id);

  const { username, password } = req.body;

  // Verificar se os dados foram recebidos corretamente
  if (!username || !password) {
    console.error('❌ Dados de login incompletos:', { username, password });
    return res.redirect('/login.html?error=3');
  }

  try {
    console.log(`🔍 Autenticando usuário: ${username}`);
    const user = await authenticate(username, password);

    if (user) {
      console.log('✅ Autenticação bem-sucedida para:', username);
      console.log('👤 Dados do usuário:', user);

      // Armazenar usuário na sessão
      req.session.user = user;
      console.log('💾 Usuário armazenado na sessão');
      console.log('📋 Session após armazenar usuário:', req.session);

      // Salvar a sessão explicitamente antes de redirecionar
      req.session.save((err) => {
        if (err) {
          console.error('❌ Erro ao salvar sessão:', err);
          return res.redirect('/login.html?error=4');
        }
        console.log('✅ Sessão salva com sucesso!');
        console.log('🔄 Redirecionando para /pages/dashboard.html');
        return res.redirect('/pages/dashboard.html');
      });
    } else {
      console.log('❌ Autenticação falhou para:', username);
      res.redirect('/login.html?error=1');
    }
  } catch (error) {
    console.error('💥 Erro na autenticação:', error);
    res.redirect('/login.html?error=2');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// Rota principal - redireciona para dashboard ou login
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/pages/dashboard.html');
  } else {
    res.redirect('/login.html');
  }
});

// Dashboard (protegido)
app.get('/dashboard', isAuthenticated, (req, res) => {
  console.log('📊 Servindo dashboard para usuário autenticado');
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

// Proteger a página do cliente
app.get('/client.html', isAuthenticated, (req, res) => {
  console.log('Servindo página do cliente para usuário autenticado:', req.session.user.username);
  res.sendFile(path.join(__dirname, 'client.html'));
});

// Rota alternativa para a página do cliente (para compatibilidade)
app.get('/client', isAuthenticated, (req, res) => {
  console.log('Redirecionando /client para /client.html');
  res.redirect('/client.html');
});



// API para gerar áudio (legacy)
app.post('/api/generate', isAuthenticated, async (req, res) => {
  try {
    const { text, voiceName } = req.body;

    if (!text || !voiceName) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        details: 'Os parâmetros text e voiceName são obrigatórios'
      });
    }

    // Verificar se o gerador de áudio está disponível e inicializado
    if (!audioGenerator || !audioGenerator.isInitialized()) {
      return res.status(500).json({
        success: false,
        error: 'Gerador de áudio não disponível',
        details: 'Verifique se o arquivo de credenciais está presente e válido'
      });
    }

    // Gerar o áudio usando o módulo audioGenerator
    const audio = await audioGenerator.generateAudio(text, voiceName);

    // Registrar a atividade do usuário
    console.log(`Usuário ${req.session.user.username} gerou áudio: "${text.substring(0, 30)}..."`);

    res.json({
      success: true,
      message: 'Áudio gerado com sucesso',
      audio: audio
    });
  } catch (error) {
    console.error('Erro ao gerar áudio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar áudio',
      details: error.message
    });
  }
});

// API para listar vozes disponíveis
app.get('/api/voices', async (req, res) => {
  try {
    // Verificar se o gerador de áudio está disponível e inicializado
    if (!audioGenerator || !audioGenerator.isInitialized()) {
      return res.status(500).json({
        success: false,
        error: 'Gerador de áudio não disponível',
        details: 'Verifique se o arquivo de credenciais está presente e válido'
      });
    }

    // Obter as vozes disponíveis
    const voices = await audioGenerator.listVoices();

    res.json({
      success: true,
      voices: voices
    });
  } catch (error) {
    console.error('Erro ao listar vozes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar vozes',
      details: error.message
    });
  }
});

// API para listar áudios gerados (legacy)
app.get('/api/audios', isAuthenticated, (req, res) => {
  try {
    // Verificar se o gerador de áudio está disponível
    if (!audioGenerator) {
      return res.status(500).json({
        success: false,
        error: 'Gerador de áudio não disponível',
        details: 'Módulo de áudio não foi carregado'
      });
    }

    // Obter a lista de áudios gerados
    const audios = audioGenerator.listAudios();

    res.json({
      success: true,
      audios: audios
    });
  } catch (error) {
    console.error('Erro ao listar áudios:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar áudios',
      details: error.message
    });
  }
});

// Carregar e registrar rotas da API v2
try {
  const geminiRoutes = require('./api/gemini-routes');
  const voiceRoutes = require('./api/voice-routes');

  app.use('/api/v2', geminiRoutes);
  app.use('/api/voices', voiceRoutes);

  console.log('✅ Rotas da API v2 registradas com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar rotas da API v2:', error.message);
}

// Informações da API (expandida)
app.get('/api', (req, res) => {
  const endpoints = [
    // API v1 (legacy)
    {
      path: '/api/generate',
      method: 'POST',
      description: 'Gerar áudio a partir de texto (legacy)',
      version: 'v1'
    },
    {
      path: '/api/voices',
      method: 'GET',
      description: 'Listar vozes disponíveis (legacy)',
      version: 'v1'
    },
    {
      path: '/api/audios',
      method: 'GET',
      description: 'Listar áudios gerados (legacy)',
      version: 'v1'
    },
    // API v2 (nova)
    {
      path: '/api/v2/status',
      method: 'GET',
      description: 'Status dos sistemas TTS',
      version: 'v2'
    },
    {
      path: '/api/v2/voices/all',
      method: 'GET',
      description: 'Todas as vozes disponíveis (unificado)',
      version: 'v2'
    },
    {
      path: '/api/v2/voices/gemini',
      method: 'GET',
      description: 'Vozes Gemini específicas',
      version: 'v2'
    },
    {
      path: '/api/v2/generate-single',
      method: 'POST',
      description: 'Gerar áudio single-speaker',
      version: 'v2'
    },
    {
      path: '/api/v2/generate-multi',
      method: 'POST',
      description: 'Gerar áudio multi-speaker',
      version: 'v2'
    },
    {
      path: '/api/v2/models',
      method: 'GET',
      description: 'Modelos TTS disponíveis',
      version: 'v2'
    }
  ];

  res.json({
    name: 'API de Conversão de Texto em Voz',
    version: '2.0.0',
    description: 'API unificada com suporte a Gemini 2.5 TTS e Google Cloud TTS',
    systems: ttsManager ? ttsManager.getSystemStatus() : null,
    endpoints: endpoints,
    documentation: {
      v1: 'Endpoints legacy mantidos para compatibilidade',
      v2: 'Novos endpoints com recursos avançados'
    },
    timestamp: new Date().toISOString()
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3003;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor TTS Studio rodando em http://${HOST}:${PORT}`);
  console.log(`📊 Dashboard: http://${HOST}:${PORT}/pages/dashboard.html`);
  console.log(`🎭 Gemini Studio: http://${HOST}:${PORT}/pages/gemini-studio.html`);
  console.log(`👥 Multi-Speaker: http://${HOST}:${PORT}/pages/multi-speaker.html`);
  console.log(`🧪 Voice Lab: http://${HOST}:${PORT}/pages/voice-lab.html`);
  console.log(`🔗 API v2: http://${HOST}:${PORT}/api/v2/status`);
});
