import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Loading page...')

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

      <h2>Backend Status</h2>
      <p>{message}</p>
    </div>
  )
}

export default App