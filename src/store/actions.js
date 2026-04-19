/**
 * Action type constants
 */
export const ACTIONS = {
  ADD_FILES: 'ADD_FILES',
  UPDATE_PARSE_PROGRESS: 'UPDATE_PARSE_PROGRESS',
  STATEMENT_PARSED: 'STATEMENT_PARSED',
  STATEMENT_ERROR: 'STATEMENT_ERROR',
  REMOVE_STATEMENT: 'REMOVE_STATEMENT',
  SET_VIEW: 'SET_VIEW',
  TOGGLE_BANK_FILTER: 'TOGGLE_BANK_FILTER',
  TOGGLE_MONTH_FILTER: 'TOGGLE_MONTH_FILTER',
  SET_CATEGORY: 'SET_CATEGORY',
  SET_SEARCH: 'SET_SEARCH',
  SET_SORT: 'SET_SORT',
  SET_TYPE_FILTER: 'SET_TYPE_FILTER',
  SET_AMOUNT_FILTER: 'SET_AMOUNT_FILTER',
  SET_DATE_FILTER: 'SET_DATE_FILTER',
  RECATEGORIZE_TRANSACTION: 'RECATEGORIZE_TRANSACTION',
  LOAD_DEMO: 'LOAD_DEMO',
  RESET: 'RESET',
  TOGGLE_THEME: 'TOGGLE_THEME',
  TOGGLE_INCLUDE_TRANSFERS: 'TOGGLE_INCLUDE_TRANSFERS',
  SET_BANK_MANUAL: 'SET_BANK_MANUAL',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
}

// Action creators
export const actions = {
  addFiles: (statements) => ({ type: ACTIONS.ADD_FILES, payload: statements }),

  updateParseProgress: (statementId, progress, transactionCount) => ({
    type: ACTIONS.UPDATE_PARSE_PROGRESS,
    payload: { statementId, progress, transactionCount },
  }),

  statementParsed: (statementId, data) => ({
    type: ACTIONS.STATEMENT_PARSED,
    payload: { statementId, data },
  }),

  statementError: (statementId, error) => ({
    type: ACTIONS.STATEMENT_ERROR,
    payload: { statementId, error },
  }),

  removeStatement: (statementId) => ({
    type: ACTIONS.REMOVE_STATEMENT,
    payload: statementId,
  }),

  setView: (view) => ({ type: ACTIONS.SET_VIEW, payload: view }),

  toggleBankFilter: (bankId) => ({
    type: ACTIONS.TOGGLE_BANK_FILTER,
    payload: bankId,
  }),

  toggleMonthFilter: (month) => ({
    type: ACTIONS.TOGGLE_MONTH_FILTER,
    payload: month,
  }),

  setCategory: (category) => ({
    type: ACTIONS.SET_CATEGORY,
    payload: category,
  }),

  setSearch: (query) => ({
    type: ACTIONS.SET_SEARCH,
    payload: query,
  }),

  setSort: (sortBy, sortOrder) => ({
    type: ACTIONS.SET_SORT,
    payload: { sortBy, sortOrder },
  }),

  setTypeFilter: (typeFilter) => ({
    type: ACTIONS.SET_TYPE_FILTER,
    payload: typeFilter,
  }),

  setAmountFilter: (min, max) => ({
    type: ACTIONS.SET_AMOUNT_FILTER,
    payload: { min, max },
  }),

  setDateFilter: (from, to) => ({
    type: ACTIONS.SET_DATE_FILTER,
    payload: { from, to },
  }),

  recategorizeTransaction: (transactionId, newCategory) => ({
    type: ACTIONS.RECATEGORIZE_TRANSACTION,
    payload: { transactionId, newCategory },
  }),

  loadDemo: (statements) => ({
    type: ACTIONS.LOAD_DEMO,
    payload: statements,
  }),

  reset: () => ({ type: ACTIONS.RESET }),

  toggleTheme: () => ({ type: ACTIONS.TOGGLE_THEME }),

  toggleIncludeTransfers: () => ({ type: ACTIONS.TOGGLE_INCLUDE_TRANSFERS }),

  setBankManual: (statementId, bankId) => ({
    type: ACTIONS.SET_BANK_MANUAL,
    payload: { statementId, bankId },
  }),

  clearFilters: () => ({ type: ACTIONS.CLEAR_FILTERS }),
}
