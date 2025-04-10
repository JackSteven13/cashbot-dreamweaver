
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./utils/corsHeaders.ts";

// Créer un client Supabase avec les variables d'environnement
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Constantes pour la génération de gains
const MIN_GAIN_AMOUNT = 0.01;
const MAX_GAIN_AMOUNT = 0.05;
const SUBSCRIPTION_LIMITS = {
  freemium: 0.5,
  starter: 1.5,
  premium: 3.0,
  elite: 5.0
};

const INTERVAL_GAINS = {
  freemium: { min: 0.01, max: 0.03 },
  starter: { min: 0.02, max: 0.05 },
  premium: { min: 0.03, max: 0.07 },
  elite: { min: 0.05, max: 0.1 }
};

// Fonction pour générer un gain aléatoire basé sur l'abonnement
function generateRandomGain(subscription: string): number {
  const range = INTERVAL_GAINS[subscription as keyof typeof INTERVAL_GAINS] || INTERVAL_GAINS.freemium;
  const gain = Math.random() * (range.max - range.min) + range.min;
  return parseFloat(gain.toFixed(2));
}

// Fonction pour calculer la limite quotidienne par abonnement
function getDailyLimit(subscription: string): number {
  return SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
}

// Générer les gains hors-ligne pour tous les utilisateurs actifs
async function generateOfflineGains(): Promise<number> {
  try {
    // Récupérer tous les utilisateurs avec leur abonnement
    const { data: users, error: userError } = await supabaseClient
      .from("user_balances")
      .select("id, subscription");

    if (userError) {
      console.error("Erreur lors de la récupération des utilisateurs:", userError);
      return 0;
    }

    let totalGainsGenerated = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Pour chaque utilisateur
    for (const user of users || []) {
      try {
        // Vérifier les gains déjà générés aujourd'hui pour cet utilisateur
        const { data: existingGains, error: gainError } = await supabaseClient
          .from("offline_gains")
          .select("amount")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00Z`)
          .lt("created_at", `${today}T23:59:59Z`);

        if (gainError) {
          console.error(`Erreur lors de la vérification des gains pour l'utilisateur ${user.id}:`, gainError);
          continue;
        }
        
        // Calculer le total des gains générés aujourd'hui
        const todaysGains = (existingGains || []).reduce((sum, g) => sum + g.amount, 0);
        
        // Vérifier si la limite quotidienne est atteinte
        const dailyLimit = getDailyLimit(user.subscription);
        if (todaysGains >= dailyLimit) {
          console.log(`Limite quotidienne atteinte pour l'utilisateur ${user.id}: ${todaysGains}/${dailyLimit}`);
          continue;
        }
        
        // Calculer combien on peut encore générer aujourd'hui
        const remainingLimit = dailyLimit - todaysGains;
        
        // Générer un gain aléatoire mais limité au reste disponible
        let gain = Math.min(generateRandomGain(user.subscription), remainingLimit);
        gain = parseFloat(gain.toFixed(2));
        
        // Vérifier que le gain est significatif
        if (gain < 0.01) {
          continue;
        }
        
        // Ajouter le gain à la table offline_gains
        const { error: insertError } = await supabaseClient
          .from("offline_gains")
          .insert({
            user_id: user.id,
            amount: gain,
            subscription: user.subscription,
            created_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error(`Erreur lors de l'ajout du gain pour l'utilisateur ${user.id}:`, insertError);
          continue;
        }
        
        console.log(`Gain hors-ligne généré pour l'utilisateur ${user.id}: ${gain}€`);
        totalGainsGenerated++;
      } catch (error) {
        console.error(`Erreur pour l'utilisateur ${user.id}:`, error);
      }
    }
    
    return totalGainsGenerated;
  } catch (error) {
    console.error("Erreur générale lors de la génération des gains:", error);
    return 0;
  }
}

// Handler pour l'edge function
const handler = async (req: Request): Promise<Response> => {
  // Autoriser seulement les méthodes POST et OPTIONS pour CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  try {
    // Vérifier si la requête a un secret d'autorisation (pour protection)
    const authHeader = req.headers.get("Authorization");
    const expectedKey = Deno.env.get("CRON_SECRET_KEY");
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      console.log("Tentative d'accès non autorisée");
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log("Début de la génération des gains hors-ligne");
    const startTime = Date.now();
    
    // Générer les gains hors-ligne
    const totalGains = await generateOfflineGains();
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.log(`Génération terminée en ${executionTime.toFixed(2)}s - ${totalGains} gains générés`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalGains} gains hors-ligne générés en ${executionTime.toFixed(2)}s`,
        gains: totalGains
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erreur dans la fonction generate-offline-gains:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

// Démarrer le serveur
serve(handler);
