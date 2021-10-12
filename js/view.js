const EVENT_GO_BUTTON_CLICKED = 'goButtonClicked',
    EVENT_MASK_BUTTON_CLICKED = 'maskButtonClicked',
    EVENT_SAVE_MASK_BUTTON_CLICKED = 'saveMaskButtonClicked',
    EVENT_CLEAR_MASK_BUTTON_CLICKED = 'clearMaskButtonClicked',
    EVENT_REFRESH_BUTTON_CLICKED = 'refreshButtonClicked',
    EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED = 'changeMazeConfigButtonClicked',
    EVENT_APPLY_MASK_CLICKED = 'applyMaskClicked',
    EVENT_MAZE_SIZE_SELECTED = 'mazeSizeSelected',
    EVENT_MAZE_ALGORITHM_SELECTED = 'mazeAlgorithmSelected',
    EVENT_MOUSE_MOVE = 'mouseMove',
    EVENT_MOUSE_MOVE_END = 'mouseMoveEnd',
    EVENT_MOUSE_CLICK = 'mouseClick',
    EVENT_RESIZE = 'resize',
    EVENT_MOUSE_LEAVE = 'mouseLeave';

function buildView(stateMachine, model) {
    "use strict";
    const eventTarget = new EventTarget(),

        elCanvas = document.getElementById('maze'),
        elMazeContainer = document.getElementById('mazeContainer'),
        elGoButton = document.getElementById('go'),
        elRefreshButton = document.getElementById('refreshMaze'),
        elChangeMazeConfigButton = document.getElementById('changeMazeConfig'),
        elMaskButton = document.getElementById('mask'),
        elSaveMaskButton = document.getElementById('saveMask'),
        elClearMaskButton = document.getElementById('clearMask'),
        elMazeSizeList = document.getElementById('sizeSelector'),
        elMazeAlgorithmList = document.getElementById('algorithmSelector'),
        elApplyMaskToggle = document.getElementById('applyMaskToggle'),
        elMaskNotSupported = document.getElementById('maskNotSupported'),
        elApplyMask = document.getElementById('applyMask'),
        elInfo= document.getElementById('info'),

        ctx = elCanvas.getContext('2d'),
        CELL_SELECTED_COLOUR = '#006BB7',
        CELL_DEFAULT_COLOUR = 'white',
        CELL_MASKED_COLOUR = 'black';

    const renderer = (() => {
        const WALL_THICKNESS = 1, OFFSET = WALL_THICKNESS / 2;

        function coord(value) {
            return value * magnification + OFFSET;
        }

        function drawWall(x0, y0, x1, y1) {
            ctx.moveTo(coord(x0), coord(y0));
            ctx.lineTo(coord(x1), coord(y1));
        }

        function drawRectangle(x, y, colour) {
            ctx.moveTo(coord(x), coord(y));
            ctx.fillStyle = colour;
            ctx.fillRect(coord(x) - OFFSET, coord(y) - OFFSET, magnification + OFFSET, magnification + OFFSET);
        }

        let magnification;

        return {
            render(maze) {
                magnification = Math.round((elCanvas.width - WALL_THICKNESS * (maze.width + 1))/ maze.width);

                ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
                ctx.beginPath();
                ctx.lineWidth = WALL_THICKNESS;

                maze.forEachCell((cell, x, y) => {
                    if (cell.metadata.selected) {
                        drawRectangle(x, y, CELL_SELECTED_COLOUR);

                    } else if (cell.masked) {
                        drawRectangle(x, y, stateMachine.state === STATE_MASKING ? CELL_MASKED_COLOUR : CELL_DEFAULT_COLOUR );

                    } else {
                        if (!cell.neighbours.north.link) {
                            drawWall(x, y, x + 1, y);
                        }
                        if (!cell.neighbours.east.link) {
                            drawWall(x + 1, y, x + 1, y + 1);
                        }
                        if (!cell.neighbours.south.link) {
                            drawWall(x, y + 1, x + 1, y + 1);
                        }
                        if (!cell.neighbours.west.link) {
                            drawWall(x, y, x, y + 1);
                        }
                        if (maze.metadata.maxDistance) {
                            const distance = cell.metadata.distance / maze.metadata.maxDistance,
                                colour = `hsl(${Math.floor(100 - 100 * distance)}, 100%, 50%)`;
                            drawRectangle(x, y, colour);
                        }
                    }
                });

                ctx.stroke();
            },
            getMazeCoordsFromScreenCoords(screenX, screenY) {
                const rect = elCanvas.getBoundingClientRect(),
                    x = Math.floor((screenX  - rect.left) / magnification),
                    y = Math.floor((screenY - rect.top) / magnification);

                if (x>= 0 && x < model.size && y >= 0 && y < model.size) {
                    return {x,y};
                }
                return {x:null, y:null};
            }
        }
    })();

    function trigger(eventName, eventData) {
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
        // console.log('EVENT: ' + eventName + '' + JSON.stringify(eventData));
    }

    elGoButton.onclick = () => trigger(EVENT_GO_BUTTON_CLICKED);
    elMaskButton.onclick = () => trigger(EVENT_MASK_BUTTON_CLICKED);
    elSaveMaskButton.onclick = () => trigger(EVENT_SAVE_MASK_BUTTON_CLICKED);
    elClearMaskButton.onclick = () => trigger(EVENT_CLEAR_MASK_BUTTON_CLICKED);
    elChangeMazeConfigButton.onclick = () => trigger(EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED);
    elRefreshButton.onclick = () => trigger(EVENT_REFRESH_BUTTON_CLICKED);
    elApplyMaskToggle.onclick = () => trigger(EVENT_APPLY_MASK_CLICKED);

    function triggerMouseEvent(mouseEvent, viewEventName) {
        const {x,y} = renderer.getMazeCoordsFromScreenCoords(mouseEvent.clientX, mouseEvent.clientY);
        if (x !== null && y !== null) {
            trigger(viewEventName, {
                x, y,
                button: mouseEvent.buttons,
                shift: mouseEvent.shiftKey
            });
        }
    }
    elCanvas.onmousemove = elCanvas.onmousedown = event => triggerMouseEvent(event, EVENT_MOUSE_MOVE);
    elCanvas.onclick = event => triggerMouseEvent(event, EVENT_MOUSE_CLICK);
    elCanvas.onmouseup = event => triggerMouseEvent(event, EVENT_MOUSE_MOVE_END);
    elCanvas.onmouseleave = event => trigger(EVENT_MOUSE_LEAVE);

    function fitCanvasToContainer() {
        const minSize = Math.min(elMazeContainer.clientWidth, elMazeContainer.clientHeight);
        console.log(elMazeContainer.clientWidth, elMazeContainer.clientHeight);
        elCanvas.width = minSize;
        elCanvas.height = minSize;
    }
    window.onresize = () => {
        fitCanvasToContainer();
        trigger(EVENT_RESIZE);
    };
    fitCanvasToContainer();

    function toggleElementVisibility(el, display) {
        el.style.display = display ? 'block' : 'none';
    }

    return {
        addMazeSize(value, description) {
            const elMazeSizeItem = document.createElement('li');
            elMazeSizeItem.innerHTML = description;
            elMazeSizeItem.onclick = () => trigger(EVENT_MAZE_SIZE_SELECTED, value);
            elMazeSizeList.appendChild(elMazeSizeItem);
            elMazeSizeItem.dataset.value = value;
        },
        addMazeAlgorithm(algorithmName) {
            const elMazeAlgorithmItem = document.createElement('li');
            elMazeAlgorithmItem.innerHTML = algorithmName;
            elMazeAlgorithmItem.onclick = () => trigger(EVENT_MAZE_ALGORITHM_SELECTED, algorithmName);
            elMazeAlgorithmList.appendChild(elMazeAlgorithmItem);
            elMazeAlgorithmItem.dataset.value = algorithmName;
        },
        setMazeSize(size) {
            [...elMazeSizeList.querySelectorAll('li')].forEach(el => {
                el.classList.toggle('selected', Number(el.dataset.value) === size);
            });
        },
        setMazeAlgorithm(algorithmName) {
            [...elMazeAlgorithmList.querySelectorAll('li')].forEach(el => {
                el.classList.toggle('selected', el.dataset.value === algorithmName);
            });
        },
        renderMaze(maze) {
            renderer.render(maze);
        },
        toggleGoButton(display) {
            toggleElementVisibility(elGoButton, display);
        },
        toggleRefreshButton(display) {
            toggleElementVisibility(elRefreshButton, display);
        },
        toggleMaskButton(display) {
            toggleElementVisibility(elMaskButton, display);
        },
        toggleSaveMaskButton(display) {
            toggleElementVisibility(elSaveMaskButton, display);
        },
        toggleClearMaskButton(display) {
            toggleElementVisibility(elClearMaskButton, display);
        },
        toggleChangeMazeConfigButton(display) {
            toggleElementVisibility(elChangeMazeConfigButton, display);
        },
        toggleMazeConfig(display) {
            toggleElementVisibility(elMazeSizeList, display);
            toggleElementVisibility(elMazeAlgorithmList, display);
        },
        togglelApplyMask(display) {
            toggleElementVisibility(elApplyMask, display);
        },
        setMaskingAllowed(allowed) {
            toggleElementVisibility(elApplyMaskToggle, allowed);
            toggleElementVisibility(elMaskNotSupported, !allowed);
        },
        setApplyMask(selected) {
            elApplyMaskToggle.classList.toggle('selected', selected);
        },
        updateEditMaskButtonText(maskExists) {
            elMaskButton.innerHTML = maskExists ? 'Edit Mask' : 'Create Mask';
        },
        showInfo(info) {
            elInfo.innerHTML = info;
        },
        on(eventName) {
            return {
                then(handler) {
                    eventTarget.addEventListener(eventName, handler);
                },
                ifState(...states) {
                    return {
                        then(handler) {
                            eventTarget.addEventListener(eventName, event => {
                                if (states.includes(stateMachine.state)) {
                                    handler(event);
                                }
                            });
                        }
                    };
                }
            };
        }
    };
}