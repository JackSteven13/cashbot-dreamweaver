
// Edge function pour traiter les commissions mensuelles des parrainages
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Configuration des en-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Frais Stripe approximatifs (2.9% + 0.30€)
const STRIPE_PERCENTAGE_FEE = 0.029;
const STRIPE_FIXED_FEE = 0.30;

// Plans et leurs prix mensuels
const PLAN_PRICES = {
  'basic': 19.99,
  'pro': 39.99,
  'premium': 79.99,
  'enterprise': 149.99,
  // Valeur par défaut pour les plans non reconnus
  'default': 19.99
};

// Créer un client Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Calculer le montant de commission après frais Stripe
function calculateCommission(planType: string, commissionRate: number): number {
  // Récupérer le prix du plan
  const planPrice = PLAN_PRICES[planType as keyof typeof PLAN_PRICES] || PLAN_PRICES.default;
  
  // Calculer le montant net après frais Stripe
  const stripeFees = planPrice * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE;
  const netAmount = planPrice - stripeFees;
  
  // Calculer la commission
  const commission = netAmount * commissionRate;
  
  // Arrondir à 2 décimales
  return parseFloat(commission.toFixed(2));
}

// Ajouter une transaction pour une commission
async function addCommissionTransaction(userId: string, amount: number, referredUser: string, planType: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        gain: amount,
        report: `Commission de parrainage (${planType})`,
        date: new Date().toISOString().split('T')[0]
      });
      
    if (error) {
      console.error(`Erreur lors de l'ajout de la transaction pour ${userId}:`, error);
      return false;
    }
    
    console.log(`Transaction de commission ajoutée pour ${userId}: ${amount}€`);
    return true;
  } catch (error) {
    console.error(`Exception lors de l'ajout de la transaction pour ${userId}:`, error);
    return false;
  }
}

// Mettre à jour le solde de l'utilisateur
async function updateUserBalance(userId: string, amount: number) {
  try {
    // Récupérer le solde actuel
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('id', userId)
      .maybeSingle();
      
    if (balanceError || !balanceData) {
      console.error(`Erreur lors de la récupération du solde pour ${userId}:`, balanceError);
      return false;
    }
    
    // Calculer le nouveau solde
    const newBalance = parseFloat(balanceData.balance) + amount;
    
    // Mettre à jour le solde
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (updateError) {
      console.error(`Erreur lors de la mise à jour du solde pour ${userId}:`, updateError);
      return false;
    }
    
    console.log(`Solde mis à jour pour ${userId}: ${balanceData.balance}€ -> ${newBalance}€`);
    return true;
  } catch (error) {
    console.error(`Exception lors de la mise à jour du solde pour ${userId}:`, error);
    return false;
  }
}

// Fonction principale pour traiter toutes les commissions
async function processAllCommissions() {
  try {
    console.log("Début du traitement des commissions mensuelles...");
    
    // Récupérer tous les parrainages actifs
    const { data: activeReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('status', 'active');
      
    if (referralsError) {
      console.error("Erreur lors de la récupération des parrainages actifs:", referralsError);
      return { success: false, message: "Erreur lors de la récupération des parrainages" };
    }
    
    if (!activeReferrals || activeReferrals.length === 0) {
      console.log("Aucun parrainage actif trouvé");
      return { success: true, message: "Aucun parrainage à traiter", processed: 0 };
    }
    
    console.log(`${activeReferrals.length} parrainages actifs trouvés, traitement en cours...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const referral of activeReferrals) {
      try {
        // Calculer la commission en tenant compte des frais Stripe
        const commissionAmount = calculateCommission(
          referral.plan_type, 
          referral.commission_rate
        );
        
        console.log(`Commission calculée pour le parrain ${referral.referrer_id}: ${commissionAmount}€`);
        
        // Ajouter la transaction
        const transactionAdded = await addCommissionTransaction(
          referral.referrer_id,
          commissionAmount,
          referral.referred_user_id,
          referral.plan_type
        );
        
        if (!transactionAdded) {
          console.error(`Échec de l'ajout de transaction pour le parrain ${referral.referrer_id}`);
          errorCount++;
          continue;
        }
        
        // Mettre à jour le solde
        const balanceUpdated = await updateUserBalance(
          referral.referrer_id,
          commissionAmount
        );
        
        if (!balanceUpdated) {
          console.error(`Échec de la mise à jour du solde pour le parrain ${referral.referrer_id}`);
          errorCount++;
          continue;
        }
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors du traitement de la commission pour le parrainage ${referral.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Traitement terminé. Réussis: ${successCount}, Échecs: ${errorCount}`);
    return { 
      success: true, 
      message: `Traitement terminé avec ${successCount} commissions traitées et ${errorCount} échecs`, 
      processed: successCount,
      errors: errorCount
    };
  } catch (error) {
    console.error("Erreur générale lors du traitement des commissions:", error);
    return { success: false, message: "Erreur générale lors du traitement" };
  }
}

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
    console.error("Erreur non gérée:", error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
