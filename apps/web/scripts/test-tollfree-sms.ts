import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
const tollFree = process.env.TWILIO_SMS_NUMBER || '+18339015846'
const testTo = '+16099771254'

async function test() {
  console.log(`📱 Sending SMS from toll-free ${tollFree}...`)
  
  const message = await client.messages.create({
    body: '✅ NeverMiss: Toll-free SMS working!',
    from: tollFree,
    to: testTo
  })
  
  console.log('Sent! SID:', message.sid)
  console.log('Status:', message.status)
  
  // Wait and check status
  await new Promise(r => setTimeout(r, 3000))
  const updated = await client.messages(message.sid).fetch()
  console.log('Updated status:', updated.status)
  console.log('Error code:', updated.errorCode || 'none')
}

test().catch(console.error)
