
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
      .from("profiles")
      .select("id, email")
      .in("email", usersToReset);

    if (userError) {
      console.error("Erreur lors de la récupération des utilisateurs via profiles:", userError);
      
      // Essayer avec auth.users si profiles échoue
      const { data: authUsers, error: authError } = await supabase
        .from("auth.users")
        .select("id, email")
        .in("email", usersToReset);
        
      if (authError || !authUsers || authUsers.length === 0) {
        throw new Error("Échec de la récupération des utilisateurs");
      }
      
      console.log("Utilisateurs récupérés via auth.users:", authUsers);
      
      if (authUsers && authUsers.length > 0) {
        const userIds = authUsers.map(user => user.id);
        await resetUserData(supabase, userIds, usersToReset);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${userIds.length} comptes utilisateurs réinitialisés avec succès via auth.users`,
            users: authUsers.map(u => u.email)
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
    }

    if (!users || users.length === 0) {
      // Si aucun utilisateur trouvé dans profiles, essayons de chercher directement dans auth.users
      const { data: authUsers, error: authError } = await supabase
        .auth.admin.listUsers();
      
      if (authError || !authUsers) {
        throw new Error("Échec de la récupération des utilisateurs");
      }
      
      // Filtrer les utilisateurs par email
      const matchedUsers = authUsers.users.filter(user => 
        usersToReset.includes(user.email || "")
      );
      
      if (matchedUsers.length === 0) {
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
      
      const userIds = matchedUsers.map(user => user.id);
      console.log(`${userIds.length} utilisateurs trouvés via auth.admin pour réinitialisation`);
      
      await resetUserData(supabase, userIds, usersToReset);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${userIds.length} comptes utilisateurs réinitialisés avec succès via auth.admin`,
          users: matchedUsers.map(u => u.email)
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const userIds = users.map(user => user.id);
    console.log(`${userIds.length} utilisateurs trouvés pour réinitialisation:`, userIds);
    
    await resetUserData(supabase, userIds, usersToReset);

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

// Fonction pour réinitialiser les données utilisateur
async function resetUserData(supabase, userIds, emails) {
  // 1. Réinitialiser les transactions - les supprimer complètement
  const { error: transactionsError } = await supabase
    .from("transactions")
    .delete()
    .in("user_id", userIds);

  if (transactionsError) {
    console.error("Erreur lors de la suppression des transactions:", transactionsError);
  } else {
    console.log("Transactions supprimées avec succès");
  }

  // 2. Réinitialiser les balances utilisateurs - mettre à zéro
  for (const userId of userIds) {
    const { error: balanceError } = await supabase
      .from("user_balances")
      .update({ 
        balance: 0, 
        daily_session_count: 0,
        subscription: 'freemium',
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (balanceError) {
      console.error(`Erreur lors de la réinitialisation de la balance pour ${userId}:`, balanceError);
      
      // Si l'entrée n'existe pas, essayons de la créer
      if (balanceError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from("user_balances")
          .insert([{ 
            id: userId, 
            balance: 0, 
            daily_session_count: 0,
            subscription: 'freemium'
          }]);
          
        if (insertError) {
          console.error(`Erreur lors de la création de balance pour ${userId}:`, insertError);
        } else {
          console.log(`Balance créée avec succès pour ${userId}`);
        }
      }
    } else {
      console.log(`Balance réinitialisée avec succès pour ${userId}`);
    }
  }

  // 3. Réinitialiser les parrainages - supprimer tous les liens
  const { error: referralsError } = await supabase
    .from("referrals")
    .delete()
    .or(`referrer_id.in.(${userIds.map(id => `'${id}'`).join(',')}),referred_user_id.in.(${userIds.map(id => `'${id}'`).join(',')})`);

  if (referralsError) {
    console.error("Erreur lors de la suppression des parrainages:", referralsError);
  } else {
    console.log("Parrainages supprimés avec succès");
  }
  
  // 4. Réinitialiser les comptes directement dans auth.users
  for (const email of emails) {
    try {
      // Cette approche est une option de dernier recours car elle pourrait affecter d'autres fonctionnalités
      const { data: userData, error: userDataError } = await supabase
        .auth.admin.getUserByEmail(email);
      
      if (userDataError || !userData || !userData.user) {
        console.error(`Impossible de trouver l'utilisateur avec l'email ${email}:`, userDataError);
        continue;
      }
      
      // Mettre à jour les métadonnées utilisateur si nécessaire
      const { error: updateError } = await supabase
        .auth.admin.updateUserById(userData.user.id, {
          user_metadata: { 
            ...userData.user.user_metadata,
            subscription: 'freemium',
            balance: 0
          }
        });
        
      if (updateError) {
        console.error(`Erreur lors de la mise à jour des métadonnées pour ${email}:`, updateError);
      } else {
        console.log(`Métadonnées utilisateur mises à jour pour ${email}`);
      }
    } catch (e) {
      console.error(`Erreur lors de la réinitialisation de l'utilisateur ${email}:`, e);
    }
  }
}
