import {Draft, PayloadAction, createSlice} from '@reduxjs/toolkit';

import {GitRepo, GitSliceState} from '@models/git';

import {setRootFolder} from '@redux/thunks/setRootFolder';

import {gitInitialState} from './git.initialState';

export const gitSlice = createSlice({
  name: 'git',
  initialState: gitInitialState,
  reducers: {
    setRepo: (state: Draft<GitSliceState>, action: PayloadAction<GitRepo>) => {
      state.repo = action.payload;
    },
    clearRepo: (state: Draft<GitSliceState>) => {
      state.repo = undefined;
    },
  },
  extraReducers: builder => {
    builder.addCase(setRootFolder.fulfilled, (state, action) => {
      state.repo = action.payload.gitRepo;
    });
  },
});

export const {setRepo, clearRepo} = gitSlice.actions;
export default gitSlice.reducer;
