import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { PDFDocument } from 'pdf-lib'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Configurar CORS
app.use(cors())
app.use(express.json())

// Configurar upload de arquivos (32MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 32 * 1024 * 1024 }
})

// Tipos de documentos suportados
const SUPPORTED_TYPES = {
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/msword': 'document',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image'
}

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DocAI API',
    version: '1.0.0'
  })
})

// Rota principal: analisar documento e extrair campos
app.post('/api/analyze-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      })
    }

    // Validar tipo de arquivo
    if (!SUPPORTED_TYPES[req.file.mimetype]) {
      return res.status(400).json({
        success: false,
        message: `Tipo de arquivo não suportado: ${req.file.mimetype}`
      })
    }

    console.log(`📄 Analisando documento: ${req.file.originalname} (${req.file.mimetype})`)

    // Preparar conteúdo para Claude API
    let contentBlocks = []
    let documentText = ''

    // Processar baseado no tipo
    if (req.file.mimetype.includes('word') || req.file.mimetype === 'application/msword') {
      // Extrair texto de Word usando mammoth
      const result = await mammoth.extractRawText({ buffer: req.file.buffer })
      documentText = result.value

      contentBlocks.push({
        type: 'text',
        text: `Analise este contrato e extraia os campos que precisam ser preenchidos:\n\n${documentText}`
      })
    } else if (req.file.mimetype === 'application/pdf') {
      // Para PDF, enviar como documento binário
      const base64Data = req.file.buffer.toString('base64')
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data
        }
      })
    } else {
      // Para imagens
      const base64Data = req.file.buffer.toString('base64')
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: req.file.mimetype,
          data: base64Data
        }
      })
    }

    // Prompt para Claude analisar o documento
    const prompt = `Você é um assistente especializado em análise de contratos e documentos legais.

Analise o documento fornecido e identifique TODOS os campos que precisam ser preenchidos ou editados.

Para cada campo identificado, retorne um objeto JSON com:
- "fieldName": nome do campo (ex: "nome_completo", "nif", "endereco")
- "label": rótulo amigável para exibir no formulário (ex: "Nome Completo", "NIF", "Endereço")
- "type": tipo do campo ("text", "date", "number", "email", "tel")
- "placeholder": valor atual no documento (se houver) ou exemplo
- "required": true se o campo é obrigatório
- "position": posição aproximada no documento (ex: "parágrafo 1", "cláusula 3")

IMPORTANTE:
- Identifique campos como: nome, NIF, título de residência, data de nascimento, endereço, telefone, email, etc.
- Se o campo já tiver um valor no documento, inclua-o no "placeholder"
- Se houver marcadores como [NOME], ___________, ou campos vazios, identifique-os
- Retorne APENAS o JSON, sem explicações adicionais

Formato esperado:
{
  "documentType": "tipo do documento (ex: Contrato de Arrendamento, Procuração, etc)",
  "fields": [
    {
      "fieldName": "nome_completo",
      "label": "Nome Completo",
      "type": "text",
      "placeholder": "João Silva",
      "required": true,
      "position": "parágrafo 1"
    }
  ]
}`

    // Fazer chamada para Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: contentBlocks.concat([{ type: 'text', text: prompt }])
        }
      ]
    })

    // Extrair resposta JSON da Claude
    const responseText = message.content[0].text
    console.log('📊 Resposta da Claude:', responseText.substring(0, 500))

    // Tentar extrair JSON da resposta
    let analysisData
    try {
      // Tentar parse direto
      analysisData = JSON.parse(responseText)
    } catch (e) {
      // Se falhar, tentar extrair JSON de dentro de markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1])
      } else {
        throw new Error('Não foi possível extrair dados estruturados da análise')
      }
    }

    // Salvar documento original temporariamente (para gerar PDF preenchido depois)
    const documentId = Date.now().toString()

    res.json({
      success: true,
      data: {
        documentId,
        documentType: analysisData.documentType || 'Documento',
        originalFileName: req.file.originalname,
        fields: analysisData.fields || [],
        originalDocument: {
          buffer: req.file.buffer.toString('base64'),
          mimetype: req.file.mimetype
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro ao analisar documento:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao analisar documento'
    })
  }
})

// Rota para gerar documento preenchido
app.post('/api/generate-document', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { originalDocument, fields, formData } = req.body

    if (!originalDocument || !fields || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos para gerar documento'
      })
    }

    console.log('📝 Gerando documento preenchido...')

    // Reconstruir buffer do documento original
    const documentBuffer = Buffer.from(originalDocument.buffer, 'base64')

    // Criar prompt para Claude preencher o documento
    let contentBlocks = []

    if (originalDocument.mimetype === 'application/pdf') {
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: originalDocument.buffer
        }
      })
    } else if (originalDocument.mimetype.includes('image')) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: originalDocument.mimetype,
          data: originalDocument.buffer
        }
      })
    }

    // Construir texto com os dados preenchidos
    let fieldsText = 'DADOS PARA PREENCHER NO DOCUMENTO:\n\n'
    fields.forEach(field => {
      const value = formData[field.fieldName] || field.placeholder || ''
      fieldsText += `${field.label}: ${value}\n`
    })

    const prompt = `${fieldsText}

Analise o documento original e retorne o texto COMPLETO do documento com os campos acima preenchidos.

IMPORTANTE:
- Mantenha TODA a formatação e estrutura original
- Substitua apenas os campos identificados pelos valores fornecidos
- Mantenha todas as cláusulas, parágrafos e formatação
- Retorne o documento completo em texto simples`

    contentBlocks.push({
      type: 'text',
      text: prompt
    })

    // Gerar documento preenchido com Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: contentBlocks
        }
      ]
    })

    const filledDocumentText = message.content[0].text

    // Gerar PDF com pdf-lib
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4

    const { width, height } = page.getSize()
    const fontSize = 12
    const margin = 50
    let y = height - margin

    // Quebrar texto em linhas
    const lines = filledDocumentText.split('\n')

    for (const line of lines) {
      if (y < margin) {
        // Nova página se necessário
        const newPage = pdfDoc.addPage([595.28, 841.89])
        y = newPage.getSize().height - margin
      }

      page.drawText(line || ' ', {
        x: margin,
        y: y,
        size: fontSize
      })

      y -= fontSize + 4
    }

    const pdfBytes = await pdfDoc.save()

    res.json({
      success: true,
      data: {
        pdfBase64: Buffer.from(pdfBytes).toString('base64'),
        text: filledDocumentText
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar documento:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar documento'
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 DocAI API rodando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`)
})
