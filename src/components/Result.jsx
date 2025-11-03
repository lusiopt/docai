function Result({ pdfData, onReset }) {
  const handleDownload = () => {
    // Converter base64 para blob e fazer download
    const byteCharacters = atob(pdfData.pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Contrato_Preenchido_${new Date().getTime()}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    // Abrir PDF em nova aba
    const byteCharacters = atob(pdfData.pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })

    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="result-container">
      <div className="success-icon">✅</div>
      <h2>Documento Gerado com Sucesso!</h2>
      <p>Seu contrato foi preenchido e está pronto para download.</p>

      <div className="button-group">
        <button
          className="btn btn-secondary"
          onClick={handlePreview}
        >
          Visualizar PDF
        </button>
        <button
          className="btn btn-primary"
          onClick={handleDownload}
        >
          Baixar Documento
        </button>
      </div>

      <button
        className="btn btn-secondary"
        onClick={onReset}
        style={{ marginTop: '20px', width: '100%' }}
      >
        Processar Outro Documento
      </button>
    </div>
  )
}

export default Result
