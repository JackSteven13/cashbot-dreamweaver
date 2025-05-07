
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

// Configuration CORS plus permissive pour le développement
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Fonction pour gérer les erreurs et retourner une réponse formatée
function errorResponse(message, status = 400) {
  console.error(`❌ Erreur: ${message}`);
  return new Response(
    JSON.stringify({ 
      error: message, 
      success: false 
    }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status 
    }
  );
}

serve(async (req) => {
  console.log(`📥 Requête reçue: ${req.method}`);
  
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    console.log("👍 Réponse OPTIONS CORS");
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
  }

  try {
    if (req.method !== "POST") {
      return errorResponse(`Méthode non autorisée: ${req.method}`, 405);
    }
    
    // Analyser les données de la requête
    let requestData;
    try {
      requestData = await req.json();
      console.log(`📊 Données reçues: ${JSON.stringify(requestData)}`);
    } catch (e) {
      return errorResponse(`JSON invalide dans le corps de la requête: ${e.message}`);
    }
    
    const { email = "unknown", success = false, error_message = null, user_id = null } = requestData;
    
    console.log(`📝 Log de connexion: email=${email}, succès=${success}, erreur=${error_message || "aucune"}`);
    
    // Créer un client Supabase avec le rôle de service pour un accès administrateur
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("Configuration Supabase manquante");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        persistSession: false
      }
    });

    // Obtenir les détails de la requête
    let clientIP = req.headers.get("x-forwarded-for") || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
    
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Si l'IP est une liste séparée par des virgules (arrive avec les proxies), prendre la première
    if (clientIP && clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim();
    }

    // Préparer l'enregistrement à insérer
    const connectionRecord = {
      user_id: user_id || '00000000-0000-0000-0000-000000000000', // UUID anonyme pour les tentatives échouées
      ip_address: clientIP,
      user_agent: userAgent,
      connected_at: new Date().toISOString(),
      email: email || null,
      success: success,
      error_message: error_message
    };
    
    console.log("📊 Insertion de l'enregistrement:", JSON.stringify(connectionRecord));

    // Enregistrer la tentative de connexion avec gestion d'erreurs améliorée
    try {
      const { error: logError } = await supabase
        .from("user_connections")
        .insert([connectionRecord]);
      
      if (logError) {
        console.error("💾 Erreur d'insertion DB:", logError);
        // On continue malgré l'erreur d'insertion - ne pas bloquer le flux
      } else {
        console.log("✅ Log de connexion sauvegardé avec succès");
      }
    } catch (dbErr) {
      console.error("💥 Exception lors de l'insertion DB:", dbErr);
      // On continue malgré l'erreur d'insertion
    }
    
    return new Response(
      JSON.stringify({ 
        message: "Tentative de connexion enregistrée avec succès",
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
    console.error("❌ Erreur lors de l'enregistrement de la connexion:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue",
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
