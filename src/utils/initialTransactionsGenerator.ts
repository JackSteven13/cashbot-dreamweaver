
import { addTransaction } from './user/transactionUtils';

/**
 * Génère des transactions initiales pour les utilisateurs avec un solde positif
 * mais sans transactions dans l'historique
 */
export const generateInitialTransactions = async (userId: string, balance: number): Promise<boolean> => {
  if (!userId || balance <= 0) {
    return false;
  }
  
  try {
    console.log(`Génération de transactions initiales pour utilisateur ${userId} avec solde ${balance}`);
    
    // Ne pas générer plus de 5 transactions initiales
    const nbTransactions = Math.min(5, Math.ceil(balance / 0.35));
    
    // Calculer le montant moyen par transaction
    const avgAmount = balance / nbTransactions;
    
    // Dates pour les transactions (jusqu'à 5 jours dans le passé)
    const today = new Date();
    
    let success = true;
    let remainingBalance = balance;
    
    // Générer les transactions
    for (let i = 0; i < nbTransactions; i++) {
      // Calculer la date (plus récent à plus ancien)
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - Math.floor(i * 1.2));
      const dateString = transactionDate.toISOString().split('T')[0];
      
      // Montant de la transaction (dernier = reste du solde)
      const isLastTransaction = i === nbTransactions - 1;
      const amount = isLastTransaction ? remainingBalance : (
        // Léger aléa sur le montant pour éviter des transactions identiques
        avgAmount * (0.85 + Math.random() * 0.3)
      );
      
      // Arrondir à 2 décimales
      const roundedAmount = Math.round(amount * 100) / 100;
      
      // Soustraire du solde restant
      remainingBalance -= roundedAmount;
      
      // Type de transaction aléatoire
      const transactionType = i % 2 === 0 
        ? "Analyse automatique complétée"
        : "Session d'analyse vidéo";
        
      // Ajouter la transaction
      const result = await addTransaction(
        userId,
        roundedAmount,
        `${transactionType}: +${roundedAmount.toFixed(2)}€`
      );
      
      if (!result) {
        success = false;
      }
    }
    
    return success;
  } catch (error) {
    console.error("Erreur lors de la génération des transactions initiales:", error);
    return false;
  }
};
