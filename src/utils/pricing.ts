import type { TicketPackage } from '../components/PackageKanban'

export interface PricingResult {
  realTotal: number
  displayTotal: number
  unitReal: number
  unitDisplay: number
  splitInfo: {
    promoQty: number
    promoPrice: number
    promoDisplay: number
    normalQty: number
    normalPrice: number
    normalDisplay: number
  } | null
}

export const getPricing = (
  pkg: TicketPackage | null,
  checkQty: number,
  selectedProduct: any,
  currentTime: Date,
): PricingResult => {
  if (!selectedProduct) {
    return { realTotal: 0, displayTotal: 0, unitReal: 0, unitDisplay: 0, splitInfo: null }
  }
  const isImmersive =
    selectedProduct.name.toLowerCase().includes('immersive') ||
    selectedProduct.name.toLowerCase().includes('tiket')
  if (!isImmersive || !pkg) {
    const p = selectedProduct.price
    return {
      realTotal: p * checkQty,
      displayTotal: p * checkQty,
      unitReal: p,
      unitDisplay: p,
      splitInfo: null,
    }
  }

  let currentNominal = Number(pkg.nominal) || 0
  let currentDisplay = Number(pkg.displayNominal) || 0

  const now = currentTime
  const today = now.getDay()
  const timeStr = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })

  let matchedMultipleOf = 0
  let matchedMultiplePrice = 0
  let matchedMultipleDisplayPrice = 0

  if (pkg.rules && pkg.rules.length > 0) {
    for (const r of pkg.rules) {
      let match = true

      // Check endDate deadline
      if (r.endDate) {
        const deadline = new Date(r.endDate + 'T23:59:59+08:00') // WITA
        if (now > deadline) match = false
      }

      if (r.days && r.days.length > 0 && !r.days.includes(today)) match = false
      if (r.startTime && timeStr < r.startTime) match = false
      if (r.endTime && timeStr > r.endTime) match = false
      const rMin =
        r.minQty !== undefined && r.minQty !== '' ? Number(r.minQty) : null
      const rMax =
        r.maxQty !== undefined && r.maxQty !== '' ? Number(r.maxQty) : null

      if (rMin !== null && checkQty < rMin) match = false
      if (rMax !== null && checkQty > rMax) match = false

      if (match) {
        // Check if this is a kelipatan rule
        const mOf =
          r.multipleOf !== undefined && r.multipleOf !== ''
            ? Number(r.multipleOf)
            : 0
        const mPrice =
          r.multiplePrice !== undefined && r.multiplePrice !== ''
            ? Number(r.multiplePrice)
            : 0

        if (mOf >= 2 && mPrice > 0) {
          matchedMultipleOf = mOf
          matchedMultiplePrice = mPrice
          const mDispPrice =
            r.multipleDisplayPrice !== undefined &&
            r.multipleDisplayPrice !== ''
              ? Number(r.multipleDisplayPrice)
              : mPrice
          matchedMultipleDisplayPrice = mDispPrice
        }

        // Also apply override nominal (for non-kelipatan, or as base price for singles)
        const overNom =
          r.overrideNominal !== undefined && r.overrideNominal !== ''
            ? Number(r.overrideNominal)
            : null
        const overDisp =
          r.overrideDisplayNominal !== undefined &&
          r.overrideDisplayNominal !== ''
            ? Number(r.overrideDisplayNominal)
            : overNom

        if (overNom !== null) currentNominal = overNom
        if (overDisp !== null) currentDisplay = overDisp
        break
      }
    }
  }

  // Calculate totals
  if (matchedMultipleOf >= 2 && matchedMultiplePrice > 0) {
    const pairs = Math.floor(checkQty / matchedMultipleOf)
    const singles = checkQty % matchedMultipleOf
    const realTotal = pairs * matchedMultiplePrice + singles * currentNominal
    const dispTotal =
      pairs * matchedMultipleDisplayPrice + singles * currentDisplay
    return {
      realTotal,
      displayTotal: dispTotal,
      unitReal: checkQty > 0 ? realTotal / checkQty : currentNominal,
      unitDisplay: checkQty > 0 ? dispTotal / checkQty : currentDisplay,
      splitInfo:
        pairs > 0
          ? {
              promoQty: pairs * matchedMultipleOf,
              promoPrice: matchedMultiplePrice / matchedMultipleOf,
              promoDisplay: matchedMultipleDisplayPrice / matchedMultipleOf,
              normalQty: singles,
              normalPrice: currentNominal,
              normalDisplay: currentDisplay,
            }
          : null,
    }
  }

  return {
    realTotal: currentNominal * checkQty,
    displayTotal: currentDisplay * checkQty,
    unitReal: currentNominal,
    unitDisplay: currentDisplay,
    splitInfo: null,
  }
}
