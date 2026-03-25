import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading page...')
  const [selectedScenario, setSelectedScenario] = useState('missing-field')

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health')
        const data = await response.json()
        setMessage(data.message)
      } catch (error) {
        setMessage('Error connecting to backend')
        console.error(error)
      }
    }

    fetchHealth()
  }, [])

  return (
    <div className="app">
      <h1>Interactive Payment API Debugger</h1>
      <p>Select a scenario and inspect the request/response.</p>

      <section className="status-section">
        <h2>Backend Status</h2>
        <p>{message}</p>
      </section>

      <section className="controls-section">
        <h2>Scenario</h2>

        <label htmlFor="scenario-select">Choose a debugging scenario:</label>
        <select
          id="scenario-select"
          value={selectedScenario}
          onChange={(e) => setSelectedScenario(e.target.value)}
        >
          <option value="missing-field">Missing required field</option>
          <option value="invalid-auth">Invalid auth key</option>
          <option value="idempotency">Idempotency issue</option>
          <option value="timeout">Timeout</option>
        </select>

        <button type="button">Send Request</button>
      </section>

      <section className="output-section">
        <h2>Request</h2>
        <pre>{`{}`}</pre>

        <h2>Response</h2>
        <pre>{`No response yet`}</pre>

        <h2>Error</h2>
        <pre>{`No error yet`}</pre>
      </section>
    </div>
  )
}

export default App