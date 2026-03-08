import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

async function check() {
  console.log('📞 Current phone numbers in account:\n')
  
  const numbers = await client.incomingPhoneNumbers.list()
  numbers.forEach(n => {
    console.log(`  ${n.phoneNumber}`)
    console.log(`    Type: ${n.phoneNumber.startsWith('+1800') || n.phoneNumber.startsWith('+1888') || n.phoneNumber.startsWith('+1877') || n.phoneNumber.startsWith('+1866') || n.phoneNumber.startsWith('+1855') || n.phoneNumber.startsWith('+1844') || n.phoneNumber.startsWith('+1833') ? 'Toll-Free' : 'Local'}`)
    console.log(`    SMS: ${n.capabilities.sms}`)
    console.log(`    Voice: ${n.capabilities.voice}`)
    console.log('')
  })
  
  console.log('\n📱 Available Toll-Free numbers to purchase:\n')
  const available = await client.availablePhoneNumbers('US').tollFree.list({ limit: 5 })
  available.forEach(n => {
    console.log(`  ${n.phoneNumber} (${n.locality || 'Toll-Free'})`)
  })
  
  console.log('\n💰 Toll-Free pricing: ~$2/month + $0.0079/SMS')
}

check().catch(console.error)
