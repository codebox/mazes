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

    function onMazeSizeChanged(newSize) {
        view.setMazeSize(model.size = newSize);
        model.maze = buildGrid(model.size, model.size);
        view.renderMaze(model.maze);
    }
    view.on(EVENT_MAZE_SIZE_SELECTED).ifState(STATE_INIT).then(event => onMazeSizeChanged(event.data));
    onMazeSizeChanged(model.size);

    view.on(EVENT_MAZE_ALGORITHM_SELECTED).ifState(STATE_INIT).then(event => {
        const algorithmName = event.data,
            selectedAlgorithm = getAlgorithmByName(algorithmName);
        model.algorithm = selectedAlgorithm;

        view.setMazeAlgorithm(selectedAlgorithm.name);
        view.setMaskingAllowed(selectedAlgorithm.maskable);
    });

    view.on(EVENT_RESIZE).then(() => {
        view.renderMaze(model.maze);
    });

    function updateUiForNewState() {
        const state = stateMachine.state;
        view.toggleGoButton([STATE_INIT].includes(state));
        view.toggleMaskButton([STATE_INIT].includes(state));
        view.toggleSaveMaskButton([STATE_MASKING].includes(state));
        view.toggleRefreshButton([STATE_DISPLAYING].includes(state));
        view.toggleChangeMazeConfigButton([STATE_DISPLAYING].includes(state));
        view.toggleMazeConfig([STATE_INIT].includes(state));
        view.toggleApplyMask([STATE_INIT].includes(state));
    }

    function applyMask(grid) {
        if (model.mask[model.size]) {
            model.mask[model.size].forEach((row,x) => {
                row.forEach((isMasked,y) => {
                    if (isMasked) {
                        grid.maskCell(x, y);
                    }
                });
            })
        }
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
        view.displayMaskedCells(model.mask[model.size]);
    });

    view.on(EVENT_SAVE_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
        stateMachine.init();
        updateUiForNewState();
    });

    view.on(EVENT_APPLY_MASK_CLICKED).ifState(STATE_INIT).then(() => {
        view.setApplyMask(model.applyMask = !model.applyMask);
    });

    view.on(EVENT_MOUSE_CLICK).ifState(STATE_MASKING).then(event => {
        const x = event.data.x,
            y = event.data.y;
        if (!model.mask[model.size]) {
            model.mask[model.size] = [];
        }
        if (!model.mask[model.size][x]) {
            model.mask[model.size][x] = [];
        }
        const newMaskValue = ! model.mask[model.size][x][y];
        model.mask[model.size][x][y] = newMaskValue;
        view.markCellAsMasked(x,y,newMaskValue);
    });
    updateUiForNewState();
};