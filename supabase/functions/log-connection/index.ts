
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
    // Parse request body
    const requestData = await req.json();
    const { email, success = true, error_message = null } = requestData;
    
    console.log("Received connection log request:", { email, success, error_message });
    
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

    let userId = null;
    
    // Only try to get user details if this is a successful login
    if (success) {
      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
          console.error("User error:", userError);
        } else if (user) {
          userId = user.id;
          console.log("User found:", userId);
        }
      } catch (authError) {
        console.error("Auth error:", authError);
      }
    }

    // Get request details
    let clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // If IP is a comma-separated list (happens with proxies), get the first one
    if (clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }

    console.log(`Logging ${success ? 'successful' : 'failed'} connection attempt${userId ? ` for user ${userId}` : ' for ' + email} from IP ${clientIP}`);

    // Prepare record to insert
    const connectionRecord = {
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Anonymous UUID for failed attempts
      ip_address: clientIP,
      user_agent: userAgent,
      connected_at: new Date().toISOString(),
      email: email || null,
      success: success,
      error_message: error_message
    };
    
    console.log("Inserting connection record:", connectionRecord);

    // Log the connection attempt
    const { error: logError } = await supabaseClient
      .from("user_connections")
      .insert([connectionRecord]);
    
    if (logError) {
      console.error("DB insertion error:", logError);
      throw logError;
    }

    return new Response(
      JSON.stringify({ 
        message: "Connection attempt logged successfully",
        success: true
      }),
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
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
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
