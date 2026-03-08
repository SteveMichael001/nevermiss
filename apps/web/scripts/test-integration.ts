import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const twilioSid = process.env.TWILIO_ACCOUNT_SID!
const twilioToken = process.env.TWILIO_AUTH_TOKEN!

async function testDatabase() {
  console.log('\n📊 Testing Supabase connection...')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, twilio_phone_number')
    .limit(3)
  
  if (bizError) {
    console.log('❌ Businesses query failed:', bizError.message)
    return false
  }
  console.log('✅ Businesses table:', businesses?.length, 'records found')
  businesses?.forEach(b => console.log(`   - ${b.name} (${b.twilio_phone_number})`))
  
  const { data: calls, error: callError } = await supabase
    .from('calls')
    .select('id, caller_name, created_at')
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (callError) {
    console.log('❌ Calls query failed:', callError.message)
    return false
  }
  console.log('✅ Calls table:', calls?.length, 'recent records')
  calls?.forEach(c => console.log(`   - ${c.caller_name || 'Unknown'} @ ${c.created_at}`))
  
  return true
}

async function testTwilioSMS() {
  console.log('\n📱 Testing Twilio connection...')
  const client = twilio(twilioSid, twilioToken)
  
  try {
    const account = await client.api.accounts(twilioSid).fetch()
    console.log('✅ Twilio connected:', account.friendlyName)
    console.log('   Status:', account.status)
    
    const numbers = await client.incomingPhoneNumbers.list({ limit: 1 })
    if (numbers.length > 0) {
      console.log('✅ Phone number:', numbers[0].phoneNumber)
    }
    return true
  } catch (err: any) {
    console.log('❌ Twilio failed:', err.message)
    return false
  }
}

async function main() {
  console.log('🧪 NeverMiss Integration Tests')
  console.log('================================')
  
  const dbOk = await testDatabase()
  const smsOk = await testTwilioSMS()
  
  console.log('\n================================')
  console.log('Results:')
  console.log(`  Database: ${dbOk ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Twilio:   ${smsOk ? '✅ PASS' : '❌ FAIL'}`)
}

main().catch(console.error)
