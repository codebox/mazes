

function buildGrid(width, height) {
    "use strict";
    function findNeighbourFromCell(thisCell, neighbourCell) {
        return Object.values(thisCell.neighbours).find(neighbour => neighbour.cell === neighbourCell);
    }

    const cells = [...Array(height)].map((row, y) => [...Array(width)].map((_, x) => {
        return {
            neighbours: {},
            metadata: {},
            northEdge: y === 0,
            southEdge: y === height - 1,
            eastEdge: x === width - 1,
            westEdge: x === 0,
            masked: false,
            filterNeighbours(fnCriteria = () => true) {
                return Object.values(this.neighbours).filter(neighbour => neighbour.cell).filter(neighbour => fnCriteria(neighbour.cell, neighbour.link)).map(neighbour => neighbour.cell);
            },
            randomNeighbour: function(fnCriteria) {
                const matchingNeighbours = this.filterNeighbours(fnCriteria);
                if (matchingNeighbours.length) {
                    return randomChoice(matchingNeighbours);
                }
            },
            linkTo(other) {
                findNeighbourFromCell(this, other).link = true;
                findNeighbourFromCell(other, this).link = true;
            },
            mask() {
                Object.values(this.neighbours).filter(neighbour => neighbour.cell).forEach(neighbour => {
                    const thisAsNeighbour = findNeighbourFromCell(neighbour.cell, this);
                    neighbour.cell = null;
                    neighbour.link = false;
                    thisAsNeighbour.cell = null;
                    thisAsNeighbour.link = false;
                });
                this.masked = true;
            },
            x,y
        };
    }));

    const grid = {
        getCell(x, y) {
            if (x>=0 && x<width && y >= 0 && y < height) {
                return cells[y][x];
            }
        },
        forEachCell(fn) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    fn(this.getCell(x, y), x, y);
                }
            }
        },
        findDistancesFrom(x, y) {
            this.forEachCell(cell => delete cell.metadata.distance);
            delete this.metadata.maxDistance;
            const startCell = this.getCell(x, y);
            startCell.metadata.distance = 0;
            const frontier = [startCell];
            let maxDistance = 0;
            while(frontier.length) {
                const next = frontier.shift(),
                    frontierDistance = next.metadata.distance;
                const linkedUndistancedNeighbours = Object.values(next.neighbours).filter(neighbour => neighbour.link).filter(neighbour => neighbour.cell.metadata.distance === undefined).map(neighbour => neighbour.cell);
                linkedUndistancedNeighbours.forEach(neighbour => {
                    neighbour.metadata.distance = frontierDistance + 1;
                });
                frontier.push(...linkedUndistancedNeighbours);
                maxDistance = Math.max(frontierDistance+1, maxDistance);
            }
            this.metadata.maxDistance = maxDistance;
        },
        clearMetadata() {
            this.forEachCell(cell => cell.metadata = {});
            this.metadata = {};
        },
        filterCells(fnCriteria = () => true) {
            const matchingCells = [];
            this.forEachCell(cell => {
                if (fnCriteria(cell)) {
                    matchingCells.push(cell);
                }
            });
            return matchingCells;
        },
        getRandomCell(fnCritera) {
            const matchingCells = this.filterCells(fnCritera);
            if (matchingCells.length) {
                return randomChoice(matchingCells);
            }
        },
        countCells(fnCriteria) {
            return this.filterCells(fnCriteria).length;
        },
        maskCell(x,y) {
            this.getCell(x, y).mask();
        },
        cells, //TODO remove
        metadata: {},
        width,height
    };

    grid.forEachCell((cell, x, y) => {
        cell.neighbours.north = {cell: grid.getCell(x, y-1), link: false};
        cell.neighbours.south = {cell: grid.getCell(x, y+1), link: false};
        cell.neighbours.west = {cell: grid.getCell(x-1, y), link: false};
        cell.neighbours.east = {cell: grid.getCell(x+1, y), link: false};
    });

    return grid;
}

const MAGNIFICATION = 10;
function render(maze) {
    "use strict";
    const elCanvas = document.getElementById('maze'),
        ctx = elCanvas.getContext('2d'),
        WALL_THICKNESS = 1;

    function drawWall(x0, y0, x1, y1) {
        ctx.moveTo(x0 * MAGNIFICATION, y0 * MAGNIFICATION);
        ctx.lineTo(x1 * MAGNIFICATION, y1 * MAGNIFICATION);
    }
    function drawRectangle(x, y, distance) {
        ctx.moveTo(x * MAGNIFICATION, y * MAGNIFICATION);
        //ctx.fillStyle = `rgba(0, 0, 255, ${distance})`;
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

    ctx.clearRect(0, 0, 500, 500);
    ctx.beginPath();
    ctx.lineWidth = WALL_THICKNESS;
    for (let x = 0; x < maze.width; x++) {
        for (let y = 0; y < maze.height; y++) {
            const cell = maze.getCell(x, y);
            renderCell(x, y, cell);
        }
    }
    ctx.stroke();
}

function showDetails(grid) {
    "use strict";
    const deadEndCount = grid.filterCells(cell => cell.filterNeighbours((neighbour, link) => link).length === 1).length;
    document.getElementById('details').innerHTML = `Dead Ends: ${deadEndCount}`;
}
window.onload = () => {
    "use strict";
    const model = buildModel(),
        view = buildView();

    config.mazeSizes.forEach(size => {
        view.addMazeSize(size, `${size}x${size}`);
    });
    view.setMazeSize(model.size);

    config.algorithms.forEach(algorithm => {
        view.addMazeAlgorithm(algorithm.function, algorithm.name) ;
    });
    view.setMazeAlgorithm(model.algorithm);

    // grid.maskCell(8,8);
    // grid.maskCell(9,8);
    // grid.maskCell(10,8);
    // grid.maskCell(11,8);
    // grid.maskCell(8,9);
    // grid.maskCell(9,9);
    // grid.maskCell(10,9);
    // grid.maskCell(11,9);
    // grid.maskCell(8,10);
    // grid.maskCell(9,10);
    // grid.maskCell(10,10);
    // grid.maskCell(11,10);
    // grid.maskCell(8,11);
    // grid.maskCell(9,11);
    // grid.maskCell(10,11);
    // grid.maskCell(11,11);
    // const maze = generateMaze(grid);

    // const elMazeContainer = document.getElementById('mazeContainer');
    // window.onresize = () => {
    //     const width = elMazeContainer.offsetWidth,
    //         height = elMazeContainer.offsetHeight,
    //         mazeSize = Math.min(width, height),
    //         ctx = elCanvas.getContext('2d');
    //     ctx.canvas.width = mazeSize;
    //     ctx.canvas.height = mazeSize;
    //     ctx.scale(mazeSize/500, mazeSize/500);
    //     render(maze);
    // };

    const elCanvas = document.getElementById('maze'),
        rect = elCanvas.getBoundingClientRect();

    // elCanvas.onmousemove = e => {
    //     const x = Math.floor((e.clientX  - rect.left) / MAGNIFICATION),
    //         y = Math.floor((e.clientY - rect.top) / MAGNIFICATION),
    //         cell = maze.getCell(x,y);
    //     if (cell && !cell.masked){
    //         maze.findDistancesFrom(x,y);
    //     } else {
    //         maze.clearMetadata();
    //     }
    //     render(maze);
    // };

    view.on(EVENT_GO_BUTTON_CLICKED).then(() => {
        const grid = buildGrid(model.size, model.size);
        view.renderMaze(model.maze = algorithms[model.algorithm](grid));
        // showDetails(maze);
    });

    view.on(EVENT_MAZE_SIZE_SELECTED).then(event => {
         view.setMazeSize(model.size = event.data);
    });

    view.on(EVENT_MAZE_ALGORITHM_SELECTED).then(event => {
        view.setMazeAlgorithm(model.algorithm = event.data);
    });

    view.on(EVENT_RESIZE).then(() => {
        view.renderMaze(model.maze);
    });
};