import twilio from 'twilio'

const twilioSid = process.env.TWILIO_ACCOUNT_SID!
const twilioToken = process.env.TWILIO_AUTH_TOKEN!
const twilioFrom = process.env.TWILIO_PHONE_NUMBER!
const testTo = '+16099771254' // Steve's phone

async function testSendSMS() {
  console.log('📱 Testing SMS send...')
  const client = twilio(twilioSid, twilioToken)
  
  try {
    const message = await client.messages.create({
      body: '🧪 NeverMiss test: SMS functionality confirmed working.',
      from: twilioFrom,
      to: testTo
    })
    console.log('✅ SMS sent!')
    console.log('   SID:', message.sid)
    console.log('   Status:', message.status)
    console.log('   To:', testTo)
    return true
  } catch (err: any) {
    console.log('❌ SMS send failed:', err.message)
    return false
  }
}

testSendSMS()
