import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Stripe from 'stripe'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running' })
})

app.post('/api/debug-payment', async (req, res) => {
  const { scenario } = req.body
  // missing payment_method scenario
  if (scenario === 'missing-payment-method') {
    const requestPayload = {
      amount: 2000,
      currency: 'usd',
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      // intentionally missing payment_method
    }

    const headers = {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY?.slice(0, 12)}...`,
      'Content-Type': 'application/json',
    }
    
    try {
      const paymentIntent = await stripe.paymentIntents.create(requestPayload as any)

      return res.json({
        request: requestPayload,
        headers,
        response: paymentIntent,
        error: null,
      })
    } catch (error: any) {
      return res.status(400).json({
        status: 400,
        request: requestPayload,
        headers,
        response: null,
        error: {
          type: error.type,
          message: error.message,
        },
      })
    }
  }

  // invalid authentication scenario
  if (scenario === 'invalid-api-key') {
    const requestPayload = {
      amount: 2000,
      currency: 'usd',
    }

    try {
      const badStripe = new Stripe('sk_test_invalid_key')

      const paymentIntent = await badStripe.paymentIntents.create(requestPayload as any)

      return res.json({
        status: 200,
        request: requestPayload,
        response: paymentIntent,
        error: null,
      })
    } catch (error: any) {
      return res.status(401).json({
        status: 401,
        request: requestPayload,
        response: null,
        error: {
          type: error.type,
          message: error.message,
        },
      })
    }
  }

  // idempotency issue scenario
  if (scenario === 'idempotency') {
    const idempotencyKey = 'demo-key-123'

    const firstRequestPayload = {
      amount: 2000,
      currency: 'usd',
      confirm: false,
    }

    const secondRequestPayload = {
      amount: 3000,
      currency: 'usd',
      confirm: false,
    }

    try {
      await stripe.paymentIntents.create(firstRequestPayload as any, {
        idempotencyKey,
      })

      const secondResponse = await stripe.paymentIntents.create(secondRequestPayload as any, {
        idempotencyKey,
      })

      return res.json({
        status: 200,
        request: secondRequestPayload,
        response: secondResponse,
        error: null,
      })
    } catch (error: any) {
      return res.status(409).json({
        status: 409,
        request: {
          firstRequest: firstRequestPayload,
          secondRequest: secondRequestPayload,
          idempotencyKey,
        },
        response: null,
        error: {
          type: error.type,
          message: error.message,
        },
      })
    }
  }

  // timeout scenario
  if (scenario === 'timeout') {
    const requestPayload = {
      amount: 2000,
      currency: 'usd',
      simulatedDelayMs: 5000,
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))

    return res.status(504).json({
      status: 504,
      request: requestPayload,
      response: null,
      error: {
        type: 'UpstreamTimeoutError',
        message: 'The upstream payment service did not respond within the expected time.',
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