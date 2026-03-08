import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

async function buyTollFree() {
  console.log('🛒 Purchasing toll-free number...\n')
  
  // Find available toll-free
  const available = await client.availablePhoneNumbers('US').tollFree.list({ 
    smsEnabled: true,
    voiceEnabled: true,
    limit: 1 
  })
  
  if (available.length === 0) {
    console.log('❌ No toll-free numbers available')
    return
  }
  
  const number = available[0].phoneNumber
  console.log(`Found: ${number}`)
  
  // Purchase it
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: number,
    friendlyName: 'NeverMiss SMS'
  })
  
  console.log('\n✅ Purchased successfully!')
  console.log(`   Number: ${purchased.phoneNumber}`)
  console.log(`   SID: ${purchased.sid}`)
  console.log(`   SMS: ${purchased.capabilities.sms}`)
  console.log(`   Voice: ${purchased.capabilities.voice}`)
  console.log('\n📝 Next: Add this to Vercel as TWILIO_SMS_NUMBER')
}

buyTollFree().catch(console.error)
