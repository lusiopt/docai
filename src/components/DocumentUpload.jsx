import { useState } from 'react'
import { analyzeDocument } from '../services/apiService'

function DocumentUpload({ onAnalyzed }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError(`Tipo de arquivo não suportado: ${file.name}\n\nFormatos aceitos: PDF, Word, JPG, PNG, GIF, WEBP`)
      return false
    }
    if (file.size > 32 * 1024 * 1024) {
      setError(`Arquivo muito grande: ${file.name}\n\nTamanho máximo: 32MB`)
      return false
    }
    return true
  }

  const processFile = async (file) => {
    if (!validateFile(file)) return

    setSelectedFile(file)
    setError(null)
    setIsLoading(true)

    try {
      const result = await analyzeDocument(file)
      onAnalyzed(result)
    } catch (err) {
      setError(err.message || 'Erro ao analisar documento')
      setIsLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '10px' }}>
          Analisando documento com IA...
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          {selectedFile && `${selectedFile.name} • `}
          Detectando campos para preenchimento
        </p>
        <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '10px' }}>
          Isso pode levar até 30-60 segundos
        </p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <label htmlFor="file-input">
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📑</div>
          <h2>Arraste seu contrato aqui</h2>
          <p>ou clique para selecionar o arquivo</p>
          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666' }}>
            A IA irá detectar automaticamente os campos que precisam ser preenchidos
          </p>

          <div className="format-badges">
            <span className="format-badge">📄 PDF</span>
            <span className="format-badge">📝 Word</span>
            <span className="format-badge">🖼️ JPG</span>
            <span className="format-badge">🖼️ PNG</span>
            <span className="format-badge">🎨 GIF</span>
            <span className="format-badge">🌐 WEBP</span>
          </div>

          <p style={{ marginTop: '15px', fontSize: '0.75rem', color: '#999' }}>
            Tamanho máximo: 32MB
          </p>
        </div>
      </label>

      <input
        id="file-input"
        type="file"
        accept=".pdf,.doc,.docx,image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
      />
    </div>
  )
}

export default DocumentUpload
