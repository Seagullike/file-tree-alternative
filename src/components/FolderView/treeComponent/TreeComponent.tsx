import { TFolder, Notice } from 'obsidian';
import React, { useState, useMemo, useEffect } from 'react';
import FileTreeAlternativePlugin from 'main';
import Dropzone from 'react-dropzone';
import { getFolderIcon, IoMdArrowDropright } from 'utils/icons';
import * as recoilState from 'recoil/pluginState';
import { useRecoilState, useSetRecoilState } from 'recoil';
import useLongPress from 'hooks/useLongPress';
import { TFile } from 'obsidian';
import * as Util from 'utils/Utils';

type TreeProps = {
    open?: boolean;
    content?: string;
    onClick?: Function;
    onContextMenu?: Function;
    type?: any;
    style?: any;
    children?: any;
    isRootFolder?: boolean;
    folder: TFolder;
    plugin: FileTreeAlternativePlugin;
};

export default function Tree(props: TreeProps) {

    const plugin = props.plugin;
    const [pinnedFiles] = useRecoilState(recoilState.pinnedFiles);

    const setMyActiveFolder = useSetRecoilState(recoilState.activeFolderPath);
    plugin.updateMyActiveFolderTree = setMyActiveFolder;
    const setMyActiveFile = useSetRecoilState(recoilState.activeFile);
    plugin.updateMyActiveTree = setMyActiveFile;

    // Global States
    const [openFolders, setOpenFolders] = useRecoilState(recoilState.openFolders);
    const [folderFileCountMap] = useRecoilState(recoilState.folderFileCountMap);
    const [activeFolderPath] = useRecoilState(recoilState.activeFolderPath);

    const [excludedExtensions] = useRecoilState(recoilState.excludedExtensions);
    const [excludedFolders] = useRecoilState(recoilState.excludedFolders);

    // sort files
    const [sortFilesByNameAscFolders] = useRecoilState(recoilState.sortFilesByNameAscFolders);
    const [sortFilesByNameDescFolders] = useRecoilState(recoilState.sortFilesByNameDescFolders);
    const [sortFilesByCreatedTimeAscFolders] = useRecoilState(recoilState.sortFilesByCreatedTimeAscFolders);
    const [sortFilesByCreatedTimeDescFolders] = useRecoilState(recoilState.sortFilesByCreatedTimeDescFolders);
    const [sortFilesByUpdatedTimeAscFolders] = useRecoilState(recoilState.sortFilesByUpdatedTimeAscFolders);
    const [sortFilesByUpdatedTimeDescFolders] = useRecoilState(recoilState.sortFilesByUpdatedTimeDescFolders);

    const [fileList, setFileList] = useRecoilState(recoilState.fileList);
    const [activeFile, setActiveFile] = useRecoilState(recoilState.activeFile);

    // Handle Click Event on File - Allows Open with Cmd/Ctrl
    const openFile = (file: TFile, e: React.MouseEvent) => {
        Util.openFile({
            file: file,
            app: plugin.app,
            newLeaf: (e.ctrlKey || e.metaKey) && !(e.shiftKey || e.altKey),
            leafBySplit: (e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey),
        });
        setActiveFile(file);
    };

    // File List Update once showSubFolders change
    useEffect(() => {
        setFileList(Util.getFilesUnderPath(activeFolderPath, plugin));
    }, [true]);

    const longPressEvents = useLongPress((e: React.TouchEvent) => {
        props.onContextMenu(e);
    }, 500);

    // Local States
    const [open, setOpen] = useState<boolean>(props.open);
    const [highlight, setHightlight] = useState<boolean>(false);

    const isFolderActive = props.folder.path === activeFolderPath;

    // --> For state update from outside of the component
    useEffect(() => setOpen(props.open), [props.open]);

    // --> Icon to be toggled between min(-) and plus(+) Each click sets openFolders Main Component state to save in settings
    const toggle = () => {
        if (props.children) {
            // Set State in Main Component for Keeping Folders Open
            if (!open) {
                setOpenFolders([...openFolders, props.folder.path]);
            } else {
                const newOpenFolders = openFolders.filter((openFolder) => props.folder.path !== openFolder);
                setOpenFolders(newOpenFolders);
            }
            // Set State Open for the Folder
            setOpen(!open);
        }
    };

    // --> Function After an External File Dropped into Folder Name
    const onDrop = (files: File[]) => {
        files.map(async (file) => {
            file.arrayBuffer().then((arrayBuffer) => {
                props.plugin.app.vault.adapter.writeBinary(props.folder.path + '/' + file.name, arrayBuffer);
            });
        });
    };

    // --> Click Events
    const folderNameClickEvent = (ev: React.MouseEvent) => {
        if (props.plugin.settings.folderNote && ev.shiftKey) {
            const fileFullPath = `${props.folder.path}/${props.folder.name}.md`;
            const folderNoteFile = props.plugin.app.vault.getAbstractFileByPath(fileFullPath);

            props.plugin.app.workspace.openLinkText(fileFullPath, '/', false);
        } else {
            const folderPath = `${props.folder.path}`;
            // console.log("folderPath:" + folderPath);
            // console.log("fileList.length:" + fileList.length);

            const folderFileList = Util.getFilesUnderPath(folderPath, plugin, false);
            const firstFile = customFiles(folderFileList);
            // console.log("firstFile:" + firstFile.name);

            openFile(firstFile, ev);
            props.onClick();
        }
    };
    const folderContextMenuEvent = () => props.onContextMenu();

    // --> Icon
    const Icon = useMemo(() => getFolderIcon(props.plugin, props.children, open), [open, props.children]);

    // --> Folder Count Map
    const folderCount = folderFileCountMap[props.folder.path];

    // --> Drag and Drop Actions
    const dropFileOrFolder = (e: React.DragEvent<HTMLDivElement>) => {
        let data = e.dataTransfer.getData('application/json');
        if (data !== '') {
            let dataJson = JSON.parse(data);
            // File Drop
            if (dataJson['filePath']) {
                const filePath = dataJson.filePath;
                // check if file exists
                let file = props.plugin.app.vault.getAbstractFileByPath(filePath);
                if (file) {
                    props.plugin.app.vault.rename(file, `${props.folder.path}/${file.name}`);
                } else {
                    new Notice('Couldnt find the file');
                }
            }
            // Folder Drop
            else if (dataJson['folderPath']) {
                const folderPath = dataJson.folderPath;
                let folder = props.plugin.app.vault.getAbstractFileByPath(folderPath);
                if (folder) {
                    if (!props.folder.path.startsWith(folder.path)) {
                        props.plugin.app.vault.rename(folder, `${props.folder.path}/${folder.name}`);
                    } else {
                        new Notice('You cant move folder under its child');
                    }
                } else {
                    new Notice('Couldnt find the folder');
                }
            }
        }
        setHightlight(false);
        e.dataTransfer.clearData();
    };

    const onFolderDragStart = (e: React.DragEvent<HTMLDivElement>, folder: TFolder) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ folderPath: folder.path }));
    };

    // Sort - Filter Files Depending on Preferences
    const customFiles = (fileList: TFile[]) => {
        // console.log("TreeComponent:customFiles")
        let sortedfileList: TFile[];
        // Remove Files with Excluded Extensions
        if (excludedExtensions.length > 0) {
            sortedfileList = fileList.filter((file) => !excludedExtensions.contains(file.extension));
        }
        // Remove Files from Excluded Folders
        if (excludedFolders.length > 0) {
            sortedfileList = sortedfileList.filter((file) => {
                for (let exc of excludedFolders) {
                    if (file.path.startsWith(exc)) {
                        return false;
                    }
                }
                return true;
            });
        }
        // Remove Files for Folder Note (If file name is same as parent folder name)
        if (plugin.settings.folderNote) {
            sortedfileList = sortedfileList.filter((f) => f.basename !== f.parent.name);
        }
        // Sort File by Name or Last Content Update, moving pinned files to the front
        let folderPath: string;
        if (sortedfileList.length > 0) {
            folderPath = sortedfileList[0].path.replace("/" + sortedfileList[0].name, "");
        }

        sortedfileList = sortedfileList.sort((a, b) => {
            // name asc
            if (sortFilesByNameAscFolders.contains(folderPath)) {
                // console.log("sortFilesByNameAscFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return plugin.settings.showFileNameAsFullPath
                        ? a.path.localeCompare(b.path, 'en', { numeric: true })
                        : a.name.localeCompare(b.name, 'en', { numeric: true });
                }
            }
            // name desc
            else if (sortFilesByNameDescFolders.contains(folderPath)) {
                // console.log("sortFilesByNameDescFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return plugin.settings.showFileNameAsFullPath
                        ? b.path.localeCompare(a.path, 'en', { numeric: true })
                        : b.name.localeCompare(a.name, 'en', { numeric: true });
                }
            }
            // created time asc
            else if (sortFilesByCreatedTimeAscFolders.contains(folderPath)) {
                // console.log("sortFilesByCreatedTimeAscFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return b.stat.ctime - a.stat.ctime;
                }
            }
            // created time desc
            else if (sortFilesByCreatedTimeDescFolders.contains(folderPath)) {
                // console.log("TreeComponent::sortFilesByCreatedTimeDescFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return b.stat.ctime - a.stat.ctime;
                }
            }
            // updated time asc
            else if (sortFilesByUpdatedTimeAscFolders.contains(folderPath)) {
                // console.log("sortFilesByUpdatedTimeAscFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return b.stat.mtime - a.stat.mtime;
                }
            }
            // updated time desc
            else if (sortFilesByUpdatedTimeDescFolders.contains(folderPath)) {
                // console.log("sortFilesByUpdatedTimeDescFolders.contains(folderPath)")
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else {
                    return a.stat.mtime - b.stat.mtime;
                }
            }
            else {
                if (pinnedFiles.contains(a) && !pinnedFiles.contains(b)) {
                    return -1;
                } else if (!pinnedFiles.contains(a) && pinnedFiles.contains(b)) {
                    return 1;
                } else if (plugin.settings.sortFilesBy === 'name') {
                    return plugin.settings.showFileNameAsFullPath
                        ? a.path.localeCompare(b.path, 'en', { numeric: true })
                        : a.name.localeCompare(b.name, 'en', { numeric: true });
                } else if (plugin.settings.sortFilesBy === 'name-rev') {
                    return plugin.settings.showFileNameAsFullPath
                        ? b.path.localeCompare(a.path, 'en', { numeric: true })
                        : b.name.localeCompare(a.name, 'en', { numeric: true });
                } else if (plugin.settings.sortFilesBy === 'last-update') {
                    return b.stat.mtime - a.stat.mtime;
                } else if (plugin.settings.sortFilesBy === 'last-update-rev') {
                    return a.stat.mtime - b.stat.mtime;
                } else if (plugin.settings.sortFilesBy === 'created') {
                    return b.stat.ctime - a.stat.ctime;
                } else if (plugin.settings.sortFilesBy === 'created-rev') {
                    return a.stat.ctime - b.stat.ctime;
                } else if (plugin.settings.sortFilesBy === 'file-size') {
                    return b.stat.size - a.stat.size;
                } else if (plugin.settings.sortFilesBy === 'file-size-rev') {
                    return a.stat.size - b.stat.size;
                }
            }
        });

        // console.log("fileList.length:" + fileList.length);
        // console.log("sortedfileList.length:" + sortedfileList.length);
        return sortedfileList.length > 0 ? sortedfileList[0] : new TFile();
    };

    return (
        <Dropzone
            onDrop={onDrop}
            noClick={true}
            onDragEnter={() => setHightlight(true)}
            onDragLeave={() => setHightlight(false)}
            onDropAccepted={() => setHightlight(false)}
            onDropRejected={() => setHightlight(false)}>
            {({ getRootProps, getInputProps }) => (
                <React.Fragment>
                    <div
                        style={{ ...props.style }}
                        className="treeview"
                        draggable
                        onDragStart={(e) => onFolderDragStart(e, props.folder)}
                        onDrop={(e) => dropFileOrFolder(e)}
                        onDragOver={() => setHightlight(true)}
                        onDragLeave={() => setHightlight(false)}>
                        <div
                            {...getRootProps({ className: 'dropzone' })}
                            className={'oz-folder-element' + (highlight ? ' drag-entered' : '')}
                            data-path={props.folder.path}>
                            <input {...getInputProps()} />

                            <div className="oz-folder-line">
                                <div className="oz-icon-div">
                                    <Icon className="oz-folder-toggle" style={{ opacity: props.children ? 1 : 0.3 }} onClick={toggle} />
                                </div>

                                <div
                                    className="oz-folder-block"
                                    onClick={folderNameClickEvent}
                                    onContextMenu={folderContextMenuEvent}
                                    {...longPressEvents}>
                                    <div className="oz-folder-type" style={{ marginRight: props.type ? 10 : 0 }}>
                                        {props.type}
                                    </div>
                                    <div
                                        className={`oz-folder-name ${isFolderActive ? 'is-folder-active' : ''}${props.isRootFolder ? ' is-root-folder' : ''
                                            }`}>
                                        {props.content}{' '}
                                        {props.plugin.settings.folderNote && props.folder.children.some((f) => f.name === `${props.folder.name}.md`) ? (
                                            <IoMdArrowDropright size={10} className="oz-folder-note-icon" />
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                    {props.plugin.settings.folderCount && (
                                        <div className="oz-folder-count">
                                            <span className="oz-nav-file-tag">{folderCount ? (open ? folderCount.open : folderCount.closed) : 0}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {props.children && (
                        <div
                            className="oz-folder-contents"
                            style={{
                                height: open ? 'auto' : 0,
                                opacity: open ? 1 : 0,
                                display: open ? 'inherit' : 'none',
                            }}>
                            {props.children}
                        </div>
                    )}
                </React.Fragment>
            )}
        </Dropzone>
    );
}
