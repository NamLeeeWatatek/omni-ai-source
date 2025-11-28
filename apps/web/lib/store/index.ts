/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit'
import flowsReducer from './slices/flowsSlice'
import nodeTypesReducer from './slices/nodeTypesSlice'
import workflowEditorReducer from './slices/workflowEditorSlice'
import uiReducer from './slices/uiSlice'
import { listenerMiddleware } from './middleware/listenerMiddleware'

export const store = configureStore({
  reducer: {
    flows: flowsReducer,
    nodeTypes: nodeTypesReducer,
    workflowEditor: workflowEditorReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['workflowEditor/setNodes', 'workflowEditor/setEdges'],
        ignoredActionPaths: ['payload.icon'],
        ignoredPaths: ['nodeTypes.items', 'workflowEditor.nodes'],
      },
    }).prepend(listenerMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
