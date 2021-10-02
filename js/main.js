function buildGrid(width, height) {
    "use strict";
    const cells = [...Array(height)].map((row, y) => [...Array(width)].map((_, x) => {
        return {
            neighbours: {},
            northEdge: y === 0,
            southEdge: y === height - 1,
            eastEdge: x === width - 1,
            westEdge: x === 0,
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
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    fn(this.getCell(x, y), x, y);
                }
            }
        },cells,
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
    console.log(grid.cells)
    return grid;
}
function generateMaze(grid) {
    "use strict";
    return generateMazeBinaryTree(grid);
}

function render(maze) {
    "use strict";
    const elCanvas = document.getElementById('maze'),
        ctx = elCanvas.getContext('2d'),
        MAGNIFICATION = 15,
        WALL_THICKNESS = 1;

    function drawWall(x0, y0, x1, y1) {
        ctx.moveTo(x0 * MAGNIFICATION, y0 * MAGNIFICATION);
        ctx.lineTo(x1 * MAGNIFICATION, y1 * MAGNIFICATION);
    }

    function renderCell(x, y, cell) {
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
    const grid = buildGrid(30,30),
        maze = generateMaze(grid);

    render(maze);
};