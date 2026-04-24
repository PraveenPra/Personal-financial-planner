import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Modal state
  modal: null,     // 'addTransaction' | 'editTransaction' | 'setBudget' | 'addGoal' | 'editGoal' | 'contribute' | null
  modalData: null, // payload for the modal (e.g. transaction to edit)
  openModal: (modal, data = null) => set({ modal, modalData: data }),
  closeModal: () => set({ modal: null, modalData: null }),

  // Transaction filters
  txFilter: {
    search: '',
    type: 'all',       // 'all' | 'income' | 'expense'
    category: 'all',
    dateFrom: '',
    dateTo: '',
  },
  setTxFilter: (updates) =>
    set((s) => ({ txFilter: { ...s.txFilter, ...updates } })),
  resetTxFilter: () =>
    set({ txFilter: { search: '', type: 'all', category: 'all', dateFrom: '', dateTo: '' } }),
}));
