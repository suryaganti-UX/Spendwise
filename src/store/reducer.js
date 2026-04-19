import { ACTIONS } from './actions.js'
import { BANKS } from '../constants/banks.js'

export const INITIAL_STATE = {
  // App flow state
  status: 'idle', // 'idle' | 'uploading' | 'processing' | 'complete' | 'error' | 'demo'

  // Statements
  statements: [],

  // Dashboard view
  activeView: 'overview', // 'overview' | 'by-bank' | 'by-month' | 'transactions'

  // Filters
  selectedBanks: [], // empty = all banks included
  selectedMonths: [], // empty = all months included
  selectedCategory: null,
  typeFilter: 'all', // 'all' | 'debit' | 'credit'
  amountFilter: { min: null, max: null },
  dateFilter: { from: null, to: null },
  includeTransfers: false, // exclude cross-bank transfers from totals

  // Search & sort
  searchQuery: '',
  sortBy: 'date', // 'date' | 'amount' | 'category'
  sortOrder: 'desc',

  // UI state
  darkMode: false,
  isDemoMode: false,

  // User-defined recategorization rules (session only)
  userRules: [], // [{ keyword: string, category: string }]
  recategorizedCount: 0,
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_FILES: {
      const newStatements = action.payload
      const allStatements = [...state.statements, ...newStatements]
      return {
        ...state,
        status: 'uploading',
        statements: allStatements,
      }
    }

    case ACTIONS.UPDATE_PARSE_PROGRESS: {
      const { statementId, progress, transactionCount } = action.payload
      return {
        ...state,
        statements: state.statements.map(stmt =>
          stmt.id === statementId
            ? {
                ...stmt,
                parseProgress: progress,
                parseStatus: 'parsing',
                transactionCount: transactionCount || stmt.transactionCount || 0,
              }
            : stmt
        ),
      }
    }

    case ACTIONS.STATEMENT_PARSED: {
      const { statementId, data } = action.payload
      const updatedStatements = state.statements.map(stmt =>
        stmt.id === statementId
          ? { ...stmt, ...data, parseStatus: 'done', parseProgress: 100, parseError: null }
          : stmt
      )

      // Check if all statements are done (or errored)
      const allDone = updatedStatements.every(
        s => s.parseStatus === 'done' || s.parseStatus === 'error'
      )
      const anyDone = updatedStatements.some(s => s.parseStatus === 'done')

      return {
        ...state,
        status: allDone ? (anyDone ? 'complete' : 'error') : 'processing',
        statements: updatedStatements,
      }
    }

    case ACTIONS.STATEMENT_ERROR: {
      const { statementId, error } = action.payload
      const updatedStatements = state.statements.map(stmt =>
        stmt.id === statementId
          ? { ...stmt, parseStatus: 'error', parseError: error, parseProgress: 0 }
          : stmt
      )

      const allDone = updatedStatements.every(
        s => s.parseStatus === 'done' || s.parseStatus === 'error'
      )
      const anyDone = updatedStatements.some(s => s.parseStatus === 'done')

      return {
        ...state,
        status: allDone ? (anyDone ? 'complete' : 'error') : 'processing',
        statements: updatedStatements,
      }
    }

    case ACTIONS.REMOVE_STATEMENT: {
      const filtered = state.statements.filter(s => s.id !== action.payload)
      const anyComplete = filtered.some(s => s.parseStatus === 'done')
      return {
        ...state,
        statements: filtered,
        status: filtered.length === 0 ? 'idle' : (anyComplete ? 'complete' : state.status),
      }
    }

    case ACTIONS.SET_VIEW: {
      return { ...state, activeView: action.payload }
    }

    case ACTIONS.TOGGLE_BANK_FILTER: {
      const bankId = action.payload
      const current = state.selectedBanks
      const isSelected = current.includes(bankId)
      return {
        ...state,
        selectedBanks: isSelected
          ? current.filter(b => b !== bankId)
          : [...current, bankId],
      }
    }

    case ACTIONS.TOGGLE_MONTH_FILTER: {
      const month = action.payload
      const current = state.selectedMonths
      const isSelected = current.includes(month)
      return {
        ...state,
        selectedMonths: isSelected
          ? current.filter(m => m !== month)
          : [...current, month],
      }
    }

    case ACTIONS.SET_CATEGORY: {
      return {
        ...state,
        selectedCategory: state.selectedCategory === action.payload ? null : action.payload,
      }
    }

    case ACTIONS.SET_SEARCH: {
      return { ...state, searchQuery: action.payload }
    }

    case ACTIONS.SET_SORT: {
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      }
    }

    case ACTIONS.SET_TYPE_FILTER: {
      return { ...state, typeFilter: action.payload }
    }

    case ACTIONS.SET_AMOUNT_FILTER: {
      return {
        ...state,
        amountFilter: action.payload,
      }
    }

    case ACTIONS.SET_DATE_FILTER: {
      return {
        ...state,
        dateFilter: action.payload,
      }
    }

    case ACTIONS.RECATEGORIZE_TRANSACTION: {
      const { transactionId, newCategory } = action.payload

      // Find the transaction to derive a rule
      let newRule = null
      for (const stmt of state.statements) {
        const txn = (stmt.transactions || []).find(t => t.id === transactionId)
        if (txn) {
          // Create a session rule from first 2 words of description
          const words = (txn.description || '').toLowerCase().split(/\s+/).slice(0, 2).join(' ')
          if (words) {
            newRule = { keyword: words, category: newCategory }
          }
          break
        }
      }

      const updatedStatements = state.statements.map(stmt => ({
        ...stmt,
        transactions: (stmt.transactions || []).map(txn =>
          txn.id === transactionId
            ? { ...txn, category: newCategory, userModified: true }
            : txn
        ),
      }))

      return {
        ...state,
        statements: updatedStatements,
        recategorizedCount: state.recategorizedCount + 1,
        userRules: newRule ? [...state.userRules, newRule] : state.userRules,
      }
    }

    case ACTIONS.LOAD_DEMO: {
      return {
        ...state,
        status: 'complete',
        statements: action.payload,
        isDemoMode: true,
        selectedBanks: [],
        selectedMonths: [],
      }
    }

    case ACTIONS.RESET: {
      return {
        ...INITIAL_STATE,
        darkMode: state.darkMode,
      }
    }

    case ACTIONS.TOGGLE_THEME: {
      return { ...state, darkMode: !state.darkMode }
    }

    case ACTIONS.TOGGLE_INCLUDE_TRANSFERS: {
      return { ...state, includeTransfers: !state.includeTransfers }
    }

    case ACTIONS.SET_BANK_MANUAL: {
      const { statementId, bankId } = action.payload
      const bankMeta = BANKS[bankId]
      return {
        ...state,
        statements: state.statements.map(stmt =>
          stmt.id === statementId
            ? {
                ...stmt,
                bank: bankId,
                bankLabel: bankMeta?.label || bankId,
                bankColor: bankMeta?.color || '#6B6864',
              }
            : stmt
        ),
      }
    }

    case ACTIONS.CLEAR_FILTERS: {
      return {
        ...state,
        selectedBanks: [],
        selectedMonths: [],
        selectedCategory: null,
        typeFilter: 'all',
        amountFilter: { min: null, max: null },
        dateFilter: { from: null, to: null },
        searchQuery: '',
      }
    }

    default:
      return state
  }
}
