function randomInt(num) {
    "use strict";
    return Math.floor(Math.random() * num);
}

function randomChoice(arr) {
    "use strict";
    console.assert(arr.length);
    return arr[randomInt(arr.length)];
}

function buildGrid(width, height) {
    "use strict";
    const cells = [...Array(height)].map((row, y) => [...Array(width)].map((_, x) => {
        return {
            neighbours: {},
            metadata: {},
            northEdge: y === 0,
            southEdge: y === height - 1,
            eastEdge: x === width - 1,
            westEdge: x === 0,
            randomNeighbour: function() {
                return randomChoice(Object.values(this.neighbours).map(neighbour => neighbour.cell).filter(n => n));
            },
            linkTo(other) {
                function findNeighbourFromCell(thisCell, neighbourCell) {
                    return Object.values(thisCell.neighbours).find(neighbour => neighbour.cell === neighbourCell);
                }
                findNeighbourFromCell(this, other).link = true;
                findNeighbourFromCell(other, this).link = true;
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

function generateMazeBinaryTree(grid) {
    "use strict";
    for (let x = 0; x < grid.width; x++) {
        for (let y = 0; y < grid.height; y++) {
            const cell = grid.getCell(x, y),
                rnd = Math.random(),
                removeEastWall = ((rnd < 0.5 || cell.southEdge) && !cell.eastEdge),
                removeSouthWall = ((rnd >= 0.5 || cell.eastEdge) && !cell.southEdge);

            if (removeEastWall) {
                const neighbour = cell.neighbours.east.cell;
                cell.neighbours.east.link = true;
                console.assert(neighbour.neighbours.west.cell === cell && neighbour.neighbours.west.link === false);
                neighbour.neighbours.west.link = true;

            } else if (removeSouthWall) {
                const neighbour = cell.neighbours.south.cell;
                cell.neighbours.south.link = true;
                console.assert(neighbour.neighbours.north.cell === cell && neighbour.neighbours.north.link === false);
                neighbour.neighbours.north.link = true;
            }
        }
    }
    return grid;
}

function generateMazeSidewinder(grid) {
    "use strict";
    for (let y = 0; y < grid.height; y++) {
        let runLength = 0;
        for (let x = 0; x < grid.width; x++) {
            runLength++;
            const cell = grid.getCell(x, y),
                rnd = Math.random(),
                removeEastWall = (rnd < 0.5 || cell.southEdge) && !cell.eastEdge;

            if (removeEastWall) {
                const neighbour = cell.neighbours.east.cell;
                cell.neighbours.east.link = true;
                console.assert(neighbour.neighbours.west.cell === cell && neighbour.neighbours.west.link === false);
                neighbour.neighbours.west.link = true;

            } else if (!cell.southEdge) {
                const randomCellFromRun = grid.getCell(x - randomInt(runLength), y);
                const neighbour = randomCellFromRun.neighbours.south.cell;
                randomCellFromRun.neighbours.south.link = true;
                console.assert(neighbour.neighbours.north.cell === randomCellFromRun && neighbour.neighbours.north.link === false);
                neighbour.neighbours.north.link = true;

                runLength = 0;
            }
        }
    }
    return grid;
}

function generateMazeAldousBroder(grid) {
    const startX = randomInt(grid.width),
        startY = randomInt(grid.height);

    let unvisitedCount = grid.width * grid.height,
        currentCell;

    grid.clearMetadata();

    function moveTo(nextCell) {
        "use strict";
        if (!nextCell.metadata.visited) {
            unvisitedCount--;
            nextCell.metadata.visited = true;
            if (currentCell) {
                currentCell.linkTo(nextCell);
            }
        }
        currentCell = nextCell;
    }

    moveTo(grid.getCell(startX, startY));
    while (unvisitedCount) {
        moveTo(currentCell.randomNeighbour());
    }
    return grid;
}

function generateMazeWilson(grid) {
    "use strict";
    grid.clearMetadata();

    function markVisited(cell) {
        cell.metadata.visited = true;
    }
    function filterCells(fnCriteria) {
        const matchingCells = [];
        grid.forEachCell(cell => {
            if (fnCriteria(cell)) {
                matchingCells.push(cell);
            }
        });
        return matchingCells;
    }
    function getRandomCell(fnCritera) {
        return randomChoice(filterCells(fnCritera));
    }
    function countCells(fnCriteria) {
        return filterCells(fnCriteria).length;
    }

    function removeLoops(cells) {
        const latestCell = cells[cells.length - 1],
            indexOfPreviousVisit = cells.findIndex(cell => cell === latestCell);
        if (indexOfPreviousVisit >= 0) {
            cells.splice(indexOfPreviousVisit + 1);
        }
    }

    markVisited(grid.getCell(randomInt(grid.width), randomInt(grid.height)));

    while (true) {
        let currentCell = getRandomCell(cell => !cell.metadata.visited),
            currentPath = [currentCell];
        while (true) {
            const nextCell = currentCell.randomNeighbour();
            currentPath.push(nextCell);

            if (nextCell.metadata.visited) {
                for (let i=0; i<currentPath.length-1; i++) {
                    const thisCell = currentPath[i],
                        nextCell = currentPath[i+1];
                    thisCell.linkTo(nextCell);
                }
                currentPath.forEach(cell => cell.metadata.visited = true);
                break;

            } else {
                removeLoops(currentPath);
                currentCell = nextCell;
            }
        }

        const unvisitedCount = countCells(cell => !cell.metadata.visited);
        if (!unvisitedCount) {
            break;
        }
    }

    return grid;
}

function generateMaze(grid) {
    "use strict";
    // return generateMazeBinaryTree(grid);
    //  return generateMazeSidewinder(grid);
    // return generateMazeAldousBroder(grid);
    return generateMazeWilson(grid);
}

const MAGNIFICATION = 20;
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

window.onload = () => {
    "use strict";
    const grid = buildGrid(20,20),
        maze = generateMaze(grid);

    render(maze);

    const elCanvas = document.getElementById('maze'),
        rect = elCanvas.getBoundingClientRect();

    elCanvas.onmousemove = e => {
        const x = Math.floor((e.clientX  - rect.left) / MAGNIFICATION),
            y = Math.floor((e.clientY - rect.top) / MAGNIFICATION);
        if (maze.getCell(x,y)){
            maze.findDistancesFrom(x,y);
        } else {
            maze.clearMetadata();
        }
        render(maze);
    };
};