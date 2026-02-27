import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

interface AppState {
  currentProjectId: string | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  selectedIssueId: string | null;
  createModalOpen: boolean;
  searchOpen: boolean;
}

type AppAction =
  | { type: 'SET_CURRENT_PROJECT'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SELECT_ISSUE'; payload: string | null }
  | { type: 'TOGGLE_CREATE_MODAL' }
  | { type: 'SET_CREATE_MODAL'; payload: boolean }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'SET_SEARCH'; payload: boolean };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      localStorage.setItem('canopy_currentProject', action.payload || '');
      return { ...state, currentProjectId: action.payload };
    case 'TOGGLE_SIDEBAR':
      localStorage.setItem('canopy_sidebarCollapsed', String(!state.sidebarCollapsed));
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SIDEBAR':
      localStorage.setItem('canopy_sidebarCollapsed', String(action.payload));
      return { ...state, sidebarCollapsed: action.payload };
    case 'SET_THEME':
      localStorage.setItem('canopy_theme', action.payload);
      return { ...state, theme: action.payload };
    case 'SELECT_ISSUE':
      return { ...state, selectedIssueId: action.payload };
    case 'TOGGLE_CREATE_MODAL':
      return { ...state, createModalOpen: !state.createModalOpen };
    case 'SET_CREATE_MODAL':
      return { ...state, createModalOpen: action.payload };
    case 'TOGGLE_SEARCH':
      return { ...state, searchOpen: !state.searchOpen };
    case 'SET_SEARCH':
      return { ...state, searchOpen: action.payload };
    default:
      return state;
  }
}

const initialState: AppState = {
  currentProjectId: localStorage.getItem('canopy_currentProject') || null,
  sidebarCollapsed: localStorage.getItem('canopy_sidebarCollapsed') === 'true',
  theme: (localStorage.getItem('canopy_theme') as 'light' | 'dark') || 'light',
  selectedIssueId: null,
  createModalOpen: false,
  searchOpen: false,
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setCurrentProject: (id: string | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  selectIssue: (id: string | null) => void;
  toggleCreateModal: () => void;
  toggleSearch: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentProject = useCallback((id: string | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: id });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const selectIssue = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ISSUE', payload: id });
  }, []);

  const toggleCreateModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_CREATE_MODAL' });
  }, []);

  const toggleSearch = useCallback(() => {
    dispatch({ type: 'TOGGLE_SEARCH' });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      setCurrentProject, toggleSidebar, setTheme,
      selectIssue, toggleCreateModal, toggleSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
