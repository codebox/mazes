window.onload = () => {
    "use strict";
    const model = buildModel(),
        stateMachine = buildStateMachine(),
        view = buildView(stateMachine, model);

    function getAlgorithmByName(name) {
        const algorithm = config.algorithms.find(a => a.name === name);
        console.assert(algorithm);
        return algorithm;
    }

    config.mazeSizes.forEach(size => {
        view.addMazeSize(size, `${size}x${size}`);
    });

    config.algorithms.forEach(algorithm => {
        view.addMazeAlgorithm(algorithm.name) ;
    });
    view.setMazeAlgorithm(model.algorithm.name);
    view.setMaskingAllowed(model.algorithm.maskable);
    view.setApplyMask(model.applyMask);

    function onMazeSizeChanged(newSize) {
        view.setMazeSize(model.size = newSize);
        renderMaze(false);
        updateUiMaskInputs();
    }
    view.on(EVENT_MAZE_SIZE_SELECTED).ifState(STATE_INIT).then(event => onMazeSizeChanged(event.data));
    onMazeSizeChanged(model.size);

    view.on(EVENT_MAZE_ALGORITHM_SELECTED).ifState(STATE_INIT).then(event => {
        const algorithmName = event.data,
            selectedAlgorithm = getAlgorithmByName(algorithmName);
        model.algorithm = selectedAlgorithm;

        view.setMazeAlgorithm(selectedAlgorithm.name);
        updateUiMaskInputs();
        renderMaze(false);
    });

    view.on(EVENT_RESIZE).then(() => {
        view.renderMaze(model.maze);
    });

    function updateUiMaskInputs() {
        const maskingAllowed = model.algorithm.maskable,
            maskDefined = !model.masks.getCurrent().isEmpty(),
            state = stateMachine.state;

        view.toggleMaskButton(state === STATE_INIT && maskingAllowed);
        view.updateEditMaskButtonText(maskDefined);
        view.togglelApplyMask(state === STATE_INIT && (maskDefined || !maskingAllowed));
        view.setMaskingAllowed(maskingAllowed);
        view.setApplyMask(model.applyMask);
    }

    function updateUiForNewState() {
        const state = stateMachine.state;
        view.toggleGoButton([STATE_INIT].includes(state));
        view.toggleMaskButton([STATE_INIT].includes(state));
        view.toggleSaveMaskButton([STATE_MASKING].includes(state));
        view.toggleClearMaskButton([STATE_MASKING].includes(state));
        view.toggleRefreshButton([STATE_DISPLAYING].includes(state));
        view.toggleChangeMazeConfigButton([STATE_DISPLAYING].includes(state));
        view.toggleMazeConfig([STATE_INIT].includes(state));
        view.toggleDetails([STATE_DISPLAYING].includes(state));
        view.togglePlayButton([STATE_DISPLAYING].includes(state));
        updateUiMaskInputs();

        const infoMsg = {
            [STATE_INIT]: 'Click the GO button to create a maze',
            [STATE_DISPLAYING]: 'Click REFRESH to make a different maze<br><br>Hover over the maze to view a distance map',
            [STATE_MASKING]: 'Select squares on the grid to create a mask.<br><br>Hold down SHIFT to select a rectangle.<br><br>Masked squares will not be included in the maze',
            [STATE_PLAYING]: 'Use the cursor keys to guide the man to the exit<br><br>Hold down SHIFT to move as far as possible in a direction<br><br>Hold down CTRL and SHIFT to keep moving until the next junction'
        }[state];
        view.showInfo(infoMsg);
    }

    function applyMask(grid) {
        const mask = model.masks.getCurrent();
        mask.forEach((x, y, isMasked) => {
            if (isMasked) {
                grid.maskCell(x, y);
            }
        });
    }

    function renderMaze(applyAlgorithm) {
        const grid = buildGrid(model.size, model.size);
        if (model.algorithm.maskable && model.applyMask) {
            applyMask(grid);
        }
        const maze = applyAlgorithm ? algorithms[model.algorithm.function](grid) : grid;
        view.renderMaze(model.maze = maze);
        if (applyAlgorithm) {
            const details = model.maze.getDetails();

            view.showDetails(`
                Cells: <em>${details.cellCount}</em><br>
                Longest Path: <em>${details.maxDistance}</em><br>
                Dead Ends: <em>${details.deadEnds}</em><br>
            `);
        }
    }

    view.on(EVENT_GO_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
        stateMachine.displaying();
        renderMaze(true);
        updateUiForNewState();
    });

    view.on(EVENT_REFRESH_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
        renderMaze(true);
    });

    view.on(EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
        stateMachine.init();
        renderMaze(false);
        updateUiForNewState();
    });

    view.on(EVENT_MASK_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
        stateMachine.masking();
        updateUiForNewState();
        renderMaze(false);
    });

    view.on(EVENT_SAVE_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
        if (model.masks.getCurrent().isConnected()) {
            stateMachine.init();
            model.applyMask = !model.masks.getCurrent().isEmpty();
            renderMaze(false);
            updateUiForNewState();
        } else {
            alert('INVALID MASK\nYour mask has cut off one or more cells so they are not reachable from the rest of the maze.');
        }
    });
    view.on(EVENT_CLEAR_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
        model.maze.forEachCell(cell => cell.unmask());
        model.masks.getCurrent().setFromModel();
        renderMaze(false);
    });

    view.on(EVENT_APPLY_MASK_CLICKED).ifState(STATE_INIT).then(() => {
        view.setApplyMask(model.applyMask = !model.applyMask);
        renderMaze(false);
    });

    function selectCellRange(x1,y1,x2,y2) {
        const startX = Math.min(x1, x2),
            startY = Math.min(y1, y2),
            endX = Math.max(x1, x2),
            endY = Math.max(y1, y2);

        const grid = model.maze;
        grid.clearMetadata();

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                grid.getCell(x,y).metadata.selected = true;
            }
        }
    }

    view.on(EVENT_MOUSE_MOVE).ifState(STATE_MASKING).then(event => {
        if (!event.data.button) {
            return;
        }
        if (!model.mouseDragStart) {
            model.mouseDragStart = event.data;
        }

        if (event.data.shift) {
            selectCellRange(model.mouseDragStart.x, model.mouseDragStart.y, event.data.x, event.data.y);
        } else {
            model.maze.getCell(event.data.x, event.data.y).metadata.selected = true;
        }
        view.renderMaze(model.maze);
    });

    view.on(EVENT_MOUSE_MOVE).ifState(STATE_DISPLAYING).then(event => {
        model.maze.findDistancesFrom(event.data.x, event.data.y);
        view.renderMaze(model.maze);
    });

    view.on(EVENT_MOUSE_MOVE_END).ifState(STATE_MASKING).then(event => {
        model.maze.forEachCell(cell => {
            if (cell.metadata.selected) {
                if (cell.masked) {
                    cell.unmask();
                } else {
                    cell.mask();
                }
                delete cell.metadata.selected;
            }
        });
        model.masks.getCurrent().setFromModel();
        view.renderMaze(model.maze);
        delete model.mouseDragStart;
    });

    view.on(EVENT_MOUSE_LEAVE).ifState(STATE_DISPLAYING).then(event => {
        model.maze.clearMetadata();
        view.renderMaze(model.maze);
    });

    function movePlayer(newCell) {
        const currentCell = model.playState.cell;
        delete currentCell.metadata.player;
        currentCell.metadata.playerVisited = true;
        newCell.metadata.player = true;
        model.playState.cell = newCell;
        view.renderMaze(model.maze);
    }

    view.on(EVENT_PLAY_CLICKED).ifState(STATE_DISPLAYING).then(event => {
        stateMachine.playing();
        model.maze.clearMetadata();

        const details = model.maze.getDetails(),
            startX = details.longestPath.start.x,
            startY = details.longestPath.start.y,
            endX = details.longestPath.finish.x,
            endY = details.longestPath.finish.y;

        model.playState = {
            cell: model.maze.getCell(startX, startY)
        };
        model.maze.getCell(endX, endY).metadata.finish = true;
        updateUiForNewState();
        movePlayer(model.playState.cell);
    });

    view.on(EVENT_NAVIGATE).ifState(STATE_PLAYING).then(event => {
        const {x,y} = event.data;
        let moveOk, direction = event.data.direction;

        function getAvailableDirections() {
            return Object.entries(model.playState.cell.neighbours).filter(entry => entry[1].link).map(entry => entry[0]);
        }
        function getBackDirection(direction) {
            return {
                'north': 'south',
                'south': 'north',
                'east': 'west',
                'west': 'east'
            }[direction];
        }

        while(true) {
            moveOk = model.playState.cell.neighbours[direction].link;
            if (moveOk) {
                movePlayer(model.playState.cell.neighbours[direction].cell);
                if (event.data.shift) {
                    if (event.data.ctrl) {
                        const availableDirections = getAvailableDirections();
                        if (availableDirections.length === 2) {
                            const backDirection = getBackDirection(direction);
                            direction = availableDirections.find(dir => dir !== backDirection);
                        } else {
                            break;
                        }
                    }
                } else {
                    break;
                }
            } else {
                break;
            }

        }

    });

    updateUiForNewState();

};