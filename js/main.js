import {buildModel} from './model.js';
import {buildView} from './view.js';
import {buildMaze} from '../../mazejs/web/js/main.js';
import {buildStateMachine, STATE_INIT, STATE_DISPLAYING, STATE_PLAYING, STATE_MASKING, STATE_DISTANCE_MAPPING, STATE_RUNNING_ALGORITHM} from './stateMachine.js';
import {shapes} from '../../mazejs/web/js/shapes.js';
import {
    EVENT_MAZE_SHAPE_SELECTED, EVENT_SIZE_PARAMETER_CHANGED, EVENT_ALGORITHM_SELECTED, EVENT_GO_BUTTON_CLICKED, EVENT_WINDOW_RESIZED,
    EVENT_SHOW_MAP_BUTTON_CLICKED, EVENT_CLEAR_MAP_BUTTON_CLICKED, EVENT_CREATE_MASK_BUTTON_CLICKED,
    EVENT_SAVE_MASK_BUTTON_CLICKED, EVENT_CLEAR_MASK_BUTTON_CLICKED, EVENT_FINISH_RUNNING_BUTTON_CLICKED, EVENT_DELAY_SELECTED,
    EVENT_CHANGE_PARAMS_BUTTON_CLICKED, EVENT_EXITS_SELECTED, EVENT_SOLVE_BUTTON_CLICKED, EVENT_PLAY_BUTTON_CLICKED, EVENT_STOP_BUTTON_CLICKED,
    EVENT_KEY_PRESS
} from './view.js';
import {config} from './config.js';
import {algorithms} from '../../mazejs/web/js/algorithms.js';
import {
    ALGORITHM_NONE, METADATA_MASKED, METADATA_END_CELL, METADATA_START_CELL, EVENT_CLICK, EXITS_NONE, EXITS_HARDEST, EXITS_HORIZONTAL, EXITS_VERTICAL,
    METADATA_PLAYER_CURRENT, METADATA_PLAYER_VISITED, METADATA_PATH,
    DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST, DIRECTION_WEST, DIRECTION_NORTH_WEST, DIRECTION_NORTH_EAST, DIRECTION_SOUTH_WEST, DIRECTION_SOUTH_EAST,
    DIRECTION_CLOCKWISE, DIRECTION_ANTICLOCKWISE, DIRECTION_INWARDS, DIRECTION_OUTWARDS
} from '../../mazejs/web/js/constants.js';

window.onload = () => {
    "use strict";
    const model = buildModel(),
        stateMachine = buildStateMachine(),
        view = buildView(model, stateMachine);

    function setupShapeParameter() {
        Object.keys(shapes).forEach(name => {
            view.addShape(name);
        });

        function onShapeSelected(shapeName) {
            view.setShape(model.shape = shapeName);
        }
        onShapeSelected(model.shape);

        view.on(EVENT_MAZE_SHAPE_SELECTED, shapeName => {
            onShapeSelected(shapeName);
            setupSizeParameters();
            setupAlgorithms();
            showEmptyGrid(true);
        });
    }

    function setupSizeParameters() {
        const shape = model.shape,
            parameters = config.shapes[shape].parameters;

        model.size = {};
        view.clearSizeParameters();

        Object.entries(parameters).forEach(([paramName, paramValues]) => {
            view.addSizeParameter(paramName, paramValues.min, paramValues.max);
        });

        function onParameterChanged(name, value) {
            model.size[name] = value;
            view.setSizeParameter(name, value);
        }
        Object.entries(parameters).forEach(([paramName, paramValues]) => {
            onParameterChanged(paramName, paramValues.initial);
        });

        view.on(EVENT_SIZE_PARAMETER_CHANGED, data => {
            onParameterChanged(data.name, data.value);
            showEmptyGrid(true);
        });
    }

    function setupAlgorithms() {
        const shape = model.shape;

        view.clearAlgorithms();

        Object.entries(algorithms).filter(([algorithmId, algorithm]) => algorithmId !== ALGORITHM_NONE).forEach(([algorithmId, algorithm]) => {
            if (algorithm.metadata.shapes.includes(shape)) {
                view.addAlgorithm(algorithm.metadata.description, algorithmId);
            }
        });

        function onAlgorithmChanged(algorithmId) {
            view.setAlgorithm(model.algorithm = algorithmId);
        }
        onAlgorithmChanged(config.shapes[shape].defaultAlgorithm);

        view.on(EVENT_ALGORITHM_SELECTED, onAlgorithmChanged);
    }

    function setupAlgorithmDelay() {
        view.addAlgorithmDelay('Instant Mazes', 0);
        view.addAlgorithmDelay('Show Algorithm Steps', 5000);

        view.on(EVENT_DELAY_SELECTED, algorithmDelay => {
            model.algorithmDelay = algorithmDelay;
            view.setAlgorithmDelay(algorithmDelay);
        });
        view.setAlgorithmDelay(model.algorithmDelay);
    }

    function setupExitConfigs() {
        view.addExitConfiguration('No Entrance/Exit', EXITS_NONE);
        view.addExitConfiguration('Bottom to Top', EXITS_VERTICAL);
        view.addExitConfiguration('Left to Right', EXITS_HORIZONTAL);
        view.addExitConfiguration('Hardest Entrance/Exit', EXITS_HARDEST);

        view.on(EVENT_EXITS_SELECTED, exitConfig => {
            view.setExitConfiguration(model.exitConfig = exitConfig);
        });
        view.setExitConfiguration(model.exitConfig);
    }

    setupShapeParameter();
    setupSizeParameters();
    setupExitConfigs();
    setupAlgorithmDelay();
    setupAlgorithms();
    showEmptyGrid(true);

    function buildMazeUsingModel(overrides={}) {
        if (model.maze) {
            model.maze.dispose();
        }

        const grid = Object.assign({'cellShape': model.shape}, model.size),
            maze = buildMaze({
                grid,
                'algorithm':  overrides.algorithm || model.algorithm,
                'randomSeed' : model.randomSeed,
                'element': document.getElementById('maze'),
                'mask': overrides.mask || model.mask[getModelMaskKey()],
                'exitConfig': overrides.exitConfig || model.exitConfig
            });

        model.maze = maze;

        maze.on(EVENT_CLICK, ifStateIs(STATE_DISTANCE_MAPPING).then(event => {
            maze.findDistancesFrom(...event.coords);
            maze.render();
        }));

        maze.on(EVENT_CLICK, ifStateIs(STATE_MASKING).then(event => {
            const cell = maze.getCellByCoordinates(event.coords);
            cell.metadata[METADATA_MASKED] = !cell.metadata[METADATA_MASKED];
            maze.render();
        }));

        maze.on(EVENT_CLICK, ifStateIs(STATE_PLAYING).then(event => {
            const currentCell = model.playState.currentCell,
                direction = maze.getClosestDirectionForClick(currentCell, event);
            navigate(direction, event.shift, event.ctrl);
            maze.render();
        }));

        const algorithmDelay = overrides.algorithmDelay !== undefined ? overrides.algorithmDelay : model.algorithmDelay,
            runAlgorithm = maze.runAlgorithm;
        if (algorithmDelay) {
            model.runningAlgorithm = {run: runAlgorithm};
            return new Promise(resolve => {
                stateMachine.runningAlgorithm();
                model.runningAlgorithm.interval = setInterval(() => {
                    const done = runAlgorithm.oneStep();
                    maze.render();
                    if (done) {
                        clearInterval(model.runningAlgorithm.interval);
                        delete model.runningAlgorithm;
                        stateMachine.displaying();
                        resolve();
                    }
                }, algorithmDelay/maze.cellCount);
            });

        } else {
            runAlgorithm.toCompletion();
            maze.render();
            return Promise.resolve();
        }

    }

    function showEmptyGrid(deleteMaskedCells) {
        buildMazeUsingModel({algorithmDelay: 0, exitConfig: EXITS_NONE, algorithm: ALGORITHM_NONE, mask: deleteMaskedCells ? model.mask[getModelMaskKey()] : []})
            .then(() => model.maze.render());
    }

    function ifStateIs(...states) {
        return {
            then(handler) {
                return event => {
                    if (states.includes(stateMachine.state)) {
                        handler(event);
                    }
                };
            }
        }
    }

    view.on(EVENT_GO_BUTTON_CLICKED, () => {
        model.randomSeed = Date.now();
        buildMazeUsingModel().then(() => {
            model.maze.render();
            stateMachine.displaying();
        });
    });
    view.on(EVENT_SHOW_MAP_BUTTON_CLICKED, () => stateMachine.distanceMapping());
    view.on(EVENT_CLEAR_MAP_BUTTON_CLICKED, () => {
        stateMachine.displaying();
        model.maze.clearDistances();
        model.maze.render();
    });

    view.on(EVENT_FINISH_RUNNING_BUTTON_CLICKED, () => {
        clearInterval(model.runningAlgorithm.interval);
        model.runningAlgorithm.run.toCompletion();
        delete model.runningAlgorithm;
        stateMachine.displaying();
        model.maze.render();
    });

    stateMachine.onStateChange(newState => {
        view.updateForNewState(newState);
    });
    view.updateForNewState(stateMachine.state);

    function getModelMaskKey() {
        return `${model.shape}-${Object.values(model.size).join('-')}`;
    }

    view.on(EVENT_CREATE_MASK_BUTTON_CLICKED, () => {
        stateMachine.masking();
        showEmptyGrid(false);
        (model.mask[getModelMaskKey()] || []).forEach(maskedCoords => {
            const cell = model.maze.getCellByCoordinates(maskedCoords);
            cell.metadata[METADATA_MASKED] = true;
        });
        model.maze.render();
    });

    view.on(EVENT_SAVE_MASK_BUTTON_CLICKED, () => {
        stateMachine.init();
        const mask = model.mask[getModelMaskKey()] = [];
        model.maze.forEachCell(cell => {
            if (cell.metadata[METADATA_MASKED]) {
                mask.push(cell.coords);
            }
        });
        showEmptyGrid(true);
    });

    view.on(EVENT_CLEAR_MASK_BUTTON_CLICKED, () => {
        model.maze.forEachCell(cell => {
            delete cell.metadata[METADATA_MASKED];
        });
        model.maze.render();
    });

    view.on(EVENT_WINDOW_RESIZED, ifStateIs(STATE_DISPLAYING).then(event => {
        buildMazeUsingModel({algorithmDelay: false}).then(() => model.maze.render());
    }));
    view.on(EVENT_WINDOW_RESIZED, ifStateIs(STATE_INIT).then(event => {
        showEmptyGrid(false);
    }));

    view.on(EVENT_CHANGE_PARAMS_BUTTON_CLICKED, () => {
        showEmptyGrid(true);
        stateMachine.init();
    });

    function findStartAndEndCells() {
        let startCell, endCell;
        model.maze.forEachCell(cell => {
            if (cell.metadata[METADATA_START_CELL]) {
                startCell = cell;
            }
            if (cell.metadata[METADATA_END_CELL]) {
                endCell = cell;
            }
        });
        return [startCell, endCell];
    }
    view.on(EVENT_SOLVE_BUTTON_CLICKED, () => {
        const [startCell, endCell] = findStartAndEndCells();
        console.assert(startCell);
        console.assert(endCell);
        model.maze.findPathBetween(startCell.coords, endCell.coords);
        model.maze.render();
    });

    view.on(EVENT_PLAY_BUTTON_CLICKED, () => {
        const [startCell, endCell] = findStartAndEndCells();
        if (!(startCell && endCell)) {
            alert('You must generate a maze with exits in order to play');
            return;
        }
        model.maze.clearPathAndSolution();
        model.playState = {startCell, endCell, currentCell: startCell, startTime: Date.now()};
        startCell.metadata[METADATA_PLAYER_CURRENT] = true;
        startCell.metadata[METADATA_PLAYER_VISITED] = true;
        model.maze.render();
        stateMachine.playing();
    });

    view.on(EVENT_STOP_BUTTON_CLICKED, () => {
        stateMachine.displaying();
    });

    const keyCodeToDirection = {
        38: DIRECTION_NORTH,
        40: DIRECTION_SOUTH,
        39: DIRECTION_EAST,
        37: DIRECTION_WEST,
        65: DIRECTION_NORTH_WEST, // A
        83: DIRECTION_NORTH_EAST, // S
        90: DIRECTION_SOUTH_WEST, // Z
        88: DIRECTION_SOUTH_EAST, // X
        81: DIRECTION_CLOCKWISE,  // Q
        87: DIRECTION_ANTICLOCKWISE, // W
        80: DIRECTION_INWARDS, // P
        76: `${DIRECTION_OUTWARDS}_1`, // L
        186: `${DIRECTION_OUTWARDS}_0` // ;
    };

    function padNum(num) {
        return num < 10 ? '0' + num : num;
    }
    function formatTime(millis) {
        const hours = Math.floor(millis / (1000 * 60 * 60)),
            minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60)),
            seconds = Math.floor((millis % (1000 * 60)) / 1000);

        return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
    }

    function onMazeCompleted() {
        const timeMs = Date.now() - model.playState.startTime,
            time = formatTime(timeMs),
            {startCell, endCell} = model.playState;

        model.playState.finished = true;

        model.maze.findPathBetween(startCell.coords, endCell.coords);
        const optimalPathLength = model.maze.metadata[METADATA_PATH].length;
        delete model.maze.metadata[METADATA_PATH];

        let visitedCells = 0;
        model.maze.forEachCell(cell => {
            if (cell.metadata[METADATA_PLAYER_VISITED]) {
                visitedCells++;
            }
        });

        const cellsPerSecond = visitedCells / (timeMs / 1000);
        model.maze.render();
        stateMachine.displaying();
        view.showInfo(`
            Finish Time: ${time}<br>
            Visited Cells: ${visitedCells}<br>
            Optimal Route: ${optimalPathLength}<br><br>
            Optimality: <em>${Math.floor(100 * optimalPathLength / visitedCells)}%</em><br>
            Cells per Second: <em>${Math.round(cellsPerSecond)}</em>
        `);
    }

    function navigate(direction, shift, ctrl) {
        while (true) {
            const currentCell = model.playState.currentCell,
                targetCell = currentCell.neighbours[direction],
                moveOk = targetCell && targetCell.isLinkedTo(currentCell);

            if (moveOk) {
                delete currentCell.metadata[METADATA_PLAYER_CURRENT];
                targetCell.metadata[METADATA_PLAYER_VISITED] = true;
                targetCell.metadata[METADATA_PLAYER_CURRENT] = true;
                model.playState.previousCell = currentCell;
                model.playState.currentCell = targetCell;

                if (targetCell.metadata[METADATA_END_CELL]) {
                    onMazeCompleted();
                }

                if (model.playState.finished) {
                    break;
                } else if (!shift) {
                    break;
                } else if (ctrl) {
                    const linkedDirections = targetCell.neighbours.linkedDirections();
                    if (linkedDirections.length === 2) {
                        direction = linkedDirections.find(neighbourDirection => targetCell.neighbours[neighbourDirection] !== model.playState.previousCell);
                    } else {
                        break;
                    }
                }

            } else {
                break;
            }
        }
    }

    view.on(EVENT_KEY_PRESS, ifStateIs(STATE_PLAYING).then(event => {
        const {keyCode, shift, ctrl} = event,
            direction = keyCodeToDirection[keyCode];

        navigate(direction, shift, ctrl);

        model.maze.render();
    }));

    // view.on(EVENT_WINDOW_RESIZED).then(renderMaze);

    //
    // function getAlgorithmByName(name) {
    //     const algorithm = config.algorithms.find(a => a.name === name);
    //     console.assert(algorithm);
    //     return algorithm;
    // }
    //
    // config.mazeShapes.forEach(shape => {
    //     view.addMazeShape(shape, shape);
    // });
    //
    // config.mazeSizes.forEach(size => {
    //     view.addMazeSize(size, `${size}x${size}`);
    // });
    //
    // config.algorithms.forEach(algorithm => {
    //     view.addMazeAlgorithm(algorithm.name) ;
    // });
    // view.setMazeAlgorithm(model.algorithm.name);
    // view.setMaskingAllowed(model.algorithm.maskable);
    // view.setApplyMask(model.applyMask);
    //
    // function onMazeShapeChanged(newShape) {
    //     view.setMazeShape(model.shape = newShape);
    //     renderMaze(false);
    //     updateUiMaskInputs();
    // }
    // view.on(EVENT_MAZE_SHAPE_SELECTED).ifState(STATE_INIT).then(event => onMazeShapeChanged(event.data));
    //
    // function onMazeSizeChanged(newSize) {
    //     view.setMazeSize(model.size = newSize);
    //     renderMaze(false);
    //     updateUiMaskInputs();
    // }
    // view.on(EVENT_MAZE_SIZE_SELECTED).ifState(STATE_INIT).then(event => onMazeSizeChanged(event.data));
    // onMazeSizeChanged(model.size);
    //
    // view.on(EVENT_MAZE_ALGORITHM_SELECTED).ifState(STATE_INIT).then(event => {
    //     const algorithmName = event.data,
    //         selectedAlgorithm = getAlgorithmByName(algorithmName);
    //     model.algorithm = selectedAlgorithm;
    //
    //     view.setMazeAlgorithm(selectedAlgorithm.name);
    //     updateUiMaskInputs();
    //     renderMaze(false);
    // });
    //
    // view.on(EVENT_RESIZE).then(() => {
    //     view.renderMaze(model.maze);
    // });
    //
    // function updateUiMaskInputs() {
    //     const maskingAllowed = model.algorithm.maskable,
    //         maskDefined = !model.masks.getCurrent().isEmpty(),
    //         state = stateMachine.state;
    //
    //     view.toggleMaskButton(state === STATE_INIT && maskingAllowed);
    //     view.updateEditMaskButtonText(maskDefined);
    //     view.togglelApplyMask(state === STATE_INIT && (maskDefined || !maskingAllowed));
    //     view.setMaskingAllowed(maskingAllowed);
    //     view.setApplyMask(model.applyMask);
    // }
    //
    // function updateUiForNewState() {
    //     const state = stateMachine.state;
    //     view.toggleGoButton([STATE_INIT].includes(state));
    //     view.toggleMaskButton([STATE_INIT].includes(state));
    //     view.toggleSaveMaskButton([STATE_MASKING].includes(state));
    //     view.toggleClearMaskButton([STATE_MASKING].includes(state));
    //     view.toggleRefreshButton([STATE_DISPLAYING].includes(state));
    //     view.toggleChangeMazeConfigButton([STATE_DISPLAYING].includes(state));
    //     view.toggleMazeConfig([STATE_INIT].includes(state));
    //     view.toggleDetails([STATE_DISPLAYING, STATE_PLAYING].includes(state));
    //     view.togglePlayButton([STATE_DISPLAYING].includes(state));
    //     view.toggleQuitButton([STATE_PLAYING].includes(state));
    //     view.toggleSolutionButton([STATE_PLAYING].includes(state));
    //     view.toggleDownloadButton([STATE_PLAYING, STATE_DISPLAYING].includes(state));
    //     updateUiMaskInputs();
    //
    //     const infoMsg = {
    //         [STATE_INIT]: 'Click the GO button to create a maze',
    //         [STATE_DISPLAYING]: 'Click REFRESH to make a different maze<br><br>Hover over the maze to view a distance map',
    //         [STATE_MASKING]: 'Select squares on the grid to create a mask.<br><br>Hold down SHIFT to select a rectangle.<br><br>Masked squares will not be included in the maze',
    //         [STATE_PLAYING]: 'Click on the maze or use the cursor keys to guide the man to the exit<br><br>Hold down SHIFT to move as far as possible in a direction<br><br>Hold down CTRL and SHIFT to keep moving until the next junction'
    //     }[state];
    //     view.showInfo(infoMsg);
    // }
    //
    // function applyMask(grid) {
    //     const mask = model.masks.getCurrent();
    //     mask.forEach((x, y, isMasked) => {
    //         if (isMasked) {
    //             grid.maskCell(x, y);
    //         }
    //     });
    // }
    //
    // function showMazeDetails() {
    //     const details = model.maze.getDetails();
    //
    //     view.showDetails(`
    //             Cells: <em>${details.cellCount}</em><br>
    //             Longest Path: <em>${details.maxDistance}</em><br>
    //             Dead Ends: <em>${details.deadEnds}</em><br>
    //         `);
    // }
    // function renderMaze(applyAlgorithm) {
    //     const grid = buildGrid(model.size, model.size);
    //     if (model.algorithm.maskable && model.applyMask) {
    //         applyMask(grid);
    //     }
    //     const maze = applyAlgorithm ? algorithms[model.algorithm.function](grid) : grid;
    //     maze.clearMetadata('visited');
    //     view.renderMaze(model.maze = maze);
    //     if (applyAlgorithm) {
    //         showMazeDetails();
    //     }
    // }
    //
    // view.on(EVENT_GO_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
    //     stateMachine.displaying();
    //     renderMaze(true);
    //     updateUiForNewState();
    // });
    //
    // view.on(EVENT_REFRESH_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
    //     renderMaze(true);
    // });
    //
    // view.on(EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED).ifState(STATE_DISPLAYING).then(() => {
    //     stateMachine.init();
    //     renderMaze(false);
    //     updateUiForNewState();
    // });
    //
    // view.on(EVENT_MASK_BUTTON_CLICKED).ifState(STATE_INIT).then(() => {
    //     model.applyMask = true;
    //     stateMachine.masking();
    //     updateUiForNewState();
    //     renderMaze(false);
    // });
    //
    // view.on(EVENT_SAVE_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
    //     try {
    //         model.masks.getCurrent().validate();
    //         stateMachine.init();
    //         model.applyMask = !model.masks.getCurrent().isEmpty();
    //         model.maze.clearMetadata('selected');
    //         renderMaze(false);
    //         updateUiForNewState();
    //
    //     } catch (msg) {
    //         alert('INVALID MASK\n' + msg);
    //     }
    // });
    //
    // view.on(EVENT_CLEAR_MASK_BUTTON_CLICKED).ifState(STATE_MASKING).then(() => {
    //     model.maze.forEachCell(cell => cell.unmask());
    //     model.masks.getCurrent().setFromModel();
    //     renderMaze(false);
    // });
    //
    // view.on(EVENT_APPLY_MASK_CLICKED).ifState(STATE_INIT).then(() => {
    //     view.setApplyMask(model.applyMask = !model.applyMask);
    //     renderMaze(false);
    // });
    //
    // function selectCellRange(x1,y1,x2,y2) {
    //     const startX = Math.min(x1, x2),
    //         startY = Math.min(y1, y2),
    //         endX = Math.max(x1, x2),
    //         endY = Math.max(y1, y2);
    //
    //     const grid = model.maze;
    //
    //     for (let x = startX; x <= endX; x++) {
    //         for (let y = startY; y <= endY; y++) {
    //             grid.getCell(x,y).metadata.selected = true;
    //         }
    //     }
    // }
    //
    // view.on(EVENT_MOUSE_MOVE).ifState(STATE_MASKING).then(event => {
    //     if (!event.data.button) {
    //         return;
    //     }
    //     if (!model.mouseDragStart) {
    //         model.mouseDragStart = event.data;
    //     }
    //
    //     if (event.data.shift) {
    //         selectCellRange(model.mouseDragStart.x, model.mouseDragStart.y, event.data.x, event.data.y);
    //     } else {
    //         model.maze.getCell(event.data.x, event.data.y).metadata.selected = true;
    //     }
    //     view.renderMaze(model.maze);
    // });
    //
    // view.on(EVENT_MOUSE_MOVE).ifState(STATE_DISPLAYING).then(event => {
    //     model.maze.findDistancesFrom(event.data.x, event.data.y);
    //     view.renderMaze(model.maze);
    //     model.maze.clearMetadata('maxDistance', 'maxDistancePoint', 'distance');
    // });
    //
    // view.on(EVENT_MOUSE_MOVE_END).ifState(STATE_MASKING).then(event => {
    //     model.maze.forEachCell(cell => {
    //         if (cell.metadata.selected) {
    //             if (cell.masked) {
    //                 cell.unmask();
    //             } else {
    //                 cell.mask();
    //             }
    //             delete cell.metadata.selected;
    //         }
    //     });
    //     model.masks.getCurrent().setFromModel();
    //     view.renderMaze(model.maze);
    //     delete model.mouseDragStart;
    // });
    //
    // view.on(EVENT_MOUSE_LEAVE).ifState(STATE_DISPLAYING).then(event => {
    //     view.renderMaze(model.maze);
    // });
    //
    // function movePlayer(newCell) {
    //     const currentCell = model.playState.cell;
    //     delete currentCell.metadata.player;
    //     if (!newCell.metadata.playerVisited) {
    //         newCell.metadata.playerVisited = 0;
    //     }
    //     newCell.metadata.playerVisited++;
    //     newCell.metadata.player = true;
    //     model.playState.cell = newCell;
    //     view.renderMaze(model.maze);
    // }
    //
    // view.on(EVENT_PLAY_CLICKED).ifState(STATE_DISPLAYING).then(event => {
    //     stateMachine.playing();
    //
    //     const details = model.maze.getDetails(),
    //         startX = details.longestPath.start.x,
    //         startY = details.longestPath.start.y,
    //         endX = details.longestPath.finish.x,
    //         endY = details.longestPath.finish.y;
    //
    //     model.playState = {
    //         cell: model.maze.getCell(startX, startY),
    //         start: {x: startX, y: startY},
    //         end: {x: endX, y: endY}
    //     };
    //     model.maze.getCell(endX, endY).metadata.finish = true;
    //     updateUiForNewState();
    //     movePlayer(model.playState.cell);
    //
    //     model.playState.timerStart = Date.now();
    //
    //     function updateTime() {
    //         view.showDetails(`Time Elapsed: <em>${formatTime(Date.now() - model.playState.timerStart)}</em>`);
    //     }
    //     updateTime();
    //
    //     model.playState.timer = setInterval(() => {
    //         updateTime();
    //     }, 1000);
    // });
    //
    // view.on(EVENT_QUIT_CLICKED).ifState(STATE_PLAYING).then(event => {
    //     clearInterval(model.playState.timer);
    //     model.maze.clearMetadata('player', 'playerVisited', 'solution', 'finish');
    //     showMazeDetails();
    //     view.renderMaze(model.maze);
    //     stateMachine.displaying();
    //     updateUiForNewState();
    // });
    //
    // view.on(EVENT_SOLUTION_CLICKED).ifState(STATE_PLAYING).then(event => {
    //     const route = model.maze.findRoute(model.playState.start, model.playState.end);
    //
    //     route.forEach((current, i) => {
    //         const previous = route[i - 1],
    //             next = route[i + 1];
    //         let arrows = '';
    //         if (previous) {
    //             if (current.x > previous.x) {
    //                 arrows += 'w';
    //             } else if (current.x < previous.x) {
    //                 arrows += 'e';
    //             } else if (current.y > previous.y) {
    //                 arrows += 'n';
    //             } else if (current.y < previous.y) {
    //                 arrows += 's';
    //             }
    //         } else {
    //             arrows = ' ';
    //         }
    //         if (next) {
    //             if (current.x > next.x) {
    //                 arrows += 'w';
    //             } else if (current.x < next.x) {
    //                 arrows += 'e';
    //             } else if (current.y > next.y) {
    //                 arrows += 'n';
    //             } else if (current.y < next.y) {
    //                 arrows += 's';
    //             }
    //         } else {
    //             arrows += ' ';
    //         }
    //         model.maze.getCell(current.x, current.y).metadata.solution = arrows;
    //     });
    //
    //     clearInterval(model.playState.timer);
    //     model.playState.finished = true;
    //     const startCell = model.maze.getCell(model.playState.start.x, model.playState.start.y);
    //     movePlayer(startCell);
    //     view.showDetails(`Optimal Path: <em>${route.length}</em>`);
    //     view.toggleSolutionButton(false);
    //     view.renderMaze(model.maze);
    // });
    //
    // view.on(EVENT_NAVIGATE).ifState(STATE_PLAYING).then(event => {
    //     let moveOk, direction = event.data.direction;
    //
    //     function getAvailableDirections() {
    //         return Object.entries(model.playState.cell.neighbours).filter(entry => entry[1].link).map(entry => entry[0]);
    //     }
    //     function getBackDirection(direction) {
    //         return {
    //             'north': 'south',
    //             'south': 'north',
    //             'east': 'west',
    //             'west': 'east'
    //         }[direction];
    //     }
    //     function mazeCompleted() {
    //         model.playState.finished = true;
    //         clearInterval(model.playState.timer);
    //
    //         const elaspedTimeMillis = Date.now() - model.playState.timerStart,
    //             elapsedTime = formatTime(elaspedTimeMillis),
    //             visitedCells = model.maze.filterCells(cell => cell.metadata.playerVisited).reduce((total, cell) => total + cell.metadata.playerVisited ,0),
    //             details = model.maze.getDetails(),
    //             optimalRouteLength = details.maxDistance,
    //             cellsPerSecond = optimalRouteLength / (elaspedTimeMillis / 1000);
    //
    //         view.showDetails(`
    //             Finish Time: ${elapsedTime}<br>
    //             Visited Cells: ${visitedCells}<br>
    //             Optimal Route: ${optimalRouteLength}<br><br>
    //             Optimality: <em>${Math.floor(100 * optimalRouteLength / visitedCells)}%</em><br>
    //             Cells per Second: <em>${Math.round(cellsPerSecond)}</em>
    //         `);
    //     }
    //
    //     while(true) {
    //         moveOk = model.playState.cell.neighbours[direction].link;
    //         if (moveOk) {
    //             const newLocation = model.playState.cell.neighbours[direction].cell;
    //             movePlayer(newLocation);
    //             if (newLocation.metadata.finish && !model.playState.finished) {
    //                 mazeCompleted();
    //                 break;
    //             }
    //
    //             if (event.data.shift) {
    //                 if (event.data.ctrl) {
    //                     const availableDirections = getAvailableDirections();
    //                     if (availableDirections.length === 2) {
    //                         const backDirection = getBackDirection(direction);
    //                         direction = availableDirections.find(dir => dir !== backDirection);
    //                     } else {
    //                         break;
    //                     }
    //                 }
    //             } else {
    //                 break;
    //             }
    //         } else {
    //             break;
    //         }
    //
    //     }
    //
    // });
    //
    // view.on(EVENT_DOWNLOAD).then(event => {
    //     const dataUrl = view.getCanvasAsDataUrl(),
    //         link = document.createElement('a');
    //     link.setAttribute('download', `maze_${model.size}x${model.size}_${Date.now()}.png`);
    //     link.setAttribute('href', dataUrl);
    //     link.click();
    // });
    //
    // updateUiForNewState();


};