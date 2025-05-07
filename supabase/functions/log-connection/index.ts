
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Failed to parse request JSON:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const { email = "unknown", success = false, error_message = null, user_id = null } = requestData;
    
    console.log(`📝 Connection log: email=${email}, success=${success}, error_message=${error_message || "none"}`);
    
    // Create a Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("Missing Supabase configuration");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        persistSession: false
      }
    });

    // Get request details
    let clientIP = req.headers.get("x-forwarded-for") || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
    
    const userAgent = req.headers.get("user-agent") || "unknown";

    // If IP is a comma-separated list (happens with proxies), get the first one
    if (clientIP && clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }

    // Prepare record to insert
    const connectionRecord = {
      user_id: user_id || '00000000-0000-0000-0000-000000000000', // Anonymous UUID for failed attempts
      ip_address: clientIP,
      user_agent: userAgent,
      connected_at: new Date().toISOString(),
      email: email || null,
      success: success,
      error_message: error_message
    };
    
    console.log("📊 Inserting connection record:", JSON.stringify(connectionRecord));

    // Log the connection attempt
    const { error: logError } = await supabase
      .from("user_connections")
      .insert([connectionRecord]);
    
    if (logError) {
      console.error("💾 DB insertion error:", logError);
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
  } catch (error) {
    console.error("❌ Error logging connection:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 500
      }
    );
  }
});
