export const BANKS = {
  hdfc: {
    id: 'hdfc',
    label: 'HDFC Bank',
    shortLabel: 'HDFC',
    color: '#004C8F',
    lightColor: '#E8EFF8',
    textColor: '#FFFFFF',
    logo: '🏦',
    accentColor: '#1565C0',
    patterns: ['HDFC BANK', 'HDB Financial', 'HDFC'],
  },
  icici: {
    id: 'icici',
    label: 'ICICI Bank',
    shortLabel: 'ICICI',
    color: '#F37024',
    lightColor: '#FEF0E7',
    textColor: '#FFFFFF',
    logo: '🏦',
    accentColor: '#E55A0A',
    patterns: ['ICICI BANK', 'ICICI Bank Ltd', 'ICICI'],
  },
  sbi: {
    id: 'sbi',
    label: 'State Bank of India',
    shortLabel: 'SBI',
    color: '#2B3B8F',
    lightColor: '#ECEEF8',
    textColor: '#FFFFFF',
    logo: '🏦',
    accentColor: '#1A2A7A',
    patterns: ['STATE BANK OF INDIA', 'SBI', 'State Bank'],
  },
  axis: {
    id: 'axis',
    label: 'Axis Bank',
    shortLabel: 'Axis',
    color: '#97144D',
    lightColor: '#F9ECF2',
    textColor: '#FFFFFF',
    logo: '🏦',
    accentColor: '#7A0D3A',
    patterns: ['AXIS BANK', 'Axis Bank Limited', 'AXIS'],
  },
}

export const BANK_LIST = Object.values(BANKS)

export function getBankById(id) {
  return BANKS[id] || null
}

export function detectBankFromText(text) {
  const upper = text.slice(0, 1000).toUpperCase()
  for (const bank of BANK_LIST) {
    for (const pattern of bank.patterns) {
      if (upper.includes(pattern.toUpperCase())) {
        return bank.id
      }
    }
  }
  return null
}
