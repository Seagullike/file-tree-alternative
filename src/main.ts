import { Plugin, addIcon, TAbstractFile, TFile, PluginManifest } from 'obsidian';
import { VIEW_TYPE, FileTreeView, ICON } from './FileTreeView';
import { ZoomInIcon, ZoomOutIcon, ZoomOutDoubleIcon, LocationIcon, SpaceIcon } from './utils/icons';
import { FileTreeAlternativePluginSettings, FileTreeAlternativePluginSettingsTab, DEFAULT_SETTINGS } from './settings';
import { VaultChange } from 'utils/types';
import * as recoilState from 'recoil/pluginState';
import { atom, selector, useRecoilValue, useSetRecoilState, useRecoilCallback, useRecoilState, RecoilState } from 'recoil';

export const eventTypes = {
    activeFileChange: 'fta-active-file-change',
    refreshView: 'fta-refresh-view',
    revealFile: 'fta-reveal-file',
    vaultChange: 'fta-vault-change',
};

export default class FileTreeAlternativePlugin extends Plugin {
    settings: FileTreeAlternativePluginSettings;
    ribbonIconEl: HTMLElement | undefined = undefined;

    keys = {
        activeFolderPathKey: 'fileTreePlugin-ActiveFolderPath',
        pinnedFilesKey: 'fileTreePlugin-PinnedFiles',
        openFoldersKey: 'fileTreePlugin-OpenFolders',
        customHeightKey: 'fileTreePlugin-CustomHeight',
        customWidthKey: 'fileTreePlugin-CustomWidth',
        focusedFolder: 'fileTreePlugin-FocusedFolder',
        folderSortingOptionsKey: 'fileTreePlugin-folderSortingOptions',
    };

    async onload() {
        console.log('Loading Alternative File Tree Plugin');

        addIcon('zoomInIcon', ZoomInIcon);
        addIcon('zoomOutIcon', ZoomOutIcon);
        addIcon('zoomOutDoubleIcon', ZoomOutDoubleIcon);
        addIcon('locationIcon', LocationIcon);
        addIcon('spaceIcon', SpaceIcon);

        // Load Settings
        this.addSettingTab(new FileTreeAlternativePluginSettingsTab(this.app, this));
        await this.loadSettings();

        // Register File Tree View
        this.registerView(VIEW_TYPE, (leaf) => {
            return new FileTreeView(leaf, this);
        });

        // Event Listeners
        this.app.workspace.onLayoutReady(async () => {
            if (this.settings.openViewOnStart) {
                await this.openFileTreeLeaf(true);
            }
        });

        // Add Command to Open File Tree Leaf
        this.addCommand({
            id: 'open-file-tree-view',
            name: 'Open File Tree View',
            callback: async () => await this.openFileTreeLeaf(true),
        });

        // Add Command to Reveal Active File
        this.addCommand({
            id: 'reveal-active-file',
            name: 'Reveal Active File',
            callback: () => {
                // Activate file tree pane
                let leafs = this.app.workspace.getLeavesOfType(VIEW_TYPE);
                if (leafs.length === 0) this.openFileTreeLeaf(true);
                for (let leaf of leafs) {
                    this.app.workspace.revealLeaf(leaf);
                }
                // Run custom event
                let event = new CustomEvent(eventTypes.revealFile, {
                    detail: {
                        file: this.app.workspace.getActiveFile(),
                    },
                });
                window.dispatchEvent(event);
            },
        });

        // Add event listener for vault changes
        this.app.vault.on('create', this.onCreate);
        this.app.vault.on('delete', this.onDelete);
        this.app.vault.on('modify', this.onModify);
        this.app.vault.on('rename', this.onRename);

        // Ribbon Icon For Opening
        this.refreshIconRibbon();
    }

    // recoilState.activeFile
    // setMyAtom = useSetRecoilState(recoilState.activeFile);
    // 暴露的方法
    // async myCustomMethod(file: TFile) {
    //     console.log(`Called myCustomMethod with file ${file.name}`);
    //     // const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);
    //     // setActiveFile(file);

    //     // this.setMyAtom(file);

    //     // const updateMyAtom = useRecoilCallback(({ set }) => (newValue) => {
    //     //     set(recoilState.activeFile, newValue);
    //     // });

    //     // updateMyAtom(file);
    //     updateMyAtom(file);
    //     console.log(`Called updateMyAtom`);
    // }
    // 定义
    updateMyAtomFile: (newValue: TFile) => void;
    updateMyAtomTree: (newValue: TFile) => void;
    updateMyAtomMain: (newValue: TFile) => void;
    // updateMyAtom = (newValue: TFile) => {
    //     const setMyAtom = useSetRecoilState(recoilState.activeFile);
    //     setMyAtom(newValue);
    // }

    async myCustomMethod(file: TFile) {
        console.log("file-tree-alternative::myCustomMethod(" + file.name + ")");
        // const updateMyAtom = useRecoilCallback(({ set }) => (newValue) => {
        //     set(recoilState.activeFile, newValue);
        // });
        console.log("file-tree-alternative::updateMyAtom");
        this.updateMyAtomFile(file);
        this.updateMyAtomTree(file);
        this.updateMyAtomMain(file);
        console.log("file-tree-alternative::updateMyAtom end");
    }

    onunload() {
        console.log('Unloading Alternative File Tree Plugin');
        this.detachFileTreeLeafs();
        // Remove event listeners
        this.app.vault.off('create', this.onCreate);
        this.app.vault.off('delete', this.onDelete);
        this.app.vault.off('modify', this.onModify);
        this.app.vault.off('rename', this.onRename);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    triggerVaultChangeEvent = (file: TAbstractFile, changeType: VaultChange, oldPath?: string) => {
        let event = new CustomEvent(eventTypes.vaultChange, {
            detail: {
                file: file,
                changeType: changeType,
                oldPath: oldPath ? oldPath : '',
            },
        });
        window.dispatchEvent(event);
    };

    onCreate = (file: TAbstractFile) => this.triggerVaultChangeEvent(file, 'create', '');
    onDelete = (file: TAbstractFile) => this.triggerVaultChangeEvent(file, 'delete', '');
    onModify = (file: TAbstractFile) => this.triggerVaultChangeEvent(file, 'modify', '');
    onRename = (file: TAbstractFile, oldPath: string) => this.triggerVaultChangeEvent(file, 'rename', oldPath);

    refreshIconRibbon = () => {
        this.ribbonIconEl?.remove();
        if (this.settings.ribbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon(ICON, 'File Tree Alternative Plugin', async () => {
                await this.openFileTreeLeaf(true);
            });
        }
    };

    openFileTreeLeaf = async (showAfterAttach: boolean) => {
        let leafs = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        if (leafs.length == 0) {
            // Needs to be mounted
            let leaf = this.app.workspace.getLeftLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE });
            if (showAfterAttach) this.app.workspace.revealLeaf(leaf);
        } else {
            // Already mounted - show if only selected showAfterAttach
            if (showAfterAttach) {
                leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
            }
        }
    };

    detachFileTreeLeafs = () => {
        let leafs = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        for (let leaf of leafs) {
            (leaf.view as FileTreeView).destroy();
            leaf.detach();
        }
    };

    refreshTreeLeafs = () => {
        this.detachFileTreeLeafs();
        this.openFileTreeLeaf(true);
    };
}
