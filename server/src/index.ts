import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running' })
})

app.post('/api/debug-payment', (req, res) => {
  const { scenario } = req.body

  if (scenario === 'missing-field') {
    return res.status(400).json({
      request: {
        amount: 2000,
        currency: 'usd',
      },
      response: null,
      error: {
        type: 'validation_error',
        message: 'Missing required field: payment_method',
      },
    })
  }

  return res.json({
    request: {
      scenario,
    },
    response: {
      message: 'Scenario received successfully',
    },
    error: null,
  })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})