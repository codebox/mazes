const EVENT_GO_BUTTON_CLICKED = 'goButtonClicked',
    EVENT_MAZE_SIZE_SELECTED = 'mazeSizeSelected',
    EVENT_MAZE_ALGORITHM_SELECTED = 'mazeAlgorithmSelected',
    EVENT_RESIZE = 'resize';

function buildView() {
    "use strict";
    const eventTarget = new EventTarget(),

        elCanvas = document.getElementById('maze'),
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
    window.onresize = () => {
        elCanvas.width = elCanvas.clientWidth;
        elCanvas.height = elCanvas.clientHeight;
        trigger(EVENT_RESIZE);
    };

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
            const WALL_THICKNESS = 1;
            function drawWall(x0, y0, x1, y1) {
                ctx.moveTo(x0 * MAGNIFICATION, y0 * MAGNIFICATION);
                ctx.lineTo(x1 * MAGNIFICATION, y1 * MAGNIFICATION);
            }

            function drawRectangle(x, y, distance) {
                ctx.moveTo(x * MAGNIFICATION, y * MAGNIFICATION);
                ctx.fillStyle = `hsl(${Math.floor(100 - 100 * distance)}, 100%, 50%)`;
                ctx.fillRect(x * MAGNIFICATION, y * MAGNIFICATION, MAGNIFICATION, MAGNIFICATION);
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