// supabase/functions/send-community-registration-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { communityName, address, contactName, phoneNumber } = await req.json()

    const { error } = await supabase.auth.admin.sendEmail(
      'your-admin-email@example.com',
      {
        subject: 'New Community Registration Request',
        content: `
          <h1>New Community Registration Request</h1>
          <p><strong>Community Name:</strong> ${communityName}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>Contact Name:</strong> ${contactName}</p>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        `,
      }
    )

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})