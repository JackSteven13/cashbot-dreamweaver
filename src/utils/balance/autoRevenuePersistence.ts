
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_LIMITS } from "@/utils/subscription";

/**
 * Enregistre un revenu automatique pour chaque jour d'absence:
 *  - Ajoute une transaction "revenu automatique" pour chaque jour sans transaction
 *  - Cumule les gains pour mettre à jour la balance côté DB 
 *  - Garantit un montant variable mais toujours sous le plafond quotidien
 * @param userId 
 * @param lastVisitISO ISO string de dernière connexion ("2024-04-20T12:00:00Z")
 * @param subscription "freemium" | "pro"
 * @returns nombre de jours auto-générés, total de gain, tableau des transactions créées
 */
export async function recordMissingAutoRevenues(userId: string, lastVisitISO: string, subscription: string = "freemium") {
  if (!userId) return { days: 0, totalGain: 0, transactions: [] };
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastVisitISO);
  lastDate.setHours(0, 0, 0, 0);

  // Combien de jours d'absence ?
  let daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000*60*60*24));

  if (daysDiff <= 0) return { days: 0, totalGain: 0, transactions: [] };

  const dailyLimit = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS] || 0.5;
  let totalGain = 0;
  let transactions: any[] = [];

  for (let d = 1; d <= daysDiff; d++) {
    const day = new Date(lastDate);
    day.setDate(lastDate.getDate() + d); // Jour manquant
    const dateStr = day.toISOString().split('T')[0];
    
    // On vérifie s'il n'y a PAS déjà une transaction automatique pour ce jour-là
    const { data: existing, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateStr)
      .eq("report", "Revenu automatique");

    if (error) continue;
    if (existing && existing.length > 0) continue; // Transaction déjà existante => skip

    // Montant réaliste : autour de 60%-95% de la limite/jour
    const gain = Math.round(
      ((dailyLimit * (0.6 + Math.random() * 0.35)) + Number.EPSILON) * 100
    ) / 100;

    // Ajoute transaction DB
    const txPayload = {
      user_id: userId,
      gain,
      date: dateStr,
      report: "Revenu automatique",
      created_at: day.toISOString()
    };
    const { data: newTx, error: txError } = await supabase
      .from("transactions")
      .insert([txPayload])
      .select();

    if (txError) continue;

    transactions.push(newTx?.[0]);
    totalGain += gain;

    // Met à jour la balance côté DB au fil de l'eau
    await supabase
      .from("user_balances")
      .update({ balance: supabase.rpc('increment_balance', { value: gain }) })
      .eq("id", userId);
  }

  // Notifie le front pour rafraîchir
  window.dispatchEvent(new CustomEvent('auto-revenue:transactions-recorded', {
    detail: { userId, days: daysDiff, totalGain }
  }));

  return { days: daysDiff, totalGain, transactions };
}
