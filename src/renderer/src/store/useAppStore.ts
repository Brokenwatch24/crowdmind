import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProviderId } from '@shared/types'

interface AppState {
  currentWorkspaceId: string | null
  currentProvider: ProviderId
  currentModel: string | null
  setCurrentWorkspaceId: (id: string | null) => void
  setCurrentProvider: (provider: ProviderId) => void
  setCurrentModel: (model: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      currentProvider: 'local',
      currentModel: null,
      setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
      setCurrentProvider: (provider) => set({ currentProvider: provider, currentModel: null }),
      setCurrentModel: (model) => set({ currentModel: model })
    }),
    { name: 'crowdmind-app-state' }
  )
)
