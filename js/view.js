const EVENT_GO_BUTTON_CLICKED = 'goButtonClicked',
    EVENT_MASK_BUTTON_CLICKED = 'maskButtonClicked',
    EVENT_SAVE_MASK_BUTTON_CLICKED = 'saveMaskButtonClicked',
    EVENT_CLEAR_MASK_BUTTON_CLICKED = 'clearMaskButtonClicked',
    EVENT_REFRESH_BUTTON_CLICKED = 'refreshButtonClicked',
    EVENT_CHANGE_MAZE_CONFIG_BUTTON_CLICKED = 'changeMazeConfigButtonClicked',
    EVENT_APPLY_MASK_CLICKED = 'applyMaskClicked',
    EVENT_PLAY_CLICKED = 'playClicked',
    EVENT_QUIT_CLICKED = 'quitClicked',
    EVENT_SOLUTION_CLICKED = 'solutionClicked',
    EVENT_MAZE_SIZE_SELECTED = 'mazeSizeSelected',
    EVENT_MAZE_ALGORITHM_SELECTED = 'mazeAlgorithmSelected',
    EVENT_MOUSE_MOVE = 'mouseMove',
    EVENT_MOUSE_MOVE_END = 'mouseMoveEnd',
    EVENT_MOUSE_CLICK = 'mouseClick',
    EVENT_RESIZE = 'resize',
    EVENT_MOUSE_LEAVE = 'mouseLeave',
    EVENT_TOUCH = 'touch',
    EVENT_NAVIGATE = 'navigate',
    EVENT_DOWNLOAD = 'download';

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
        elPlayButton = document.getElementById('play'),
        elMazeSizeList = document.getElementById('sizeSelector'),
        elMazeAlgorithmList = document.getElementById('algorithmSelector'),
        elApplyMaskToggle = document.getElementById('applyMaskToggle'),
        elMaskNotSupported = document.getElementById('maskNotSupported'),
        elApplyMask = document.getElementById('applyMask'),
        elInfo = document.getElementById('info'),
        elDetails = document.getElementById('details'),
        elQuitButton = document.getElementById('quit'),
        elSolutionButton = document.getElementById('solution'),
        elDownloadButton = document.getElementById('downloadMaze'),

        imgPlayer = new Image(),
        imgExit = new Image(),

        ctx = elCanvas.getContext('2d'),
        CELL_SELECTED_COLOUR = '#006BB7',
        CELL_DEFAULT_COLOUR = 'white',
        CELL_MASKED_COLOUR = 'black',
        SOLUTION_PATH_COLOUR = '#aaa',
        WALL_COLOUR = 'black',
        CELL_VISITED_COLOUR = '#006BB722';

    imgPlayer.src = "images/player.png";
    imgExit.src = "images/finish.png";

    const renderer = (() => {
        const WALL_THICKNESS = 1, OFFSET = WALL_THICKNESS / 2;

        function coord(value) {
            return value * magnification + OFFSET;
        }

        function drawWall(x0, y0, x1, y1) {
            ctx.strokeStyle = WALL_COLOUR;
            ctx.beginPath();
            ctx.moveTo(coord(x0), coord(y0));
            ctx.lineTo(coord(x1), coord(y1));
            ctx.stroke();
        }

        function drawRectangle(x, y, colour) {
            ctx.fillStyle = colour;
            ctx.beginPath();
            ctx.moveTo(coord(x), coord(y));
            ctx.fillRect(coord(x) - OFFSET, coord(y) - OFFSET, magnification + OFFSET, magnification + OFFSET);
            ctx.stroke();
        }

        function drawImage(x, y, img) {
            ctx.drawImage(img, coord(x), coord(y), magnification, magnification);
        }

        function drawDirectionArrows(x, y, arrows) {
            const l1 = magnification / 4,
                l2 = magnification / 8,
                [inArrow, outArrow] = arrows.split(''),
                xCoordCenter = coord(x) + magnification / 2,
                yCoordCenter = coord(y) + magnification / 2;

            function drawArrow(side, inComing) {
                const reflection = inComing ? 1 : -1;
                let xc, yc, x1, y1, x2, y2, x3, y3, x4, y4;

                if (side === 'n') {
                    xc = xCoordCenter;
                    yc = yCoordCenter - magnification / 4;
                    x1 = xc - l1/2;
                    y1 = yc - reflection * l2/2;
                    x2 = xc;
                    y2 = yc + reflection * l2/2;
                    x3 = xc + l1/2;
                    y3 = yc - reflection * l2/2;
                    x4 = xCoordCenter;
                    y4 = yCoordCenter - magnification / 2;

                } else if (side === 's') {
                    xc = xCoordCenter;
                    yc = yCoordCenter + magnification / 4;
                    x1 = xc - l1/2;
                    y1 = yc + reflection * l2/2;
                    x2 = xc;
                    y2 = yc - reflection * l2/2;
                    x3 = xc + l1/2;
                    y3 = yc + reflection * l2/2;
                    x4 = xCoordCenter;
                    y4 = yCoordCenter + magnification/2;

                } else if (side === 'w') {
                    xc = xCoordCenter - magnification / 4;
                    yc = yCoordCenter;
                    x1 = xc - reflection * l2/2;
                    y1 = yc - l1/2;
                    x2 = xc + reflection * l2/2;
                    y2 = yc;
                    x3 = xc - reflection * l2/2;
                    y3 = yc + l1/2;
                    x4 = xCoordCenter - magnification/2;
                    y4 = yCoordCenter;

                } else if (side === 'e') {
                    xc = xCoordCenter + magnification / 4;
                    yc = yCoordCenter;
                    x1 = xc + reflection * l2/2;
                    y1 = yc - l1/2;
                    x2 = xc - reflection * l2/2;
                    y2 = yc;
                    x3 = xc + reflection * l2/2;
                    y3 = yc + l1/2;
                    x4 = xCoordCenter + magnification/2;
                    y4 = yCoordCenter;
                }
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.moveTo(x4, y4);
                ctx.lineTo(xCoordCenter, yCoordCenter);

            }
            ctx.strokeStyle = SOLUTION_PATH_COLOUR;
            ctx.beginPath();
            drawArrow(inArrow, true);
            drawArrow(outArrow, false);
            ctx.stroke();
        }

        let magnification;

        return {
            render(maze) {
                magnification = Math.round((elCanvas.width - WALL_THICKNESS * (maze.width + 1))/ maze.width);

                ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
                ctx.lineWidth = WALL_THICKNESS;

                maze.filterCells(cell => cell.masked).forEach(cell => {
                    if (cell.metadata.selected) {
                        drawRectangle(cell.x, cell.y, CELL_SELECTED_COLOUR);
                    } else {
                        drawRectangle(cell.x, cell.y, stateMachine.state === STATE_MASKING ? CELL_MASKED_COLOUR : CELL_DEFAULT_COLOUR);
                    }
                });

                maze.filterCells(cell => !cell.masked).forEach(cell => {
                    const {x,y} = cell;
                    if (cell.metadata.selected) {
                        drawRectangle(x, y, CELL_SELECTED_COLOUR);
                    }

                    if (maze.metadata.maxDistance) {
                        const distance = cell.metadata.distance / maze.metadata.maxDistance,
                            colour = `hsl(${Math.floor(100 - 100 * distance)}, 100%, 50%)`;
                        drawRectangle(x, y, colour);
                    }
                    if (cell.metadata.playerVisited || cell.metadata.player) {
                        drawRectangle(x, y, CELL_VISITED_COLOUR);
                    }

                    if (cell.metadata.solution) {
                        drawDirectionArrows(x, y, cell.metadata.solution);
                    }

                    if (cell.metadata.player) {
                        drawImage(x, y, imgPlayer);
                    } else if (cell.metadata.finish) {
                        drawImage(x, y, imgExit);
                    }

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
                });
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
    elPlayButton.onclick = () => trigger(EVENT_PLAY_CLICKED);
    elQuitButton.onclick = () => trigger(EVENT_QUIT_CLICKED);
    elSolutionButton.onclick = () => trigger(EVENT_SOLUTION_CLICKED);
    elDownloadButton.onclick = () => trigger(EVENT_DOWNLOAD);

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
    elCanvas.ontouchmove = event => {
        const {x, y} = renderer.getMazeCoordsFromScreenCoords(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
        if (x !== null && y !== null) {
            trigger(EVENT_MOUSE_MOVE, {
                x, y, button: 1, shift: true
            });
        }
    };
    elCanvas.ontouchend = event => {
        event.preventDefault();
        trigger(EVENT_MOUSE_MOVE_END);
    };
    elCanvas.onmouseup = event => triggerMouseEvent(event, EVENT_MOUSE_MOVE_END);
    elCanvas.onmouseleave = event => trigger(event, EVENT_MOUSE_LEAVE);

    function handleCanvasClick(x, y) {
        if (x !== null && y !== null && model.playState) {
            const playerPosition = model.playState.cell,
                xDiff = x - playerPosition.x,
                yDiff = y - playerPosition.y;
            if (xDiff || yDiff) {
                const horizontalMove = Math.abs(xDiff) > Math.abs(yDiff);
                let direction;
                if (horizontalMove) {
                    direction = xDiff > 0 ? 'east' : 'west';
                } else {
                    direction = yDiff > 0 ? 'south' : 'north';
                }
                trigger(EVENT_NAVIGATE, {
                    direction, ctrl: true, shift: true
                });
            }
        }
    }
    elCanvas.ontouchstart = event => {
        const {x,y} = renderer.getMazeCoordsFromScreenCoords(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
        handleCanvasClick(x, y);
    };
    elCanvas.onclick = event => {
        const {x,y} = renderer.getMazeCoordsFromScreenCoords(event.clientX, event.clientY);
        handleCanvasClick(x, y);
    };

    window.onkeydown = event => {
        const code = event.keyCode;

        let x = 0, y = 0, direction, download;

        if (code === 37) {
            x = -1;
            direction = 'west';

        } else if (code === 39) {
            x = 1;
            direction = 'east';

        } else if (code === 38) {
            y = -1;
            direction = 'north';

        } else if (code === 40) {
            y = 1;
            direction = 'south';

        } else if (code === 68) { // 'd'
            download = true;

        } else {
            return;
        }

        if (direction) {
            trigger(EVENT_NAVIGATE, {x, y, direction, shift: event.shiftKey, ctrl: event.ctrlKey});
        } else if (download) {
            trigger(EVENT_DOWNLOAD);
        }
    };

    function fitCanvasToContainer() {
        const minSize = Math.min(elMazeContainer.clientWidth, elMazeContainer.clientHeight);
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
        toggleDetails(display) {
            toggleElementVisibility(elDetails, display);
        },
        togglePlayButton(display) {
            toggleElementVisibility(elPlayButton, display);
        },
        toggleQuitButton(display) {
            toggleElementVisibility(elQuitButton, display);
        },
        toggleDownloadButton(display) {
            toggleElementVisibility(elDownloadButton, display);
        },
        toggleSolutionButton(display) {
            toggleElementVisibility(elSolutionButton, display);
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
        showDetails(details) {
            elDetails.innerHTML = details;
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
        },
        getCanvasAsDataUrl() {
            return elCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        }
    };
}