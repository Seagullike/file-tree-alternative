import { Modal, App, TFolder, TFile, TAbstractFile, FuzzySuggestModal } from 'obsidian';
import FileTreeAlternativePlugin, { eventTypes } from 'main';
import { getFileCreateString, createNewMarkdownFile } from 'utils/Utils';

type Action = 'rename' | 'create folder' | 'create note';

export class VaultChangeModal extends Modal {
    file: TFolder | TFile | TAbstractFile;
    action: Action;
    plugin: FileTreeAlternativePlugin;

    constructor(plugin: FileTreeAlternativePlugin, file: TFolder | TFile | TAbstractFile, action: Action) {
        super(plugin.app);
        this.file = file;
        this.action = action;
        this.plugin = plugin;
    }

    onOpen() {
        let { contentEl } = this;
        let myModal = this;

        // Header
        let headerText: string;

        if (this.action === 'rename') {
            headerText = 'Rename: Provide a New Name';
        } else if (this.action === 'create folder') {
            headerText = 'Create Folder: Provide Name';
        } else if (this.action === 'create note') {
            headerText = 'Create Note: Provide Name';
        }

        const headerEl = contentEl.createEl('div', { text: headerText });
        headerEl.addClass('modal-title');

        // Input El
        const inputEl = contentEl.createEl('input');

        inputEl.style.cssText = 'width: 100%; height: 2.5em; margin-bottom: 15px;';
        if (this.action === 'rename') {
            // Manual Rename Handler For md Files
            if (this.file.name.endsWith('.md')) {
                inputEl.value = this.file.name.substring(0, this.file.name.lastIndexOf('.'));
            } else {
                inputEl.value = this.file.name;
            }
        }

        inputEl.focus();

        // Buttons
        let changeButtonText: string;

        if (this.action === 'rename') {
            changeButtonText = 'Change Name';
        } else if (this.action === 'create folder') {
            changeButtonText = 'Create Folder';
        } else if (this.action === 'create note') {
            changeButtonText = 'Create Note';
        }

        const changeButton = contentEl.createEl('button', { text: changeButtonText });

        const cancelButton = contentEl.createEl('button', { text: 'Cancel' });
        cancelButton.style.cssText = 'float: right;';
        cancelButton.addEventListener('click', () => {
            myModal.close();
        });

        const onClickAction = async () => {
            let newName = inputEl.value;
            if (this.action === 'rename') {
                // Manual Rename Handler For md Files
                if (this.file.name.endsWith('.md')) newName = newName + '.md';
                this.app.fileManager.renameFile(this.file, this.file.parent.path + '/' + newName);
            } else if (this.action === 'create folder') {
                this.app.vault.createFolder(this.file.path + '/' + newName);
            } else if (this.action === 'create note') {
                await createNewMarkdownFile(
                    this.plugin,
                    this.file as TFolder,
                    newName,
                    this.plugin.settings.createdYaml ? getFileCreateString({ plugin: this.plugin, fileName: newName }) : ''
                );
            }
            myModal.close();
        };

        // Event Listener
        changeButton.addEventListener('click', onClickAction);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') onClickAction();
        });
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

export class MoveSuggestionModal extends FuzzySuggestModal<TFolder> {
    app: App;
    fileOrFolderToMove: TFile | TFolder;

    constructor(app: App, fileOrFolderToMove: TFile | TFolder) {
        super(app);
        this.fileOrFolderToMove = fileOrFolderToMove;
    }

    getItemText(item: TFolder): string {
        return item.path;
    }

    getItems(): TFolder[] {
        return getAllFoldersInVault(this.app);
    }

    onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent) {
        this.app.vault.rename(this.fileOrFolderToMove, item.path + '/' + this.fileOrFolderToMove.name);
    }
}

function getAllFoldersInVault(app: App): TFolder[] {
    let folders: TFolder[] = [];
    let rootFolder = app.vault.getRoot();
    folders.push(rootFolder);
    function recursiveFx(folder: TFolder) {
        for (let child of folder.children) {
            if (child instanceof TFolder) {
                let childFolder: TFolder = child as TFolder;
                folders.push(childFolder);
                if (childFolder.children) recursiveFx(childFolder);
            }
        }
    }
    recursiveFx(rootFolder);
    return folders;
}

// folderSortingOptions
// folderSortingOptionsString: parentFolder/currentFolder/FileName-Desc
export class FolderSortingOption {
    sortingType: string;
    sortingDirection: string;

    constructor(sortingType: string, sortingDirection: string) {
        this.sortingType = sortingType;
        this.sortingDirection = sortingDirection;
    }
}