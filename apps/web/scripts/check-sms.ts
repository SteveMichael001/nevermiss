import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

async function check() {
  const msg = await client.messages('SM059503abb99074bc7833b674bd5966b7').fetch()
  console.log('Status:', msg.status)
  console.log('Error code:', msg.errorCode)
  console.log('Error message:', msg.errorMessage)
  console.log('From:', msg.from)
  console.log('To:', msg.to)
  console.log('Date sent:', msg.dateSent)
}

check()
