
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("🔄 Log connection function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling OPTIONS request (CORS)");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const { email = "unknown", success = true, error_message = null } = requestData;
    
    console.log(`📝 Received connection log: email=${email}, success=${success}, error_message=${error_message || "none"}`);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    console.log(`🔑 Creating Supabase client with URL: ${supabaseUrl.substring(0, 20)}...`);
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
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
          console.error("❌ User retrieval error:", userError.message);
        } else if (user) {
          userId = user.id;
          console.log("👤 User found:", userId);
        } else {
          console.log("⚠️ No user found despite successful login");
        }
      } catch (authError: any) {
        console.error("🚫 Auth error:", authError.message || authError);
      }
    } else {
      console.log("❌ Failed login - not attempting to fetch user data");
    }

    // Get request details
    let clientIP = req.headers.get("x-forwarded-for") || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
    
    const userAgent = req.headers.get("user-agent") || "unknown";

    // If IP is a comma-separated list (happens with proxies), get the first one
    if (clientIP && clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }

    console.log(`📍 ${success ? 'Successful' : 'Failed'} connection attempt${userId ? ` for user ${userId}` : ' for ' + email} from IP ${clientIP}`);

    // Prepare record to insert - important: use anonymous UUID for failed attempts
    const connectionRecord = {
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Anonymous UUID for failed attempts
      ip_address: clientIP,
      user_agent: userAgent,
      connected_at: new Date().toISOString(),
      email: email || null,
      success: success,
      error_message: error_message
    };
    
    console.log("📊 Inserting connection record:", JSON.stringify(connectionRecord));

    // Log the connection attempt
    const { error: logError } = await supabaseClient
      .from("user_connections")
      .insert([connectionRecord]);
    
    if (logError) {
      console.error("💾 DB insertion error:", logError.message, logError.details);
      throw logError;
    }

    console.log("✅ Connection log saved successfully");
    
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
  } catch (error: any) {
    console.error("❌ Error logging connection:", error.message || error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
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
