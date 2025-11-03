# DocAI - Preenchimento Inteligente de Contratos

Sistema de preenchimento automático de contratos usando IA Claude 3.5 Sonnet.

## 🎯 Funcionalidades

- **Upload de Múltiplos Formatos**: PDF, Word (.docx, .doc), Imagens (JPG, PNG, GIF, WEBP)
- **Detecção Automática de Campos**: IA identifica automaticamente campos a preencher
- **Formulário Dinâmico**: Interface gerada automaticamente baseada nos campos detectados
- **Geração de PDF**: Documento final mantém formatação original do template
- **Interface Intuitiva**: Drag & drop, preview e validação

## 🚀 Stack Técnico

### Frontend
- React 18.3.1
- Vite 5.4.11
- CSS vanilla (gradient design)

### Backend
- Node.js + Express 4.21.1
- Claude 3.5 Sonnet API (@anthropic-ai/sdk 0.32.1)
- pdf-lib 1.17.1 (geração de PDF)
- mammoth 1.8.0 (leitura de Word)
- multer 1.4.5 (upload de arquivos)

## 📦 Instalação

### Frontend
```bash
cd /Users/euclidesgomes/Documents/Claude/projects/experimental/docai
npm install
```

### Backend
```bash
cd server
npm install
cp .env.example .env
# Editar .env e adicionar ANTHROPIC_API_KEY
```

## 🔧 Configuração

### Variáveis de Ambiente (server/.env)

```env
PORT=3003
ANTHROPIC_API_KEY=seu_api_key_aqui
```

## 🏃 Execução Local

### Terminal 1 - Backend
```bash
cd server
npm start
# API rodando em http://localhost:3003
```

### Terminal 2 - Frontend
```bash
npm run dev
# Interface em http://localhost:5174/docai/
```

## 🌐 Ambientes

### Desenvolvimento
- **Frontend**: https://dev.lusio.market/docai/
- **API**: https://dev.lusio.market/docai-api/ (proxy para localhost:3003)
- **PM2**: `docai-api-dev`

### Produção
- **Frontend**: https://lusio.market/docai/
- **API**: https://lusio.market/docai-api/
- **PM2**: `docai-api`

## 📋 Fluxo de Uso

1. **Upload**: Usuário faz upload do contrato (PDF/Word/Imagem)
2. **Análise**: IA Claude analisa e detecta campos editáveis
3. **Formulário**: Sistema exibe formulário dinâmico com campos detectados
4. **Preenchimento**: Usuário preenche ou edita os dados
5. **Geração**: IA gera PDF preenchido mantendo template original
6. **Download**: Usuário baixa documento pronto

## 🔍 Campos Detectados Automaticamente

A IA detecta campos como:
- Nome completo
- NIF / Número de documento
- Título de residência
- Data de nascimento
- Endereço completo
- Telefone / Email
- Estado civil
- Profissão
- E outros campos personalizados do documento

## 📡 API Endpoints

### POST /api/analyze-document
Analisa documento e extrai campos

**Request:**
- `Content-Type: multipart/form-data`
- `file`: arquivo do documento

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "1234567890",
    "documentType": "Contrato de Arrendamento",
    "originalFileName": "contrato.pdf",
    "fields": [
      {
        "fieldName": "nome_completo",
        "label": "Nome Completo",
        "type": "text",
        "placeholder": "João Silva",
        "required": true,
        "position": "parágrafo 1"
      }
    ],
    "originalDocument": {
      "buffer": "base64...",
      "mimetype": "application/pdf"
    }
  }
}
```

### POST /api/generate-document
Gera documento preenchido

**Request:**
```json
{
  "originalDocument": {
    "buffer": "base64...",
    "mimetype": "application/pdf"
  },
  "fields": [...],
  "formData": {
    "nome_completo": "João Silva",
    "nif": "123456789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdfBase64": "base64...",
    "text": "texto do documento preenchido"
  }
}
```

## 🎨 Design

- Gradiente moderno (roxo-azul)
- Upload drag & drop
- Formulários responsivos
- Loading states com spinner
- Badges de formatos suportados
- Animações suaves (fadeIn)

## ⚙️ Configuração Nginx (Desenvolvimento)

```nginx
# Frontend
location /docai/ {
    alias /var/www/dev/docai/dist/;
    try_files $uri $uri/ /docai/index.html;
}

# API
location /docai-api/ {
    client_max_body_size 32M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    rewrite ^/docai-api/(.*) /$1 break;
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🚨 Limitações e Notas

- **Tamanho máximo**: 32MB por arquivo
- **Timeout**: 300s (5 minutos) para processamento com IA
- **Rate limit**: Dependente da API do Claude
- **Formatos PDF**: Funciona melhor com PDFs editáveis; PDFs escaneados são convertidos para imagem
- **Word**: Apenas formatos modernos (.docx) suportados via mammoth

## 📝 Logs e Debugging

```bash
# Ver logs do PM2 (dev)
ssh root@72.61.165.88 'pm2 logs docai-api-dev'

# Ver logs do Nginx
ssh root@72.61.165.88 'tail -f /var/log/nginx/error.log | grep docai'

# Testar API diretamente
curl http://localhost:3003/api/health
```

## 🔐 Segurança

- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho (32MB)
- ✅ CORS configurado
- ✅ Nenhum arquivo armazenado no servidor
- ✅ Processamento em memória
- ⚠️ API key em variável de ambiente

## 📚 Dependências Principais

```json
{
  "frontend": {
    "react": "^18.3.1",
    "vite": "^5.4.11"
  },
  "backend": {
    "@anthropic-ai/sdk": "^0.32.1",
    "express": "^4.21.1",
    "pdf-lib": "^1.17.1",
    "mammoth": "^1.8.0",
    "multer": "^1.4.5-lts.1"
  }
}
```

## 🎯 Roadmap

- [ ] Suporte a múltiplos documentos simultâneos
- [ ] Templates salvos
- [ ] Histórico de documentos processados
- [ ] Assinatura digital
- [ ] Export para Word (.docx)
- [ ] OCR aprimorado para PDFs escaneados
- [ ] Preview do documento antes de download
- [ ] Modo escuro

---

**Versão**: 1.0.0
**Status**: Desenvolvimento
**Criado**: 03 Novembro 2025
**Mantido por**: Euclides Gomes + Claude Code
