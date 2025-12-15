/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit'
import flowsReducer from './slices/flowsSlice'
import nodeTypesReducer from './slices/nodeTypesSlice'
import workflowEditorReducer from './slices/workflowEditorSlice'
import uiReducer from './slices/uiSlice'
import knowledgeBaseReducer from './slices/knowledgeBaseSlice'
import { listenerMiddleware } from './middleware/listenerMiddleware'

import workspaceReducer from './slices/workspaceSlice'
import notificationsReducer from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    flows: flowsReducer,
    nodeTypes: nodeTypesReducer,
    workflowEditor: workflowEditorReducer,
    ui: uiReducer,
    knowledgeBase: knowledgeBaseReducer,
    workspace: workspaceReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'workflowEditor/setNodes',
          'workflowEditor/setEdges',
          'knowledgeBase/toggleSelection',
          'knowledgeBase/toggleSelectAll',
        ],
        ignoredActionPaths: ['payload.icon', 'payload.selectedIds'],
        ignoredPaths: [
          'nodeTypes.items',
          'workflowEditor.nodes',
          'knowledgeBase.selectedIds',
        ],
      },
    }).prepend(listenerMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
