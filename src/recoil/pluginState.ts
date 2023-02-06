import { FolderSortingOption } from 'modals';
import { TFile, TFolder } from 'obsidian';
import { atom } from 'recoil';
import { FolderTree, FolderFileCountMap } from 'utils/types';

export const view = atom({
    key: 'fileTreeViewState',
    default: 'folder',
});

export const activeFolderPath = atom({
    key: 'fileTreeActiveFolderPathState',
    default: '',
});

export const activeFile = atom({
    key: 'fileTreeActiveFile',
    default: null as TFile,
    dangerouslyAllowMutability: true,
});

export const excludedFolders = atom({
    key: 'fileTreeExcludedFoldersState',
    default: [] as string[],
});

export const excludedExtensions = atom({
    key: 'fileTreeExcludedExtensions',
    default: [] as string[],
});

export const folderFileCountMap = atom({
    key: 'fileTreeFolderFileCountMapState',
    default: {} as FolderFileCountMap,
});

export const folderTree = atom({
    key: 'fileTreeFolderTreeState',
    default: null as FolderTree,
    dangerouslyAllowMutability: true,
});

export const fileList = atom({
    key: 'fileTreeFileListState',
    default: [] as TFile[],
    dangerouslyAllowMutability: true,
});

export const pinnedFiles = atom({
    key: 'fileTreePinnedFilesState',
    default: [] as TFile[],
    dangerouslyAllowMutability: true,
});
// folderSortingOptions
export const folderSortingOptions = atom({
    key: 'fileTreeFolderSortingOptionsState',
    default: [] as FolderSortingOption[],
    dangerouslyAllowMutability: true,
});

export const openFolders = atom({
    key: 'fileTreeOpenFoldersState',
    default: [] as string[],
});

export const showSubFolders = atom({
    key: 'showSubFoldersInVault',
    default: false,
});

export const focusedFolder = atom({
    key: 'fileTreeFocusedFolder',
    default: null as TFolder,
    dangerouslyAllowMutability: true,
});

export const sortFilesByNameAscFolders = atom({
    key: 'fileTreeSortFilesByNameAscFolders',
    default: [] as string[],
});

export const sortFilesByNameDescFolders = atom({
    key: 'fileTreeSortFilesByNameDescFolders',
    default: [] as string[],
});

export const sortFilesByCreatedTimeAscFolders = atom({
    key: 'fileTreeSortFilesByCreatedTimeAscFolders',
    default: [] as string[],
});

export const sortFilesByCreatedTimeDescFolders = atom({
    key: 'fileTreeSortFilesByCreatedTimeDescFolders',
    default: [] as string[],
});

export const sortFilesByUpdatedTimeAscFolders = atom({
    key: 'fileTreeSortFilesByUpdatedTimeAscFolders',
    default: [] as string[],
});

export const sortFilesByUpdatedTimeDescFolders = atom({
    key: 'fileTreeSortFilesByUpdatedTimeDescFolders',
    default: [] as string[],
});