const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'

export async function analyzeDocument(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/analyze-document`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao analisar documento')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error('Erro ao extrair campos do documento')
    }

    return result.data

  } catch (error) {
    console.error('Erro ao analisar documento:', error)
    throw error
  }
}

export async function generateDocument(data) {
  try {
    const response = await fetch(`${API_URL}/api/generate-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao gerar documento')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error('Erro ao gerar documento preenchido')
    }

    return result.data

  } catch (error) {
    console.error('Erro ao gerar documento:', error)
    throw error
  }
}
