import { useEffect, useState } from 'react'
import './App.css'

type DebugResult = {
  status?: number
  request: unknown
  headers?: unknown
  response: unknown
  error: unknown
}

function getHeadersPreview(selectedScenario: string) {
  if (selectedScenario === 'missing-payment-method') {
    return {
      Authorization: 'Bearer sk_test_1234...',
      'Content-Type': 'application/json',
    }
  }

  if (selectedScenario === 'invalid-api-key') {
    return {
      Authorization: 'Bearer sk_test_invalid_key',
      'Content-Type': 'application/json',
    }
  }

  if (selectedScenario === 'idempotency') {
    return {
      Authorization: 'Bearer sk_test_1234...',
      'Content-Type': 'application/json',
      'Idempotency-Key': 'demo-key-123',
    }
  }

  if (selectedScenario === 'timeout') {
    return {
      Authorization: 'Bearer sk_test_1234...',
      'Content-Type': 'application/json',
    }
  }

  return {}
}

function getRequestPreview(selectedScenario: string) {
  if (selectedScenario === 'missing-payment-method') {
    return {
      amount: 2000,
      currency: 'usd',
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    }
  }

  if (selectedScenario === 'invalid-api-key') {
    return {
      amount: 2000,
      currency: 'usd',
      apiKey: 'sk_test_invalid_key',
    }
  }

  if (selectedScenario === 'idempotency') {
    return {
      amount: 2000,
      currency: 'usd',
      confirm: true,
      payment_method: 'pm_card_visa',
      idempotencyKey: 'demo-key-123',
    }
  }

  if (selectedScenario === 'timeout') {
    return {
      amount: 2000,
      currency: 'usd',
      simulatedDelayMs: 5000,
    }
  }

  return {}
}

function getScenarioDescription(selectedScenario: string) {
  if (selectedScenario === 'missing-payment-method') {
    return 'This scenario simulates confirming a Payment Intent without sending a payment method.'
  }

  if (selectedScenario === 'invalid-api-key') {
    return 'This scenario will simulate a request made with invalid Stripe credentials.'
  }

  if (selectedScenario === 'idempotency') {
    return 'This scenario will demonstrate how reusing an idempotency key can affect request behavior.'
  }

  if (selectedScenario === 'timeout') {
    return 'This scenario simulates a delayed or timed-out upstream payment request. Warning: this will intentionally delay the response for several seconds to demonstrate timeout handling.'
  }

  return 'Select a scenario to inspect the request and debug behavior.'
}

function getDebugExplanation(selectedScenario: string, debugResult: DebugResult | null) {
  if (!debugResult) {
    return 'Run a scenario to see how to investigate the issue.'
  }

  if (selectedScenario === 'missing-payment-method') {
    return 'This failure happens because the payment was confirmed before a payment method was attached. Confirm whether the frontend collected a payment method successfully, if the backend received it, and if the confirmation request included it in the expected format.'
  }

  if (selectedScenario === 'invalid-api-key') {
    return 'This error message points to an authentication problem rather than a bad request payload. Verify which API key is being used, confirm whether the environment is test or live mode, and make sure the backend is loading the correct credentials from environment variables.'
  }

  if (selectedScenario === 'idempotency') {
    return 'This failure happens when the same idempotency key is reused for a different request. Confirm if retry logic is incorrectly reusing keys, whether the request body changed between attempts, and if the client is generating unique keys for distinct operations.'
  }

  if (selectedScenario === 'timeout') {
    return 'This error suggests the upstream service took too long to respond. Look at request timing, retry behavior, logs around the outgoing API call, and whether the issue is caused by the provider, the network, or our own timeout settings.'
  }

  return 'Run a scenario to see how to investigate the issue.'
}

function App() {
  const [message, setMessage] = useState('Loading page...')
  const [selectedScenario, setSelectedScenario] = useState('missing-payment-method')
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)

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

   const handleSendRequest = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/debug-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario: selectedScenario }),
      })

      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      console.error(error)
      setDebugResult({
        request: null,
        response: null,
        error: {
          message: 'Failed to reach backend',
        },
      })
    }
  }

  return (
    <div className="app">
      <h1>Interactive Payment API Debugger</h1>
      <p>
        This interactive demo simulates real-world payment integration failures.
        Select a scenario to inspect the request, analyze the response, and see how to debug the issue.
      </p>

      <section className="controls-section">
        <h2>Scenario</h2>

        <label htmlFor="scenario-select">Choose a debugging scenario:</label>
        <select
          id="scenario-select"
          value={selectedScenario}
          onChange={(e) => {
            setSelectedScenario(e.target.value)
            setDebugResult(null)
          }}
        >
          <option value="missing-payment-method">Missing required field</option>
          <option value="invalid-api-key">Invalid API key</option>
          <option value="idempotency">Idempotency issue</option>
          <option value="timeout">Timeout</option>
        </select>

        <button type="button" onClick={handleSendRequest}>Send Request</button>
        <p style={{ marginTop: '1rem' }}>{getScenarioDescription(selectedScenario)}</p>
      </section>

      <section className="output-section">
        <h2>Headers</h2>
        <pre>
          {JSON.stringify(
            debugResult?.headers ?? getHeadersPreview(selectedScenario),
            null,
            2
          )}
        </pre>
        <h2>Status Code</h2>
        <pre>{debugResult?.status ?? 'NA'}</pre>

        <h2>Request Payload</h2>
        <pre>
          {JSON.stringify(
            debugResult?.request ?? getRequestPreview(selectedScenario),
            null,
            2
          )}
        </pre>

        <h2>Response</h2>
        <pre>
          {debugResult
            ? debugResult.response === null
              ? 'No response body returned.'
              : JSON.stringify(debugResult.response, null, 2)
            : 'Run this scenario to see the API response.'}
        </pre>

        <h2>Error</h2>
        <pre>
          {debugResult
            ? JSON.stringify(debugResult.error, null, 2)
            : 'Send Request to see the resulting error.'}
        </pre>

        <h2>Debug Explanation</h2>
        <pre>{getDebugExplanation(selectedScenario, debugResult)}</pre>


        <section className="status-section">
        <h2>Backend Status</h2>
        <p>{message}</p>
      </section>

      </section>
    </div>
  )
}

export default App