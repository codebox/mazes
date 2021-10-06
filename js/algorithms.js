const algorithms = (() => {

    return {
        binaryTree(grid) {
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
        },
        sidewinder(grid) {
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
        },
        aldousBroder(grid) {
            const startX = randomInt(grid.width),
                startY = randomInt(grid.height);

            let unvisitedCount = grid.width * grid.height,
                currentCell;

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
        },
        wilson(grid) {
            "use strict";
            function markVisited(cell) {
                cell.metadata.visited = true;
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
                let currentCell = grid.getRandomCell(cell => !cell.metadata.visited),
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

                const unvisitedCount = grid.countCells(cell => !cell.metadata.visited);
                if (!unvisitedCount) {
                    break;
                }
            }

            return grid;
        },
        huntAndKill(grid) {
            "use strict";
            let currentCell = grid.getRandomCell();

            function markVisited(cell) {
                cell.metadata.visited = true;
            }

            markVisited(currentCell);
            while (true) {
                const nextCell = currentCell.randomNeighbour(cell => !cell.metadata.visited);
                if (nextCell) {
                    markVisited(nextCell);
                    currentCell.linkTo(nextCell);
                    currentCell = nextCell;
                } else {
                    const newStartCell = grid.getRandomCell(cell => !cell.metadata.visited && cell.filterNeighbours(cell => cell.metadata.visited).length);
                    if (newStartCell) {
                        const visitedNeighbour = newStartCell.randomNeighbour(cell => cell.metadata.visited);
                        markVisited(newStartCell);
                        newStartCell.linkTo(visitedNeighbour);
                        currentCell = newStartCell;
                    } else {
                        break;
                    }
                }
            }

            return grid;
        },
        recursiveBacktrack(grid){
            "use strict";
            const stack = [];
            let currentCell;

            function visitCell(nextCell) {
                const previousCell = currentCell;
                currentCell = nextCell;
                currentCell.metadata.visited = true;
                if (previousCell) {
                    currentCell.linkTo(previousCell);
                }
                stack.push(currentCell);
            }

            visitCell(grid.getRandomCell());

            while (stack.length) {
                const nextCell = currentCell.randomNeighbour(cell => !cell.metadata.visited);
                if (nextCell) {
                    visitCell(nextCell);

                } else {
                    while (!currentCell.filterNeighbours(cell => !cell.metadata.visited).length) {
                        stack.pop();
                        if (!stack.length) {
                            break;
                        }
                        currentCell = stack[stack.length - 1];
                    }
                }
            }

            return grid;
        }
    };
})();