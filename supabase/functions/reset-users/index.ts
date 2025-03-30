
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Créer un client Supabase avec les clés d'API
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Liste des emails à réinitialiser (tirée de l'image)
    const usersToReset = [
      "clowatylakose@iliad-free.fr",
      "cedriclowa@outlook.fr",
      "f.c.fini01@gmail.com",
      "walodaniel3@gmail.com",
      "kayzerslotern@gmail.com"
    ];

    console.log("Démarrage de la réinitialisation des utilisateurs:", usersToReset);

    // Récupérer les IDs utilisateurs correspondant aux emails
    const { data: users, error: userError } = await supabase
      .from("auth.users")
      .select("id, email")
      .in("email", usersToReset);

    if (userError) {
      console.error("Erreur lors de la récupération des utilisateurs:", userError);
      throw new Error("Échec de la récupération des utilisateurs");
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Aucun utilisateur trouvé avec les emails spécifiés" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    const userIds = users.map(user => user.id);
    console.log(`${userIds.length} utilisateurs trouvés pour réinitialisation`);

    // Réinitialiser les transactions
    const { error: transactionsError } = await supabase
      .from("transactions")
      .delete()
      .in("user_id", userIds);

    if (transactionsError) {
      console.error("Erreur lors de la suppression des transactions:", transactionsError);
    } else {
      console.log("Transactions supprimées avec succès");
    }

    // Réinitialiser les balances utilisateurs
    const { error: balanceError } = await supabase
      .from("user_balances")
      .update({ 
        balance: 0, 
        daily_session_count: 0,
        updated_at: new Date().toISOString()
      })
      .in("id", userIds);

    if (balanceError) {
      console.error("Erreur lors de la réinitialisation des balances:", balanceError);
    } else {
      console.log("Balances utilisateurs réinitialisées avec succès");
    }

    // Réinitialiser les parrainages
    const { error: referralsError } = await supabase
      .from("referrals")
      .delete()
      .in("referrer_id", userIds)
      .or(`referred_user_id.in.(${userIds.map(id => `'${id}'`).join(',')})`);

    if (referralsError) {
      console.error("Erreur lors de la suppression des parrainages:", referralsError);
    } else {
      console.log("Parrainages supprimés avec succès");
    }

    // Résultat final
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${userIds.length} comptes utilisateurs réinitialisés avec succès`,
        users: users.map(u => u.email)
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Erreur lors de la réinitialisation des utilisateurs:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Erreur lors de la réinitialisation des utilisateurs", 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
