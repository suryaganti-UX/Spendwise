import { categorizeTransaction } from './categorize.js'

/**
 * Mock data representing 3 realistic Indian bank statements
 * HDFC: 3 months (Jan-Mar 2025), salary account
 * ICICI: 2 months (Feb-Mar 2025), credit card style
 * SBI: 1 month (Mar 2025), savings account with cross-bank transfers
 */

function makeId(bank, index) {
  return `${bank}_mock_${index}`
}

function d(dateStr) {
  // Parse DD/MM/YYYY and shift forward by 1 year
  const [day, month, year] = dateStr.split('/').map(Number)
  return new Date(year + 1, month - 1, day)
}

// Raw transaction data before categorization
const HDFC_RAW = [
  // January 2024
  { date: '01/01/2024', desc: 'SALARY CREDIT - TechCorp India Pvt Ltd', amount: 85000, type: 'credit', balance: 142000 },
  { date: '01/01/2024', desc: 'HDFC House Rent Jan 2024', amount: 25000, type: 'debit', balance: 117000 },
  { date: '02/01/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 450, type: 'debit', balance: 116550 },
  { date: '03/01/2024', desc: 'UPI-BigBasket Groceries', amount: 1850, type: 'debit', balance: 114700 },
  { date: '04/01/2024', desc: 'UPI-Zomato Order', amount: 380, type: 'debit', balance: 114320 },
  { date: '05/01/2024', desc: 'NEFT-SBI Transfer Own Account', amount: 10000, type: 'debit', balance: 104320 },
  { date: '06/01/2024', desc: 'UPI-Uber Technologies', amount: 280, type: 'debit', balance: 104040 },
  { date: '07/01/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 520, type: 'debit', balance: 103520 },
  { date: '08/01/2024', desc: 'Amazon Pay ICICI Credit Card', amount: 8500, type: 'debit', balance: 95020 },
  { date: '10/01/2024', desc: 'BESCOM Electricity Bill', amount: 1200, type: 'debit', balance: 93820 },
  { date: '10/01/2024', desc: 'Airtel Postpaid Bill', amount: 599, type: 'debit', balance: 93221 },
  { date: '11/01/2024', desc: 'UPI-Netflix Subscription', amount: 649, type: 'debit', balance: 92572 },
  { date: '12/01/2024', desc: 'UPI-Spotify India', amount: 119, type: 'debit', balance: 92453 },
  { date: '13/01/2024', desc: 'UPI-Zomato Order', amount: 340, type: 'debit', balance: 92113 },
  { date: '14/01/2024', desc: 'HP Petrol Pump', amount: 3000, type: 'debit', balance: 89113 },
  { date: '15/01/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 680, type: 'debit', balance: 88433 },
  { date: '16/01/2024', desc: 'GROWW MUTUAL FUND SIP', amount: 5000, type: 'debit', balance: 83433 },
  { date: '17/01/2024', desc: 'ATM CASH WITHDRAWAL', amount: 5000, type: 'debit', balance: 78433 },
  { date: '18/01/2024', desc: 'UPI-Amazon Shopping', amount: 2499, type: 'debit', balance: 75934 },
  { date: '19/01/2024', desc: 'UPI-Zomato Order', amount: 290, type: 'debit', balance: 75644 },
  { date: '20/01/2024', desc: 'UPI-OLA Cabs', amount: 450, type: 'debit', balance: 75194 },
  { date: '21/01/2024', desc: 'UPI-DMart Supermarket', amount: 2300, type: 'debit', balance: 72894 },
  { date: '22/01/2024', desc: 'LIC Premium Payment', amount: 4500, type: 'debit', balance: 68394 },
  { date: '23/01/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 390, type: 'debit', balance: 68004 },
  { date: '24/01/2024', desc: 'HDFC ERGO Health Insurance', amount: 2083, type: 'debit', balance: 65921 },
  { date: '25/01/2024', desc: 'UPI-BookMyShow Movies', amount: 750, type: 'debit', balance: 65171 },
  { date: '26/01/2024', desc: 'UPI-Flipkart Shopping', amount: 1299, type: 'debit', balance: 63872 },
  { date: '27/01/2024', desc: 'CASHBACK REWARD CREDITED', amount: 250, type: 'credit', balance: 64122 },
  { date: '28/01/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 550, type: 'debit', balance: 63572 },
  { date: '29/01/2024', desc: 'UPI-Zepto Grocery', amount: 890, type: 'debit', balance: 62682 },
  { date: '30/01/2024', desc: 'UPI-Rapido Bike Taxi', amount: 120, type: 'debit', balance: 62562 },
  { date: '31/01/2024', desc: 'INTEREST CREDITED', amount: 320, type: 'credit', balance: 62882 },

  // February 2024
  { date: '01/02/2024', desc: 'SALARY CREDIT - TechCorp India Pvt Ltd', amount: 85000, type: 'credit', balance: 147882 },
  { date: '01/02/2024', desc: 'HDFC House Rent Feb 2024', amount: 25000, type: 'debit', balance: 122882 },
  { date: '02/02/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 480, type: 'debit', balance: 122402 },
  { date: '03/02/2024', desc: 'UPI-BigBasket Groceries', amount: 2100, type: 'debit', balance: 120302 },
  { date: '04/02/2024', desc: 'UPI-Zomato Order', amount: 420, type: 'debit', balance: 119882 },
  { date: '05/02/2024', desc: 'UPI-Amazon Shopping', amount: 3200, type: 'debit', balance: 116682 },
  { date: '06/02/2024', desc: 'UPI-Uber Technologies', amount: 320, type: 'debit', balance: 116362 },
  { date: '07/02/2024', desc: 'Airtel Broadband Bill', amount: 999, type: 'debit', balance: 115363 },
  { date: '08/02/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 610, type: 'debit', balance: 114753 },
  { date: '09/02/2024', desc: 'BESCOM Electricity Bill', amount: 1350, type: 'debit', balance: 113403 },
  { date: '10/02/2024', desc: 'UPI-Netflix Subscription', amount: 649, type: 'debit', balance: 112754 },
  { date: '11/02/2024', desc: 'UPI-Spotify India', amount: 119, type: 'debit', balance: 112635 },
  { date: '12/02/2024', desc: 'GROWW MUTUAL FUND SIP', amount: 5000, type: 'debit', balance: 107635 },
  { date: '13/02/2024', desc: 'HP Petrol Pump BPCL', amount: 3500, type: 'debit', balance: 104135 },
  { date: '14/02/2024', desc: 'UPI-Zomato Valentine Special', amount: 980, type: 'debit', balance: 103155 },
  { date: '15/02/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 550, type: 'debit', balance: 102605 },
  { date: '16/02/2024', desc: 'UPI-Myntra Fashion', amount: 1899, type: 'debit', balance: 100706 },
  { date: '17/02/2024', desc: 'UPI-DMart Supermarket', amount: 2450, type: 'debit', balance: 98256 },
  { date: '18/02/2024', desc: 'ATM CASH WITHDRAWAL', amount: 3000, type: 'debit', balance: 95256 },
  { date: '19/02/2024', desc: 'UPI-OLA Cabs', amount: 380, type: 'debit', balance: 94876 },
  { date: '20/02/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 420, type: 'debit', balance: 94456 },
  { date: '21/02/2024', desc: 'FastTag Toll Payment', amount: 250, type: 'debit', balance: 94206 },
  { date: '22/02/2024', desc: 'UPI-Coursera Online Learning', amount: 2999, type: 'debit', balance: 91207 },
  { date: '23/02/2024', desc: 'UPI-Zomato Order', amount: 350, type: 'debit', balance: 90857 },
  { date: '24/02/2024', desc: 'LIC Premium Payment', amount: 4500, type: 'debit', balance: 86357 },
  { date: '25/02/2024', desc: 'HDFC ERGO Health Insurance', amount: 2083, type: 'debit', balance: 84274 },
  { date: '26/02/2024', desc: 'UPI-PVR Cinemas', amount: 850, type: 'debit', balance: 83424 },
  { date: '27/02/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 490, type: 'debit', balance: 82934 },
  { date: '28/02/2024', desc: 'INTEREST CREDITED', amount: 290, type: 'credit', balance: 83224 },
  { date: '29/02/2024', desc: 'UPI-BigBasket Groceries', amount: 1650, type: 'debit', balance: 81574 },

  // March 2024
  { date: '01/03/2024', desc: 'SALARY CREDIT - TechCorp India Pvt Ltd', amount: 85000, type: 'credit', balance: 166574 },
  { date: '01/03/2024', desc: 'HDFC House Rent Mar 2024', amount: 25000, type: 'debit', balance: 141574 },
  { date: '02/03/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 520, type: 'debit', balance: 141054 },
  { date: '03/03/2024', desc: 'UPI-BigBasket Groceries', amount: 2200, type: 'debit', balance: 138854 },
  { date: '04/03/2024', desc: 'UPI-Zomato Order', amount: 460, type: 'debit', balance: 138394 },
  { date: '05/03/2024', desc: 'NEFT-SBI Transfer Own Account', amount: 15000, type: 'debit', balance: 123394 },
  { date: '06/03/2024', desc: 'UPI-Uber Technologies', amount: 350, type: 'debit', balance: 123044 },
  { date: '07/03/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 680, type: 'debit', balance: 122364 },
  { date: '08/03/2024', desc: 'Amazon Pay Shopping', amount: 4299, type: 'debit', balance: 118065 },
  { date: '09/03/2024', desc: 'BESCOM Electricity Bill', amount: 1100, type: 'debit', balance: 116965 },
  { date: '10/03/2024', desc: 'Airtel Postpaid Bill', amount: 599, type: 'debit', balance: 116366 },
  { date: '11/03/2024', desc: 'UPI-Netflix Subscription', amount: 649, type: 'debit', balance: 115717 },
  { date: '12/03/2024', desc: 'UPI-Spotify India', amount: 119, type: 'debit', balance: 115598 },
  { date: '13/03/2024', desc: 'HP Petrol Pump IOCL', amount: 2800, type: 'debit', balance: 112798 },
  { date: '14/03/2024', desc: 'UPI-Zomato Order', amount: 380, type: 'debit', balance: 112418 },
  { date: '15/03/2024', desc: 'GROWW MUTUAL FUND SIP', amount: 5000, type: 'debit', balance: 107418 },
  { date: '16/03/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 730, type: 'debit', balance: 106688 },
  { date: '17/03/2024', desc: 'UPI-DMart Supermarket', amount: 3100, type: 'debit', balance: 103588 },
  { date: '18/03/2024', desc: 'UPI-Amazon Shopping', amount: 5999, type: 'debit', balance: 97589 },
  { date: '19/03/2024', desc: 'ATM CASH WITHDRAWAL', amount: 4000, type: 'debit', balance: 93589 },
  { date: '20/03/2024', desc: 'UPI-OLA Cabs', amount: 420, type: 'debit', balance: 93169 },
  { date: '21/03/2024', desc: 'LIC Premium Payment', amount: 4500, type: 'debit', balance: 88669 },
  { date: '22/03/2024', desc: 'HDFC ERGO Health Insurance', amount: 2083, type: 'debit', balance: 86586 },
  { date: '23/03/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 450, type: 'debit', balance: 86136 },
  { date: '24/03/2024', desc: 'UPI-Zepto Grocery', amount: 1100, type: 'debit', balance: 85036 },
  { date: '25/03/2024', desc: 'REFUND - Amazon Return', amount: 1299, type: 'credit', balance: 86335 },
  { date: '26/03/2024', desc: 'UPI-Decathlon Sports', amount: 2500, type: 'debit', balance: 83835 },
  { date: '27/03/2024', desc: 'UPI-Zomato Order', amount: 320, type: 'debit', balance: 83515 },
  { date: '28/03/2024', desc: 'FastTag Toll Payment', amount: 180, type: 'debit', balance: 83335 },
  { date: '29/03/2024', desc: 'UPI-Swiggy Technologies Pvt Ltd', amount: 590, type: 'debit', balance: 82745 },
  { date: '30/03/2024', desc: 'INTEREST CREDITED', amount: 310, type: 'credit', balance: 83055 },
  { date: '31/03/2024', desc: 'UPI-JioSaavn Music', amount: 99, type: 'debit', balance: 82956 },
]

const ICICI_RAW = [
  // February 2024
  { date: '01/02/2024', desc: 'Payment Received - Thank You', amount: 35000, type: 'credit', balance: 35000 },
  { date: '02/02/2024', desc: 'SWIGGY ORDER', amount: 580, type: 'debit', balance: 34420 },
  { date: '03/02/2024', desc: 'ZOMATO ORDER', amount: 290, type: 'debit', balance: 34130 },
  { date: '04/02/2024', desc: 'AMAZON SHOPPING', amount: 2399, type: 'debit', balance: 31731 },
  { date: '05/02/2024', desc: 'NETFLIX SUBSCRIPTION', amount: 649, type: 'debit', balance: 31082 },
  { date: '06/02/2024', desc: 'NYKAA BEAUTY', amount: 1250, type: 'debit', balance: 29832 },
  { date: '07/02/2024', desc: 'SWIGGY ORDER', amount: 420, type: 'debit', balance: 29412 },
  { date: '08/02/2024', desc: 'UBER RIDE', amount: 250, type: 'debit', balance: 29162 },
  { date: '09/02/2024', desc: 'AMAZON PRIME ANNUAL', amount: 1499, type: 'debit', balance: 27663 },
  { date: '10/02/2024', desc: 'FLIPKART SHOPPING', amount: 3499, type: 'debit', balance: 24164 },
  { date: '11/02/2024', desc: 'ZOMATO ORDER', amount: 380, type: 'debit', balance: 23784 },
  { date: '12/02/2024', desc: 'APOLLO PHARMACY', amount: 650, type: 'debit', balance: 23134 },
  { date: '13/02/2024', desc: 'SWIGGY ORDER', amount: 510, type: 'debit', balance: 22624 },
  { date: '14/02/2024', desc: 'BOOKMYSHOW MOVIES', amount: 600, type: 'debit', balance: 22024 },
  { date: '15/02/2024', desc: 'MYNTRA FASHION', amount: 2299, type: 'debit', balance: 19725 },
  { date: '16/02/2024', desc: 'UBER RIDE', amount: 180, type: 'debit', balance: 19545 },
  { date: '17/02/2024', desc: 'BLINKIT GROCERY', amount: 950, type: 'debit', balance: 18595 },
  { date: '18/02/2024', desc: 'SWIGGY ORDER', amount: 680, type: 'debit', balance: 17915 },
  { date: '19/02/2024', desc: 'AMAZON SHOPPING', amount: 1899, type: 'debit', balance: 16016 },
  { date: '20/02/2024', desc: 'STARBUCKS COFFEE', amount: 480, type: 'debit', balance: 15536 },
  { date: '21/02/2024', desc: 'ZOMATO ORDER', amount: 450, type: 'debit', balance: 15086 },
  { date: '22/02/2024', desc: 'HOTSTAR SUBSCRIPTION', amount: 299, type: 'debit', balance: 14787 },
  { date: '23/02/2024', desc: 'SWIGGY ORDER', amount: 320, type: 'debit', balance: 14467 },
  { date: '24/02/2024', desc: 'AJIO FASHION', amount: 1799, type: 'debit', balance: 12668 },
  { date: '25/02/2024', desc: 'RAPIDO BIKE TAXI', amount: 90, type: 'debit', balance: 12578 },
  { date: '26/02/2024', desc: 'DOMINOS PIZZA', amount: 580, type: 'debit', balance: 11998 },
  { date: '27/02/2024', desc: 'ZOMATO ORDER', amount: 260, type: 'debit', balance: 11738 },
  { date: '28/02/2024', desc: 'SWIGGY ORDER', amount: 440, type: 'debit', balance: 11298 },
  { date: '29/02/2024', desc: 'AMAZON SHOPPING', amount: 3200, type: 'debit', balance: 8098 },

  // March 2024
  { date: '01/03/2024', desc: 'Payment Received - Thank You', amount: 40000, type: 'credit', balance: 40000 },
  { date: '02/03/2024', desc: 'SWIGGY ORDER', amount: 490, type: 'debit', balance: 39510 },
  { date: '03/03/2024', desc: 'ZOMATO ORDER', amount: 360, type: 'debit', balance: 39150 },
  { date: '04/03/2024', desc: 'AMAZON SHOPPING', amount: 4599, type: 'debit', balance: 34551 },
  { date: '05/03/2024', desc: 'SPOTIFY SUBSCRIPTION', amount: 119, type: 'debit', balance: 34432 },
  { date: '07/03/2024', desc: 'SWIGGY ORDER', amount: 620, type: 'debit', balance: 33812 },
  { date: '08/03/2024', desc: 'UBER RIDE', amount: 310, type: 'debit', balance: 33502 },
  { date: '09/03/2024', desc: 'BIGBASKET FRESH', amount: 1850, type: 'debit', balance: 31652 },
  { date: '10/03/2024', desc: 'NETFLIX SUBSCRIPTION', amount: 649, type: 'debit', balance: 31003 },
  { date: '11/03/2024', desc: 'MYNTRA FASHION', amount: 3299, type: 'debit', balance: 27704 },
  { date: '12/03/2024', desc: 'ZOMATO ORDER', amount: 410, type: 'debit', balance: 27294 },
  { date: '13/03/2024', desc: 'SWIGGY ORDER', amount: 580, type: 'debit', balance: 26714 },
  { date: '14/03/2024', desc: 'APOLLO PHARMACY', amount: 890, type: 'debit', balance: 25824 },
  { date: '15/03/2024', desc: 'AMAZON PRIME VIDEO', amount: 299, type: 'debit', balance: 25525 },
  { date: '16/03/2024', desc: 'KFC FAST FOOD', amount: 450, type: 'debit', balance: 25075 },
  { date: '17/03/2024', desc: 'SWIGGY ORDER', amount: 730, type: 'debit', balance: 24345 },
  { date: '18/03/2024', desc: 'FLIPKART SHOPPING', amount: 2799, type: 'debit', balance: 21546 },
  { date: '19/03/2024', desc: 'LENSKART EYEWEAR', amount: 3500, type: 'debit', balance: 18046 },
  { date: '20/03/2024', desc: 'ZOMATO ORDER', amount: 280, type: 'debit', balance: 17766 },
  { date: '21/03/2024', desc: 'BLINKIT GROCERY', amount: 1100, type: 'debit', balance: 16666 },
  { date: '22/03/2024', desc: 'SWIGGY ORDER', amount: 510, type: 'debit', balance: 16156 },
  { date: '23/03/2024', desc: 'ZEPTO GROCERY', amount: 780, type: 'debit', balance: 15376 },
  { date: '24/03/2024', desc: 'INOX CINEMAS', amount: 720, type: 'debit', balance: 14656 },
  { date: '25/03/2024', desc: 'AMAZON SHOPPING', amount: 1999, type: 'debit', balance: 12657 },
  { date: '26/03/2024', desc: 'SWIGGY ORDER', amount: 390, type: 'debit', balance: 12267 },
  { date: '27/03/2024', desc: 'OLA CABS', amount: 420, type: 'debit', balance: 11847 },
  { date: '28/03/2024', desc: 'DOMINOS PIZZA', amount: 650, type: 'debit', balance: 11197 },
  { date: '29/03/2024', desc: 'ZOMATO ORDER', amount: 320, type: 'debit', balance: 10877 },
  { date: '30/03/2024', desc: 'SWIGGY ORDER', amount: 480, type: 'debit', balance: 10397 },
  { date: '31/03/2024', desc: 'AMAZON SHOPPING', amount: 2300, type: 'debit', balance: 8097 },
]

const SBI_RAW = [
  // March 2024 (cross-bank transfers from HDFC)
  { date: '05/03/2024', desc: 'NEFT CREDIT FROM HDFC BANK Own Account Transfer', amount: 15000, type: 'credit', balance: 15000 },
  { date: '06/03/2024', desc: 'UPI-BigBasket Fresh Vegetables', amount: 1200, type: 'debit', balance: 13800 },
  { date: '08/03/2024', desc: 'UPI-Swiggy Order Restaurant', amount: 350, type: 'debit', balance: 13450 },
  { date: '10/03/2024', desc: 'MSEDCL Electricity Payment', amount: 980, type: 'debit', balance: 12470 },
  { date: '12/03/2024', desc: 'UPI-DMart Shopping', amount: 1800, type: 'debit', balance: 10670 },
  { date: '14/03/2024', desc: 'SBI Life Insurance Premium', amount: 3500, type: 'debit', balance: 7170 },
  { date: '15/03/2024', desc: 'UPI-Zomato Food Order', amount: 280, type: 'debit', balance: 6890 },
  { date: '17/03/2024', desc: 'PPF Deposit SBI', amount: 2000, type: 'debit', balance: 4890 },
  { date: '18/03/2024', desc: 'UPI-Amazon Retail', amount: 1599, type: 'debit', balance: 3291 },
  { date: '19/03/2024', desc: 'UPI-Rapido Bike Cab', amount: 95, type: 'debit', balance: 3196 },
  { date: '20/03/2024', desc: 'Interest Credited SBI Savings', amount: 450, type: 'credit', balance: 3646 },
  { date: '20/03/2024', desc: 'UPI-Reliance Fresh Grocery', amount: 650, type: 'debit', balance: 2996 },
  { date: '22/03/2024', desc: 'ATM Cash Withdrawal SBI Branch', amount: 2000, type: 'debit', balance: 996 },
  { date: '25/03/2024', desc: 'UPI-Swiggy Food Order', amount: 420, type: 'debit', balance: 576 },
  { date: '26/03/2024', desc: 'SALARY REIMBURSEMENT TechCorp', amount: 5000, type: 'credit', balance: 5576 },
  { date: '27/03/2024', desc: 'UPI-Uber Auto Ride', amount: 180, type: 'debit', balance: 5396 },
  { date: '28/03/2024', desc: 'UPI-Zepto Groceries', amount: 890, type: 'debit', balance: 4506 },
  { date: '29/03/2024', desc: 'UPI-Netflix Annual Plan', amount: 649, type: 'debit', balance: 3857 },
  { date: '30/03/2024', desc: 'UPI-BookMyShow Event Ticket', amount: 500, type: 'debit', balance: 3357 },
  { date: '31/03/2024', desc: 'UPI-JioFiber Broadband', amount: 999, type: 'debit', balance: 2358 },
]

function buildTransactions(rawList, bank, accountNumber) {
  return rawList.map((raw, index) => {
    const transaction = {
      id: makeId(bank, index),
      date: d(raw.date),
      description: raw.desc,
      amount: raw.amount,
      type: raw.type,
      balance: raw.balance,
      bank,
      rawText: raw.desc,
      accountNumber,
      category: 'others',
    }
    return transaction
  })
}

export const MOCK_HDFC_TRANSACTIONS = buildTransactions(HDFC_RAW, 'hdfc', '****3842')
export const MOCK_ICICI_TRANSACTIONS = buildTransactions(ICICI_RAW, 'icici', '****9217')
export const MOCK_SBI_TRANSACTIONS = buildTransactions(SBI_RAW, 'sbi', '****5601')

export function createMockStatements() {
  return [
    {
      id: 'mock_hdfc_1',
      filename: 'HDFC_Statement_Jan_Mar_2025.pdf',
      bank: 'hdfc',
      bankLabel: 'HDFC Bank',
      bankColor: '#004C8F',
      accountNumber: '****3842',
      dateRange: { from: new Date(2025, 0, 1), to: new Date(2025, 2, 31) },
      months: ['Jan 2025', 'Feb 2025', 'Mar 2025'],
      transactions: MOCK_HDFC_TRANSACTIONS,
      parseStatus: 'done',
      parseProgress: 100,
      parseError: null,
      skippedLines: 2,
      totalLines: 64,
    },
    {
      id: 'mock_icici_1',
      filename: 'ICICI_Statement_Feb_Mar_2025.pdf',
      bank: 'icici',
      bankLabel: 'ICICI Bank',
      bankColor: '#F37024',
      accountNumber: '****9217',
      dateRange: { from: new Date(2025, 1, 1), to: new Date(2025, 2, 31) },
      months: ['Feb 2025', 'Mar 2025'],
      transactions: MOCK_ICICI_TRANSACTIONS,
      parseStatus: 'done',
      parseProgress: 100,
      parseError: null,
      skippedLines: 1,
      totalLines: 60,
    },
    {
      id: 'mock_sbi_1',
      filename: 'SBI_Statement_Mar_2025.pdf',
      bank: 'sbi',
      bankLabel: 'State Bank of India',
      bankColor: '#2B3B8F',
      accountNumber: '****5601',
      dateRange: { from: new Date(2025, 2, 1), to: new Date(2025, 2, 31) },
      months: ['Mar 2025'],
      transactions: MOCK_SBI_TRANSACTIONS,
      parseStatus: 'done',
      parseProgress: 100,
      parseError: null,
      skippedLines: 0,
      totalLines: 20,
    },
  ]
}
