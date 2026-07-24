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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // Get users with active trials
    const { data: activeTrials } = await supabaseClient
      .from('profiles')
      .select('id, email, trial_end_date')
      .eq('is_trial_active', true)
      .not('trial_end_date', 'is', null)

    const notifications = []

    if (activeTrials) {
      for (const user of activeTrials) {
        const endDate = new Date(user.trial_end_date)
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        let notificationType = null
        
        if (daysRemaining <= 0) {
          notificationType = 'expired'
        } else if (daysRemaining === 1) {
          notificationType = '1_day'
        } else if (daysRemaining <= 3) {
          notificationType = '3_days'
        }

        if (notificationType) {
          // Check if notification already sent today
          const { data: existing } = await supabaseClient
            .from('trial_notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('notification_type', notificationType)
            .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (!existing) {
            // Record notification
            await supabaseClient
              .from('trial_notifications')
              .insert({
                user_id: user.id,
                notification_type: notificationType,
                email_sent: true,
                in_app_sent: true
              })

            // Deactivate expired trials
            if (notificationType === 'expired') {
              await supabaseClient
                .from('profiles')
                .update({ is_trial_active: false })
                .eq('id', user.id)
            }

            notifications.push({ 
              user: user.id, 
              email: user.email,
              type: notificationType, 
              daysRemaining 
            })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        notifications 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})