import { useState } from 'react'
import DocumentUpload from './components/DocumentUpload'
import DocumentForm from './components/DocumentForm'
import Result from './components/Result'

function App() {
  const [step, setStep] = useState('upload') // 'upload', 'form', 'result'
  const [analysisData, setAnalysisData] = useState(null)
  const [generatedPdf, setGeneratedPdf] = useState(null)

  const handleDocumentAnalyzed = (data) => {
    setAnalysisData(data)
    setStep('form')
  }

  const handleFormSubmit = (pdfData) => {
    setGeneratedPdf(pdfData)
    setStep('result')
  }

  const handleReset = () => {
    setStep('upload')
    setAnalysisData(null)
    setGeneratedPdf(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>DocAI</h1>
        <p>Preenchimento Inteligente de Contratos com IA</p>
      </header>

      <div className="container">
        {step === 'upload' && (
          <DocumentUpload onAnalyzed={handleDocumentAnalyzed} />
        )}

        {step === 'form' && analysisData && (
          <DocumentForm
            analysisData={analysisData}
            onSubmit={handleFormSubmit}
            onCancel={handleReset}
          />
        )}

        {step === 'result' && generatedPdf && (
          <Result
            pdfData={generatedPdf}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  )
}

export default App
