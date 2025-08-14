import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: jobs } = await supabase.from('job_configs').select()

  return <pre>{JSON.stringify(jobs, null, 2)}</pre>
}