// Common Indian merchant colors and initials for avatar display
export const MERCHANT_COLORS = {
  swiggy: { color: '#FC8019', initial: 'S', label: 'Swiggy' },
  zomato: { color: '#E23744', initial: 'Z', label: 'Zomato' },
  amazon: { color: '#FF9900', initial: 'A', label: 'Amazon' },
  flipkart: { color: '#2874F0', initial: 'F', label: 'Flipkart' },
  netflix: { color: '#E50914', initial: 'N', label: 'Netflix' },
  spotify: { color: '#1DB954', initial: 'S', label: 'Spotify' },
  airtel: { color: '#ED1C24', initial: 'A', label: 'Airtel' },
  jio: { color: '#0040FF', initial: 'J', label: 'Jio' },
  ola: { color: '#EEB409', initial: 'O', label: 'Ola' },
  uber: { color: '#000000', initial: 'U', label: 'Uber' },
  bigbasket: { color: '#84C225', initial: 'B', label: 'BigBasket' },
  blinkit: { color: '#F8D000', initial: 'B', label: 'Blinkit' },
  zepto: { color: '#8B2FC9', initial: 'Z', label: 'Zepto' },
  gpay: { color: '#4285F4', initial: 'G', label: 'Google Pay' },
  phonepe: { color: '#5F259F', initial: 'P', label: 'PhonePe' },
  paytm: { color: '#00B9F1', initial: 'P', label: 'Paytm' },
  dmart: { color: '#E31837', initial: 'D', label: 'DMart' },
  myntra: { color: '#FF3F6C', initial: 'M', label: 'Myntra' },
  hotstar: { color: '#1F80E0', initial: 'H', label: 'Hotstar' },
  zerodha: { color: '#387ED1', initial: 'Z', label: 'Zerodha' },
  groww: { color: '#00D09C', initial: 'G', label: 'Groww' },
}

// Hash a string to a color for unknown merchants
export function hashMerchantColor(name) {
  const colors = [
    '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
    '#6366F1', '#EF4444', '#22C55E', '#3B82F6', '#84CC16',
    '#A855F7', '#D946EF', '#0EA5E9', '#10B981', '#F43F5E',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function getMerchantInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export function getMerchantMeta(name) {
  const lower = (name || '').toLowerCase()
  for (const [key, meta] of Object.entries(MERCHANT_COLORS)) {
    if (lower.includes(key)) return meta
  }
  return {
    color: hashMerchantColor(name),
    initial: getMerchantInitial(name),
    label: name,
  }
}
