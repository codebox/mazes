const EVENT_GO_BUTTON_CLICKED = 'goButtonClicked',
    EVENT_MAZE_SIZE_SELECTED = 'mazeSizeSelected',
    EVENT_MAZE_ALGORITHM_SELECTED = 'mazeAlgorithmSelected',
    EVENT_RESIZE = 'resize';

function buildView() {
    "use strict";
    const eventTarget = new EventTarget(),

        elCanvas = document.getElementById('maze'),
        elMazeContainer = document.getElementById('mazeContainer'),
        elGoButton = document.getElementById('go'),
        elMazeSizeList = document.getElementById('sizeSelector'),
        elMazeAlgorithmList = document.getElementById('algorithmSelector'),

        ctx = elCanvas.getContext('2d');

    function trigger(eventName, eventData) {
        const event = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
    }

    elGoButton.onclick = () => trigger(EVENT_GO_BUTTON_CLICKED);
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

    return {
        addMazeSize(value, description) {
            const elMazeSizeItem = document.createElement('li');
            elMazeSizeItem.innerHTML = description;
            elMazeSizeItem.onclick = () => trigger(EVENT_MAZE_SIZE_SELECTED, value);
            elMazeSizeList.appendChild(elMazeSizeItem);
            elMazeSizeItem.dataset.value = value;
        },
        addMazeAlgorithm(value, description) {
            const elMazeAlgorithmItem = document.createElement('li');
            elMazeAlgorithmItem.innerHTML = description;
            elMazeAlgorithmItem.onclick = () => trigger(EVENT_MAZE_ALGORITHM_SELECTED, value);
            elMazeAlgorithmList.appendChild(elMazeAlgorithmItem);
            elMazeAlgorithmItem.dataset.value = value;
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
            const WALL_THICKNESS = 1, MAGNIFICATION = Math.round((elCanvas.width - WALL_THICKNESS * (maze.width + 1))/ maze.width), OFFSET = WALL_THICKNESS / 2;
            function coord(value) {
                return value * MAGNIFICATION + OFFSET;
            }
            function drawWall(x0, y0, x1, y1) {
                ctx.moveTo(coord(x0), coord(y0));
                ctx.lineTo(coord(x1), coord(y1));
            }

            function drawRectangle(x, y, distance) {
                ctx.moveTo(coord(x), coord(y));
                ctx.fillStyle = `hsl(${Math.floor(100 - 100 * distance)}, 100%, 50%)`;
                ctx.fillRect(coord(x), coord(y), MAGNIFICATION, MAGNIFICATION);
            }

            function renderCell(x, y, cell) {
                if (cell.masked) {
                    return;
                }
                if (maze.metadata.maxDistance) {
                    drawRectangle(x,y,cell.metadata.distance/maze.metadata.maxDistance);
                }
                if (!cell.neighbours.north.link) {
                    drawWall(x, y, x+1, y);
                }
                if (!cell.neighbours.east.link) {
                    drawWall(x+1, y, x+1, y+1);
                }
                if (!cell.neighbours.south.link) {
                    drawWall(x, y+1, x+1, y+1);
                }
                if (!cell.neighbours.west.link) {
                    drawWall(x, y, x, y+1);
                }
            }

            ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
            ctx.beginPath();
            ctx.lineWidth = WALL_THICKNESS;

            maze.forEachCell((cell, x, y) => {
                renderCell(x, y, cell);
            });

            ctx.stroke();
        },
        on(eventName) {
            return {
                then(handler) {
                    eventTarget.addEventListener(eventName, handler);
                }
            };
        }
    };
}