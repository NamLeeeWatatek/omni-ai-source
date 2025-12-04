import { createSlice } from '@reduxjs/toolkit'

interface UiState {
}

const initialState: UiState = {}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {},
})

export default uiSlice.reducer
