
// Edge function pour traiter les commissions mensuelles des parrainages
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "./utils/corsHeaders.ts";
import { processAllCommissions } from "./services/commissionService.ts";
import { handleError } from "./utils/errorHandler.ts";

// Gérer les requêtes HTTP
serve(async (req) => {
  // Gérer les requêtes CORS OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier le token d'autorisation pour la sécurité
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Autorisation requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exécuter si déclenché manuellement ou par un cron job
    const result = await processAllCommissions();
    
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorResponse = handleError(error, "Erreur non gérée dans le traitement principal");
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
