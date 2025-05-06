
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error("No user found");
    }

    // Get request details
    let clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // If IP is a comma-separated list (happens with proxies), get the first one
    if (clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }

    console.log(`Logging connection for user ${user.id} from IP ${clientIP} with agent ${userAgent}`);

    // Log the user connection
    const { error: logError } = await supabaseClient
      .from("user_connections")
      .insert([{ 
        user_id: user.id,
        ip_address: clientIP,
        user_agent: userAgent,
        connected_at: new Date().toISOString()
      }]);
    
    if (logError) {
      throw logError;
    }

    return new Response(
      JSON.stringify({ message: "Connection logged successfully" }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error logging connection:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400 
      }
    );
  }
});
