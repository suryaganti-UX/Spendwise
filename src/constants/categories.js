export const CATEGORIES = [
  {
    id: 'income',
    label: 'Salary & Income',
    color: '#10B981',
    emoji: '💰',
    priority: 1,
    keywords: [
      'salary', 'payroll', 'credited by', 'interest credited', 'interest credit',
      'dividend', 'refund', 'cashback', 'reward', 'bonus', 'stipend',
      'da credit', 'hra credit', 'incentive', 'arrears', 'reimbursement',
    ],
  },
  {
    id: 'rent',
    label: 'Rent & Housing',
    color: '#84CC16',
    emoji: '🏠',
    priority: 2,
    keywords: [
      'rent', 'house rent', 'flat rent', 'pg', 'nobroker', 'housing.com',
      'maintenance', 'society', 'apartment', 'nobroker', 'magicbricks',
      '99acres', 'commonfloor', 'society maintenance', 'building maintenance',
      'housing society', 'strata', 'mygate',
    ],
  },
  {
    id: 'investments',
    label: 'Investments & Savings',
    color: '#0EA5E9',
    emoji: '📈',
    priority: 3,
    keywords: [
      'zerodha', 'groww', 'upstox', 'kuvera', 'coin', 'smallcase',
      'mutual fund', 'mf', 'sip', 'elss', 'ppf deposit', 'nps',
      'fd', 'fixed deposit', 'recurring deposit', 'rd', 'ipo',
      'stocks', 'demat', 'trading', 'investment', 'invest',
    ],
  },
  {
    id: 'food',
    label: 'Food & Dining',
    color: '#F97316',
    emoji: '🍔',
    priority: 4,
    keywords: [
      'swiggy', 'zomato', 'magicpin', 'eazydiner', 'dineout', 'dominos',
      'mcdonalds', 'kfc', 'subway', 'pizza', 'burger', 'cafe', 'restaurant',
      'dining', 'dunzo', 'food', 'eatclub', 'freshmenu', 'rebel foods',
      'burger king', 'pizza hut', 'starbucks', 'chaayos', 'barista',
      'box8', 'faasos', 'biryani', 'haldiram', 'barbeque nation',
    ],
  },
  {
    id: 'grocery',
    label: 'Groceries & Supermarket',
    color: '#22C55E',
    emoji: '🛒',
    priority: 5,
    keywords: [
      'bigbasket', 'grofers', 'milkbasket', 'dmart', 'more supermarket',
      'reliance fresh', 'spencers', 'nature basket', 'jiomart', 'blinkit',
      'zepto', 'swiggy instamart', 'grocery', 'kirana', 'supermarket',
      'vegetables', 'fruits', 'hypermarket', 'easyday', 'foodhall',
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    color: '#8B5CF6',
    emoji: '🛍️',
    priority: 6,
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'snapdeal',
      'tata cliq', 'shoppers stop', 'pantaloons', 'max fashion', 'zara',
      'h&m', 'lifestyle', 'westside', 'croma', 'vijay sales', 'reliance digital',
      'jiomart', 'decathlon', 'ikea', 'firstcry', 'babyoye', 'pepperfry',
    ],
  },
  {
    id: 'transport',
    label: 'Fuel & Transport',
    color: '#EF4444',
    emoji: '🚗',
    priority: 7,
    keywords: [
      'petrol', 'diesel', 'hp petrol', 'indian oil', 'bharat petroleum',
      'fasttag', 'toll', 'ola', 'uber', 'rapido', 'auto', 'cab', 'metro',
      'irctc', 'railways', 'bus', 'redbus', 'makemytrip', 'yatra', 'goibibo',
      'nammayatri', 'meru', 'blumart', 'bpcl', 'iocl', 'hpcl', 'fuel',
    ],
  },
  {
    id: 'travel',
    label: 'Travel',
    color: '#D946EF',
    emoji: '✈️',
    priority: 8,
    keywords: [
      'flight', 'airline', 'indigo', 'air india', 'spicejet', 'goair',
      'vistara', 'hotel', 'oyo', 'treebo', 'fabhotels', 'airbnb',
      'cleartrip', 'booking.com', 'holiday', 'resort', 'trivago',
      'expedia', 'makemytrip flight', 'goibibo flight',
    ],
  },
  {
    id: 'utilities',
    label: 'Utilities & Bills',
    color: '#6366F1',
    emoji: '⚡',
    priority: 9,
    keywords: [
      'electricity', 'water bill', 'gas bill', 'broadband', 'wifi',
      'airtel', 'jio', 'vi vodafone', 'bsnl', 'tata sky', 'dish tv',
      'sun direct', 'tata power', 'bescom', 'msedcl', 'municipality',
      'piped gas', 'lpg', 'indane', 'hp gas', 'mahanagar gas',
      'act fibernet', 'hathway', 'd2h', 'tataplay', 'videocon d2h',
      'postpaid', 'prepaid recharge', 'mobile bill',
    ],
  },
  {
    id: 'health',
    label: 'Healthcare',
    color: '#14B8A6',
    emoji: '🏥',
    priority: 10,
    keywords: [
      'apollo', 'fortis', 'manipal', 'medplus', 'netmeds', 'pharmeasy',
      '1mg', 'lenskart', 'doctor', 'hospital', 'clinic', 'pharmacy',
      'medical', 'health', 'dental', 'diagnostic', 'lab test',
      'thyrocare', 'healthspring', 'max hospital', 'columbia asia',
      'practo', 'mfine', 'davaai', 'medibuddy',
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment & OTT',
    color: '#F59E0B',
    emoji: '🎬',
    priority: 11,
    keywords: [
      'netflix', 'hotstar', 'prime video', 'amazon prime', 'disney',
      'spotify', 'gaana', 'jiosaavn', 'wynk', 'zee5', 'sonyliv', 'bookmyshow',
      'pvr', 'inox', 'cinepolis', 'paytm movies', 'movie', 'gaming',
      'steam', 'xbox', 'playstation', 'twitch', 'youtube premium',
      'apple tv', 'mxplayer', 'voot', 'jiocinema',
    ],
  },
  {
    id: 'education',
    label: 'Education & Learning',
    color: '#3B82F6',
    emoji: '📚',
    priority: 12,
    keywords: [
      'coursera', 'udemy', 'unacademy', 'byjus', 'vedantu', 'physicswallah',
      'school fees', 'college fees', 'tuition', 'books', 'stationery',
      'chegg', 'skill india', 'edx', 'linkedin learning', 'masterclass',
      'fees', 'admission', 'examination fee',
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance & Finance',
    color: '#A855F7',
    emoji: '🛡️',
    priority: 13,
    keywords: [
      'lic', 'hdfc life', 'icici prudential', 'max life', 'sbi life',
      'bajaj allianz', 'star health', 'niva bupa', 'policybazaar',
      'insurance premium', 'emi', 'loan', 'home loan', 'car loan',
      'personal loan', 'credit card payment', 'hdfc ergo', 'new india',
      'digit insurance', 'acko', 'go digit',
    ],
  },
  {
    id: 'personal',
    label: 'Personal Care',
    color: '#EC4899',
    emoji: '💅',
    priority: 14,
    keywords: [
      'salon', 'parlour', 'spa', 'grooming', 'nykaa', 'mamaearth',
      'wow skin', 'the ordinary', 'plum', 'bbcream', 'moisturizer',
      'shampoo', 'loreal', 'lakme', 'himalaya', 'forest essentials',
      'biotique', 'dove', 'gillette', 'barbershop',
    ],
  },
  {
    id: 'charity',
    label: 'Charity & Gifts',
    color: '#F472B6',
    emoji: '🎁',
    priority: 15,
    keywords: [
      'donation', 'charity', 'ngo', 'temple', 'masjid', 'church',
      'gift', 'giveindia', 'ketto', 'milaap', 'goonj', 'akshaya patra',
      'cry', 'helpage', 'sewa', 'pm cares', 'pm relief',
    ],
  },
  {
    id: 'transfers',
    label: 'UPI & Transfers',
    color: '#94A3B8',
    emoji: '💸',
    priority: 16,
    keywords: [
      'upi', 'neft', 'imps', 'rtgs', 'transfer to', 'sent to',
      'phonepe', 'gpay', 'google pay', 'paytm', 'bhim',
      'tez', 'mobikwik', 'freecharge', 'amazon pay',
    ],
  },
  {
    id: 'atm',
    label: 'ATM & Cash',
    color: '#F43F5E',
    emoji: '🏧',
    priority: 17,
    keywords: [
      'atm', 'cash withdrawal', 'cwdl', 'cash deposit', 'cdm',
    ],
  },
  {
    id: 'others',
    label: 'Others',
    color: '#CBD5E1',
    emoji: '📦',
    priority: 99,
    keywords: [],
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c])
)

export function getCategoryById(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP['others']
}

export function getCategoryByLabel(label) {
  return CATEGORIES.find(c => c.label.toLowerCase() === label.toLowerCase()) || CATEGORY_MAP['others']
}
