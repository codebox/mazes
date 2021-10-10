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

    function resetGrid(){
        model.maze = buildGrid(model.size, model.size);
        view.renderMaze(model.maze);
    }
    function onMazeSizeChanged(newSize) {
        view.setMazeSize(model.size = newSize);
        resetGrid();
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
    });

    view.on(EVENT_RESIZE).then(() => {
        view.renderMaze(model.maze);
    });

    function updateUiMaskInputs() {
        const maskingAllowed = model.algorithm.maskable,
            maskDefined = !model.masks.getCurrent().isEmpty(),
            state = stateMachine.state;

        /*
        create/edit mask button visible
        create/edit mask button text

        apply mask toggle visible or
        no masking allowed visible or
        neither visible

        apply mask toggle selected
        */

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
        view.toggleRefreshButton([STATE_DISPLAYING].includes(state));
        view.toggleChangeMazeConfigButton([STATE_DISPLAYING].includes(state));
        view.toggleMazeConfig([STATE_INIT].includes(state));
        updateUiMaskInputs();

        const infoMsg = {
            [STATE_INIT]: 'Click the GO button to create a maze',
            [STATE_DISPLAYING]: 'Click REFRESH to make a different maze',
            [STATE_MASKING]: 'Select squares on the grid to create a mask.<br><br>Masked squares will not be included in the maze',
            [STATE_PLAYING]: ''
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

    function renderMaze() {
        const grid = buildGrid(model.size, model.size);
        if (model.algorithm.maskable && model.applyMask) {
            applyMask(grid);
        }
        view.renderMaze(model.maze = algorithms[model.algorithm.function](grid));
    }
    view.on(EVENT_GO_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
        renderMaze();
        stateMachine.displaying();
        updateUiForNewState();
    });

    view.on(EVENT_REFRESH_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
        renderMaze();
    });

    view.on(EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
        const grid = buildGrid(model.size, model.size);
        view.renderMaze(model.maze = grid);
        stateMachine.init();
        updateUiForNewState();
    });

    view.on(EVENT_MASK_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
        stateMachine.masking();
        updateUiForNewState();
        view.displayMaskedCells(model.masks.getCurrent());
    });

    view.on(EVENT_SAVE_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
        stateMachine.init();
        resetGrid();
        model.applyMask = !model.masks.getCurrent().isEmpty();
        updateUiForNewState();
    });

    view.on(EVENT_APPLY_MASK_CLICKED).ifState(STATE_INIT).then(() => {
        view.setApplyMask(model.applyMask = !model.applyMask);
    });

    view.on(EVENT_MOUSE_CLICK).ifState(STATE_MASKING).then(event => {
        const x = event.data.x,
            y = event.data.y,
            mask = model.masks.getCurrent();
        const newMaskValue = ! mask.get(x,y);
        mask.set(x,y,newMaskValue);
        view.markCellAsMasked(x,y,newMaskValue);
    });

    view.on(EVENT_MOUSE_MOVE).ifState(STATE_MASKING).then(event => {
        if (!event.data.button) {
            return;
        }
        if (!model.mouseDragStart) {
            model.mouseDragStart = event.data;
        }
        view.selectCellRange(model.mouseDragStart.x, model.mouseDragStart.y, event.data.x, event.data.y);
        console.log('range',model.mouseDragStart.x, model.mouseDragStart.y, event.data.x, event.data.y)
    });

    view.on(EVENT_MOUSE_MOVE_END).ifState(STATE_MASKING).then(event => {
        const startPosition = model.mouseDragStart,
            endPosition = event.data;
        model.mouseDragStart = null;
    });

    updateUiForNewState();

};