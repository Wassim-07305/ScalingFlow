/**
 * Calcule le montant de commission selon le type de programme.
 */

interface CommissionInput {
  sourceAmount: number;
  commissionType: "one_time" | "recurring" | "tiered";
  commissionRate: number;        // %
  customRate?: number | null;    // override affilié
  existingCommissionsCount?: number; // pour les récurrentes
  recurringMonths?: number | null;   // null = à vie
}

interface CommissionResult {
  amount: number;
  rate: number;
  eligible: boolean;
  reason?: string;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const {
    sourceAmount,
    commissionType,
    commissionRate,
    customRate,
    existingCommissionsCount = 0,
    recurringMonths,
  } = input;

  const rate = customRate ?? commissionRate;

  // Vérifier l'éligibilité pour les commissions récurrentes
  if (commissionType === "recurring" && recurringMonths !== null && recurringMonths !== undefined) {
    if (existingCommissionsCount >= recurringMonths) {
      return {
        amount: 0,
        rate,
        eligible: false,
        reason: `Durée maximale de ${recurringMonths} mois atteinte`,
      };
    }
  }

  const amount = Math.round((sourceAmount * rate) / 100 * 100) / 100;

  return { amount, rate, eligible: true };
}
