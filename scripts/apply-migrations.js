const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://hczklwevoipzxzzspfuz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.log('Note: Running migration with anon key. For full admin access, set SUPABASE_SERVICE_KEY environment variable.')
}

// Use service key if available, otherwise use anon key
const supabaseKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjemtsd2V2b2lwenh6enNwZnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNTA1NjgsImV4cCI6MjA4MDcyNjU2OH0.o1Ai_EAhygpwvcKr2dhlCNgcRTQP6GJM3TAz2wLGOFU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_languages_table.sql')
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration...')

    // Since we're using anon key, we can't directly run SQL
    // Instead, let's check if the table exists and provide instructions
    const { data, error } = await supabase
      .from('languages')
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      console.log('\n⚠️  The languages table does not exist yet.')
      console.log('\nTo apply the migration, please:')
      console.log('\n1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hczklwevoipzxzzspfuz')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the migration from: supabase/migrations/001_languages_table.sql')
      console.log('4. Click "Run" to execute the migration')
      console.log('\nAlternatively, you can use the Supabase CLI with service role key.')
    } else if (error) {
      console.log('Error checking table:', error.message)
    } else {
      console.log('✅ Languages table already exists!')
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

runMigration()