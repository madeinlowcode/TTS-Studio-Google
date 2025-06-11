# 🎤 **TTS Studio - API Completa de Conversão de Texto para Áudio**

Sistema web completo e profissional que combina **Gemini 2.5 TTS** e **Google Cloud Text-to-Speech** em uma plataforma unificada. Oferece interfaces modernas, APIs robustas e suporte completo para geração de áudio single-speaker e multi-speaker.

## ✨ **Funcionalidades Principais**

### 🎭 **Sistemas TTS Integrados**
- **Gemini 2.5 TTS**: IA avançada com controle de estilo e emoção
- **Google Cloud TTS**: Vozes profissionais de alta qualidade
- **Sistema Unificado**: API única para ambos os sistemas
- **Auto-fallback**: Redundância automática entre sistemas

### 🎯 **Interfaces Modernas**
- **📊 Dashboard**: Visão geral completa do sistema
- **🎭 Gemini Studio**: Geração single-speaker com controle avançado
- **👥 Multi-Speaker**: Diálogos e conversações realistas
- **🧪 Voice Lab**: Exploração de +100 vozes com filtros
- **📚 API Docs**: Documentação interativa com testes em tempo real
- **🎨 Interface Legacy**: client.html para compatibilidade

### 🔐 **Autenticação Flexível**
- **🍪 Sessão Web**: Para interfaces web (automático)
- **🔑 API Keys**: Para integrações (n8n, Zapier, scripts)
- **🔒 Autenticação Híbrida**: Suporte a ambos os métodos
- **🛡️ Segurança**: Proteção de rotas e validação

### 🔗 **APIs Completas**
- **API v2**: Endpoints modernos com recursos avançados
- **API v1**: Endpoints legacy para compatibilidade
- **Documentação Interativa**: Testes em tempo real
- **Exemplos Práticos**: cURL, Python, JavaScript, n8n

---

## 🚀 **Início Rápido - 5 Minutos**

### **1️⃣ Pré-requisitos**
- **Node.js** 14+ instalado
- **Conta Google Cloud** com Text-to-Speech API ativada
- **Chave API Gemini** (opcional, mas recomendado)

### **2️⃣ Instalação**
```bash
# 1. Clone o repositório
git clone <repository-url>
cd api_voz_google

# 2. Instale as dependências
npm install

# 3. Configure as credenciais (veja seção Configuração)
# 4. Inicie o servidor
npm start
```

### **3️⃣ Acesso Rápido**
- **🌐 Aplicação**: http://localhost:3003
- **👤 Login**: `admin` / `admin123`
- **📊 Dashboard**: http://localhost:3003/pages/dashboard.html
- **📚 API Docs**: http://localhost:3003/pages/api-docs.html

### **4️⃣ Teste Rápido**
```bash
# Testar API (público)
curl http://localhost:3003/api/v2/voices/all

# Testar com API Key
curl -H "X-API-Key: sua_api_key" \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3003/api/v2/generate-single \
     -d '{"text":"Olá mundo!","voiceName":"Alloy"}'
```

---

## ⚙️ **Configuração Completa**

### **1️⃣ Configuração do Google Cloud TTS**

#### **Criar Projeto e Ativar API:**
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione existente
3. Ative a API "Cloud Text-to-Speech":
   - APIs & Services → Library
   - Busque "Cloud Text-to-Speech API"
   - Clique "Enable"

#### **Criar Conta de Serviço:**
1. IAM & Admin → Service Accounts
2. Create Service Account
3. Clica na aba Chaves
4. Clique na opção "Adicionar chave" e depois na opção "Criar nova chave"
5. Baixe o arquivo JSON das credenciais
6. Renomeie o JSON para madeinlowcode.json
7. Coloque o arquivo JSON na pasta: `google/madeinlowcode.json`

### **2️⃣ Configuração do Gemini TTS (Opcional)**

#### **Obter API Key:**
1. Acesse: https://aistudio.google.com/
2. Crie uma API Key
3. Adicione no arquivo `.env`

### **3️⃣ Configuração do Ambiente**

#### **Arquivo `.env`:**
```bash
# Chave da API do Google Gemini
GEMINI_API_KEY=sua_chave_gemini_aqui

# Configurações do servidor
PORT=3003
HOST=localhost

# Segurança
SESSION_SECRET=sua_chave_secreta_super_segura_aqui

# Pasta para armazenar os arquivos de áudio
AUDIO_DIR=./uploads

# API Key para autenticação programática
TTS_API_KEY=tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9
```

### **4️⃣ Estrutura de Pastas**
```
api_voz_google/
├── 📁 google/                 # Credenciais do Google Cloud
│   └── madeinlowcode.json     # Arquivo de credenciais
├── 📁 uploads/                # Arquivos de áudio gerados
├── 📄 .env                    # Variáveis de ambiente
└── ...
```

---

## 🔗 **Como Usar a API**

### **🔐 Autenticação**

A API suporta **3 métodos de autenticação**:

#### **1️⃣ API Key (RECOMENDADO para integrações)**
```bash
# Header X-API-Key
curl -H "X-API-Key: tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9"

# Header Authorization
curl -H "Authorization: Bearer tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9"
```

#### **2️⃣ Sessão Web (para interfaces)**
- Login automático via interface web
- Cookies gerenciados automaticamente

#### **3️⃣ Cookies cURL (legacy)**
```bash
# 1. Login
curl -c cookies.txt -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Usar cookies
curl -b cookies.txt http://localhost:3003/api/v2/generate-single
```

### **📋 Endpoints Principais**

#### **🔓 Endpoints Públicos (sem autenticação):**

**GET /api/v2/status** - Status dos sistemas
```bash
curl http://localhost:3003/api/v2/status
```

**GET /api/v2/voices/all** - Todas as vozes
```bash
curl http://localhost:3003/api/v2/voices/all
```

#### **🔒 Endpoints Protegidos (com autenticação):**

**POST /api/v2/generate-single** - Gerar áudio single-speaker
```bash
curl -X POST http://localhost:3003/api/v2/generate-single \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "text": "Olá! Este é um teste do TTS Studio.",
    "voiceName": "Alloy",
    "style": "excited"
  }'
```

**POST /api/v2/generate-multi** - Gerar áudio multi-speaker
```bash
curl -X POST http://localhost:3003/api/v2/generate-multi \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "dialogue": "João: Olá Maria!\nMaria: Oi João, como você está?",
    "speakers": [
      {"name": "João", "voice": "Alloy"},
      {"name": "Maria", "voice": "Echo"}
    ]
  }'
```

---

## 💻 **Exemplos de Integração**

### **🐍 Python**
```python
import requests

API_BASE = "http://localhost:3003/api/v2"
API_KEY = "tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Gerar áudio
def generate_audio(text, voice_name, style=None):
    data = {"text": text, "voiceName": voice_name}
    if style:
        data["style"] = style

    response = requests.post(
        f"{API_BASE}/generate-single",
        headers=headers,
        json=data
    )
    return response.json()

# Exemplo de uso
result = generate_audio("Olá mundo!", "Alloy", "excited")
if result["success"]:
    print(f"Áudio gerado: {result['audio']['url']}")
```

### **🟨 JavaScript/Node.js**
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3003/api/v2';
const API_KEY = 'tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9';

const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
};

// Gerar áudio
async function generateAudio(text, voiceName, style = null) {
    try {
        const data = { text, voiceName };
        if (style) data.style = style;

        const response = await axios.post(
            `${API_BASE}/generate-single`,
            data,
            { headers }
        );
        return response.data;
    } catch (error) {
        console.error('Erro:', error.response?.data || error.message);
        throw error;
    }
}

// Exemplo de uso
generateAudio('Olá mundo!', 'Alloy', 'excited')
    .then(result => {
        if (result.success) {
            console.log(`Áudio gerado: ${result.audio.url}`);
        }
    });
```

### **🔧 n8n (No-Code)**
**Configuração do HTTP Request Node:**
- **Method**: POST
- **URL**: `http://localhost:3003/api/v2/generate-single`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "X-API-Key": "tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9"
  }
  ```
- **Body**:
  ```json
  {
    "text": "{{ $json.text }}",
    "voiceName": "Alloy",
    "style": "excited"
  }
  ```

### **⚡ Zapier**
**Configuração do Webhooks Action:**
- **Method**: POST
- **URL**: `http://localhost:3003/api/v2/generate-single`
- **Headers**:
  - `Content-Type`: `application/json`
  - `X-API-Key`: `tts_sk_a7b9c2d4e6f8g1h3j5k7m9n0p2q4r6s8t0u2v4w6x8y0z1a3b5c7d9e1f3g5h7i9`
- **Data**:
  ```json
  {
    "text": "{{text_from_trigger}}",
    "voiceName": "Alloy"
  }
  ```

---

## 🚀 Como Iniciar o Projeto

### 1️⃣ **Instalação das Dependências**

```bash
# Instalar todas as dependências necessárias
npm install
```

### 2️⃣ **Configuração do Google Cloud**

1. **Crie um projeto** no [Google Cloud Console](https://console.cloud.google.com/)
2. **Ative a API** Text-to-Speech
3. **Crie uma chave de serviço**:
   - Vá em "IAM & Admin" > "Service Accounts"
   - Crie uma nova conta de serviço
   - Baixe o arquivo JSON das credenciais
4. **Coloque o arquivo** na pasta `google/` com o nome `madeinlowcode.json`

### 3️⃣ **Configuração das Variáveis de Ambiente**

O arquivo `.env` já está configurado com valores padrão:

```env
# Configurações do servidor
PORT=3000
HOST=localhost

# Segurança
SESSION_SECRET=minha-chave-secreta-super-segura-para-sessoes-2025

# Pasta para armazenar os arquivos de áudio
AUDIO_DIR=./uploads

# Credenciais do Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./google/madeinlowcode.json
```

### 4️⃣ **Iniciar o Servidor**

```bash
# Iniciar o servidor em modo desenvolvimento
npm start
```

### 5️⃣ **Acessar a Aplicação**

Abra seu navegador e acesse: **http://localhost:3000**

## 🔑 Credenciais de Acesso

O sistema vem com usuários pré-configurados:

| Tipo | Usuário | Senha |
|------|---------|-------|
| **Administrador** | `admin` | `admin123` |
| **Usuário Comum** | `user` | `user123` |

## 📖 Como Usar

1. **Acesse** http://localhost:3000
2. **Faça login** com uma das credenciais acima
3. **Digite o texto** que deseja converter em áudio
4. **Selecione a voz** desejada no dropdown
5. **Clique em "Gerar Áudio"**
6. **Ouça o resultado** no player integrado
7. **Baixe o arquivo** se desejar
8. **Visualize o histórico** de áudios gerados

---

## 🛠️ **Tecnologias Utilizadas**

### **Backend**
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **express-session** - Gerenciamento de sessões
- **bcryptjs** - Criptografia de senhas
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Variáveis de ambiente

### **APIs TTS**
- **Google Cloud Text-to-Speech** - Vozes profissionais
- **Gemini 2.5 TTS** - IA avançada com controle de estilo
- **Sistema Unificado** - Gerenciamento automático

### **Frontend**
- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com gradientes
- **JavaScript Vanilla** - Interatividade
- **Font Awesome** - Ícones profissionais
- **Design Responsivo** - Mobile-first

### **Segurança**
- **Autenticação Híbrida** - Sessões + API Keys
- **Validação de Entrada** - Sanitização de dados
- **CORS Configurado** - Controle de acesso
- **Variáveis de Ambiente** - Credenciais seguras

---

## 📁 **Estrutura do Projeto**

```
api_voz_google/
├── 📁 google/                 # Credenciais do Google Cloud
│   └── madeinlowcode.json     # Arquivo de credenciais (você deve criar)
├── 📁 uploads/                # Arquivos de áudio gerados automaticamente
├── 📁 node_modules/           # Dependências (auto-gerado pelo npm)
├── 📄 server-express.js       # 🚀 Servidor principal Express
├── 📄 audio-generator.js      # 🎵 Lógica de geração de áudio (legacy)
├── 📄 users.js               # 👥 Sistema de usuários e autenticação
├── 📄 login.html             # 🔐 Página de login
├── 📄 client.html            # 🎨 Interface principal da aplicação
├── 📁 pages/                 # 📱 Novas interfaces do TTS Studio
│   ├── dashboard.html        # 📊 Dashboard principal
│   ├── gemini-studio.html    # 🎭 Geração single-speaker
│   ├── multi-speaker.html    # 👥 Geração multi-speaker
│   ├── voice-lab.html        # 🧪 Exploração de vozes
│   └── api-docs.html         # 📚 Documentação e testes da API
├── 📁 modules/               # 🔧 Módulos do sistema TTS
│   ├── tts-manager.js        # 🎯 Gerenciador TTS unificado
│   ├── gemini-tts.js         # 🎭 Cliente Gemini TTS
│   └── google-cloud-tts.js   # 🎤 Cliente Google Cloud TTS
├── 📁 api/                   # 🔗 Rotas da API v2
│   ├── gemini-routes.js      # 🎭 Endpoints principais
│   └── voice-routes.js       # 🎤 Endpoints de vozes
├── 📄 package.json           # 📦 Configurações e dependências
├── 📄 package-lock.json      # 🔒 Lock das versões das dependências
├── 📄 .env                   # ⚙️ Variáveis de ambiente
├── 📄 INICIO-RAPIDO.md       # ⚡ Guia de início rápido
├── 📄 API-TESTES.md          # 📋 Documentação dos testes da API
└── 📄 README.md              # 📖 Este arquivo de documentação
```

### 📋 **Descrição dos Arquivos Principais**

| Arquivo | Descrição | Função |
|---------|-----------|--------|
| `server-express.js` | Servidor principal | Rotas, middleware, autenticação |
| `modules/tts-manager.js` | Sistema TTS unificado | Gerencia Gemini + Google Cloud TTS |
| `modules/gemini-tts.js` | Cliente Gemini | Interface com Gemini 2.5 TTS |
| `modules/google-cloud-tts.js` | Cliente Google Cloud | Interface com Google Cloud TTS |
| `api/gemini-routes.js` | API v2 principal | Endpoints de geração de áudio |
| `api/voice-routes.js` | API de vozes | Endpoints de listagem de vozes |
| `pages/dashboard.html` | Dashboard | Visão geral do sistema |
| `pages/api-docs.html` | Documentação API | Testes e documentação interativa |
| `audio-generator.js` | Geração legacy | Interface legacy (compatibilidade) |
| `users.js` | Sistema de usuários | Autenticação e gerenciamento |
| `client.html` | Interface legacy | Página principal legacy |
| `login.html` | Página de login | Autenticação de usuários |

---

## 🎯 **Casos de Uso**

### **📱 Aplicações Mobile**
- Use API Key no backend da aplicação
- Nunca exponha credenciais no app
- Implemente cache local para otimização

### **🤖 Chatbots e Assistentes**
- Integre com Dialogflow, Rasa, etc.
- Use API Key para gerar respostas em áudio
- Combine com reconhecimento de voz

### **🔄 Automações**
- **n8n**: Workflows automatizados
- **Zapier**: Integrações no-code
- **Make.com**: Automações visuais
- **Scripts**: Python, Node.js, etc.

### **📊 Dashboards e Relatórios**
- Alertas em áudio para sistemas
- Relatórios narrados automaticamente
- Notificações sonoras personalizadas

### **🎓 Educação e Treinamento**
- Conteúdo educacional em áudio
- Pronunciação de idiomas
- Acessibilidade para deficientes visuais

---

## 🆘 **Troubleshooting Avançado**

### **❌ Erro 401 - Unauthorized**
```json
{
  "success": false,
  "error": "Não autenticado",
  "details": "Você precisa fazer login ou fornecer uma API Key válida"
}
```
**Solução**: Verifique se a API Key está correta e no header correto (`X-API-Key` ou `Authorization`).

### **❌ Erro 400 - Bad Request**
```json
{
  "success": false,
  "error": "Parâmetros inválidos",
  "details": "Os parâmetros text e voiceName são obrigatórios"
}
```
**Solução**: Verifique se todos os parâmetros obrigatórios estão presentes e válidos.

### **❌ Erro 500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Erro interno do servidor",
  "details": "Falha na comunicação com o serviço TTS"
}
```
**Solução**: Verifique as credenciais do Google Cloud, conectividade e logs do servidor.

### **❌ Servidor não inicia**
- Verifique se o Node.js 14+ está instalado
- Confirme se as dependências foram instaladas (`npm install`)
- Verifique se a porta 3003 não está em uso
- Confirme se o arquivo `.env` está configurado

### **❌ Credenciais do Google Cloud**
- Verifique se o arquivo `google/madeinlowcode.json` existe
- Confirme se a API Text-to-Speech está ativada no Google Cloud
- Verifique se a conta de serviço tem permissões adequadas

---

## 🔒 **Segurança e Boas Práticas**

### **✅ Recomendações**
- ✅ **Mantenha a API Key segura** - Não exponha em código público
- ✅ **Use HTTPS em produção** - Para proteger a transmissão
- ✅ **Rotacione a API Key** - Periodicamente para maior segurança
- ✅ **Monitore o uso** - Acompanhe logs de acesso
- ✅ **Valide entradas** - Sempre sanitize dados do usuário

### **❌ Evite**
- ❌ **API Key no frontend** - Nunca exponha em JavaScript client-side
- ❌ **Commit da API Key** - Não versione arquivos com credenciais
- ❌ **Compartilhamento desnecessário** - Limite o acesso à API Key
- ❌ **Logs com credenciais** - Não registre informações sensíveis

---

## 🔧 Scripts Disponíveis

```bash
# Iniciar o servidor
npm start

# Instalar dependências
npm install
```

## 🌐 **Rotas e Endpoints**

### 📄 **Páginas Web**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `GET` | `/` | Página inicial | ❌ | Redireciona para login ou cliente |
| `GET` | `/login.html` | Página de login | ❌ | Interface de autenticação |
| `GET` | `/client.html` | Interface principal | ✅ | Aplicação principal do usuário |
| `GET` | `/api-test.html` | Testes da API | ✅ | Ferramenta de desenvolvimento |

### 🔐 **Autenticação**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `POST` | `/auth/login` | Autenticação | ❌ | Login de usuário |
| `GET` | `/auth/logout` | Logout | ✅ | Encerrar sessão |

### 🎵 **API de Áudio v1 (Legacy)**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `GET` | `/api/voices` | Listar vozes | ❌ | Vozes disponíveis do Google TTS |
| `POST` | `/api/generate` | Gerar áudio | ✅ | Converter texto em áudio |
| `GET` | `/api/audios` | Listar áudios | ✅ | Histórico de áudios gerados |
| `GET` | `/api` | Info da API | ❌ | Informações dos endpoints |

### 🆕 **API v2 - Sistema Unificado TTS**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `GET` | `/api/v2/status` | Status dos sistemas | ❌ | Status Gemini + Google Cloud |
| `GET` | `/api/v2/voices/all` | Todas as vozes | ❌ | 73 vozes unificadas |
| `GET` | `/api/v2/voices/gemini` | Vozes Gemini | ❌ | 30 vozes com estilo |
| `GET` | `/api/v2/voices/google-cloud` | Vozes Google Cloud | ❌ | Vozes tradicionais |
| `POST` | `/api/v2/generate-single` | Single-speaker | ✅ | Gemini + controle de estilo |
| `POST` | `/api/v2/generate-multi` | Multi-speaker | ✅ | Até 2 vozes simultâneas |
| `GET` | `/api/v2/models` | Modelos TTS | ❌ | Modelos disponíveis |
| `GET` | `/api/v2/audios` | Áudios unificados | ✅ | Histórico completo |
| `GET` | `/api/v2/recommendations` | Recomendações | ❌ | Vozes por caso de uso |
| `POST` | `/api/v2/validate` | Validar requisição | ❌ | Validação de parâmetros |

### 🔍 **API de Busca de Vozes**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `GET` | `/api/voices/search` | Buscar vozes | ❌ | Busca avançada com filtros |
| `GET` | `/api/voices/categories` | Categorias | ❌ | Estilos e tipos disponíveis |
| `GET` | `/api/voices/compare` | Comparar vozes | ❌ | Comparação lado a lado |
| `GET` | `/api/voices/random` | Vozes aleatórias | ❌ | Descoberta de vozes |
| `GET` | `/api/voices/stats` | Estatísticas | ❌ | Métricas das vozes |
| `GET` | `/api/voices/favorites` | Favoritas | ❌ | Vozes recomendadas |

### 📁 **Arquivos Estáticos**
| Método | Endpoint | Descrição | Proteção | Função |
|--------|----------|-----------|----------|--------|
| `GET` | `/uploads/:filename` | Download de áudio | ❌ | Arquivos MP3 gerados |

### 🧪 **Testando os Endpoints**

Para testar os endpoints de forma interativa:
1. **Acesse**: `http://localhost:3000/api-test.html`
2. **Faça login** se necessário
3. **Use a interface** para testar cada endpoint
4. **Visualize respostas** formatadas em JSON

## 🔒 Recursos de Segurança

- ✅ **Autenticação baseada em sessões**
- ✅ **Senhas criptografadas** com bcrypt
- ✅ **Proteção de rotas** sensíveis
- ✅ **Validação de entrada** nos formulários
- ✅ **CORS configurado** adequadamente
- ✅ **Variáveis de ambiente** para dados sensíveis
- ✅ **Cookies seguros** com httpOnly

## 🎨 **Interface e Design**

### 🖥️ **Página Principal (`/client.html`)**
- **Layout expandido** (1400px) para melhor aproveitamento do espaço
- **Design em duas colunas** com cards de altura fixa (600px)
- **Grid responsivo** que se adapta a diferentes telas
- **Cards que não se encolhem** durante operações
- **Player integrado** para reprodução imediata
- **Histórico visual** dos áudios gerados
- **Navegação intuitiva** com botões de ação claros

### 🧪 **Página de Testes (`/api-test.html`)**
- **Interface de desenvolvimento** para testar endpoints
- **Layout responsivo** (1200px) com grid de 2 colunas
- **Códigos de status coloridos** para fácil identificação
- **Formatação JSON** automática das respostas
- **Loading states** visuais durante requisições
- **Validação de campos** obrigatórios
- **Navegação entre páginas** integrada

### 📱 **Responsividade**
| Dispositivo | Largura | Layout | Altura dos Cards |
|-------------|---------|--------|------------------|
| **Desktop** | > 1450px | 2 colunas (650px cada) | 600px |
| **Laptop** | 1050px - 1450px | 1 coluna (950px) | 500px |
| **Tablet** | 768px - 1050px | 1 coluna (máx 600px) | 450px |
| **Mobile** | < 768px | 1 coluna (100%) | 400px |

### 🎯 **Características do Design**
- **Cores**: Paleta Google (azul, verde, vermelho, amarelo)
- **Tipografia**: Segoe UI para interface, Courier New para código
- **Animações**: Transições suaves e hover effects
- **Acessibilidade**: Contraste adequado e navegação por teclado



## 🚀 **Desenvolvimento e Contribuição**

### 📋 **Estrutura de Desenvolvimento**
```bash
# Estrutura recomendada para desenvolvimento
api_voz_google/
├── 🧪 Testes: api-test.html + API-TESTES.md
├── 📖 Docs: README.md + INICIO-RAPIDO.md
├── 🎨 Frontend: client.html + login.html
├── ⚙️ Backend: server-express.js + módulos
└── 🔧 Config: .env + package.json
```

### 🔧 **Comandos Úteis para Desenvolvimento**
```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Verificar estrutura
tree /f

# Testar endpoints
curl http://localhost:3000/api/voices

# Verificar logs
tail -f logs/app.log  # se configurado
```

### 📊 **Métricas do Projeto**
- **Arquivos principais**: 6 (HTML, JS, MD)
- **Endpoints da API**: 8 rotas
- **Páginas web**: 3 interfaces
- **Funcionalidades**: 15+ recursos
- **Responsividade**: 4 breakpoints
- **Segurança**: 6 camadas de proteção

## 📞 **Suporte e Documentação**

### 📚 **Documentação Disponível**
- 📖 **README.md**: Documentação completa (este arquivo)
- ⚡ **INICIO-RAPIDO.md**: Guia de início rápido
- 🧪 **API-TESTES.md**: Documentação dos testes da API

### 🛠️ **Ferramentas de Debug**
- 🔬 **Página de testes**: `http://localhost:3000/api-test.html`
- 📊 **Info da API**: `http://localhost:3000/api`
- 🔍 **Console do navegador**: F12 para logs detalhados

### 💬 **Suporte Técnico**
- 🐛 **Issues**: Abra uma issue no repositório
- 📧 **Email**: Entre em contato através do email do desenvolvedor
- 📖 **Documentação**: Consulte os arquivos MD do projeto
- 🧪 **Testes**: Use a página de testes para debug

---

---

## 🎉 **TTS Studio - Projeto Completo e Pronto para Uso!**

### **✨ Sistema Profissional Completo**
- **🎭 Gemini 2.5 TTS + Google Cloud TTS** unificados
- **📱 Interfaces modernas** responsivas e intuitivas
- **🔗 APIs robustas** com autenticação híbrida
- **📚 Documentação interativa** com testes em tempo real
- **🔐 Segurança avançada** com múltiplos métodos de autenticação

### **🚀 Pronto para Produção**
- **⚡ Início rápido** em 5 minutos
- **🔧 Fácil integração** com n8n, Zapier, scripts
- **📊 Monitoramento** completo via dashboard
- **🧪 Testes integrados** para desenvolvimento
- **📖 Documentação completa** e exemplos práticos

### **🎯 Casos de Uso Suportados**
- **📱 Aplicações mobile** e web
- **🤖 Chatbots** e assistentes virtuais
- **🔄 Automações** e workflows
- **📊 Dashboards** e relatórios narrados
- **🎓 Educação** e acessibilidade

### **📞 Suporte e Recursos**
- **📚 Documentação**: Completa e atualizada
- **🧪 Testes**: Interface interativa em `/pages/api-docs.html`
- **💻 Exemplos**: Python, JavaScript, n8n, Zapier
- **🆘 Troubleshooting**: Guias detalhados de solução

---

## 📋 **Links Rápidos**

- **🌐 Aplicação**: http://localhost:3003
- **📊 Dashboard**: http://localhost:3003/pages/dashboard.html
- **📚 API Docs**: http://localhost:3003/pages/api-docs.html
- **🎭 Gemini Studio**: http://localhost:3003/pages/gemini-studio.html
- **👥 Multi-Speaker**: http://localhost:3003/pages/multi-speaker.html
- **🧪 Voice Lab**: http://localhost:3003/pages/voice-lab.html

---

**🎤 TTS Studio - Transformando texto em áudio com IA avançada!**

**Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento web e IA.**
