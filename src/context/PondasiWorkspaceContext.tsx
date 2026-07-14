import { createContext, useContext, type ReactNode } from 'react';
import {
  usePondasiWorkspaceState,
  type PondasiWorkspaceState,
} from '../hooks/usePondasiWorkspaceState';

const PondasiWorkspaceContext = createContext<PondasiWorkspaceState | null>(null);

type PondasiWorkspaceProviderProps = {
  projectId: string;
  children: ReactNode;
};

export function PondasiWorkspaceProvider({ projectId, children }: PondasiWorkspaceProviderProps) {
  const workspaceState = usePondasiWorkspaceState(projectId);

  return (
    <PondasiWorkspaceContext.Provider value={workspaceState}>
      {children}
    </PondasiWorkspaceContext.Provider>
  );
}

export function usePondasiWorkspace(): PondasiWorkspaceState {
  const context = useContext(PondasiWorkspaceContext);

  if (!context) {
    throw new Error('usePondasiWorkspace must be used within PondasiWorkspaceProvider.');
  }

  return context;
}
