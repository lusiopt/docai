import { useState } from 'react'
import { generateDocument } from '../services/apiService'

function DocumentForm({ analysisData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsGenerating(true)

    try {
      const result = await generateDocument({
        originalDocument: analysisData.originalDocument,
        fields: analysisData.fields,
        formData
      })
      onSubmit(result)
    } catch (err) {
      setError(err.message || 'Erro ao gerar documento')
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '10px' }}>
          Gerando documento preenchido...
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          A IA está preenchendo os campos no template original
        </p>
        <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '10px' }}>
          Isso pode levar até 30-60 segundos
        </p>
      </div>
    )
  }

  return (
    <div className="form-container">
      <div className="document-info">
        <h3>{analysisData.documentType}</h3>
        <p className="filename">📄 {analysisData.originalFileName}</p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
          {analysisData.fields.length} campo{analysisData.fields.length !== 1 ? 's' : ''} detectado{analysisData.fields.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {analysisData.fields.map((field, index) => (
          <div key={index} className="form-group">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
              {field.position && (
                <span className="field-position">
                  {field.position}
                </span>
              )}
            </label>
            <input
              type={field.type || 'text'}
              placeholder={field.placeholder}
              defaultValue={field.placeholder}
              required={field.required}
              onChange={(e) => handleChange(field.fieldName, e.target.value)}
            />
            {field.hint && (
              <p className="field-hint">{field.hint}</p>
            )}
          </div>
        ))}

        <div className="button-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Gerar Documento
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocumentForm
