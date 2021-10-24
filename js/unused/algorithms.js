const algorithms = (() => {
    const ignoringMaskedCells = cell => !cell.masked,
        ignoringVisitedAndMaskedCells = cell => !cell.metadata.visited && ignoringMaskedCells(cell);

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
            const startCell = grid.getRandomCell(ignoringMaskedCells);

            let unvisitedCount = grid.countCells(ignoringMaskedCells),
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

            moveTo(startCell);
            while (unvisitedCount) {
                moveTo(currentCell.randomNeighbour(ignoringMaskedCells));
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

            markVisited(grid.getRandomCell(ignoringMaskedCells));

            while (true) {
                let currentCell = grid.getRandomCell(ignoringVisitedAndMaskedCells),
                    currentPath = [currentCell];
                while (true) {
                    const nextCell = currentCell.randomNeighbour(ignoringMaskedCells);
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

                const unvisitedCount = grid.countCells(ignoringVisitedAndMaskedCells);
                if (!unvisitedCount) {
                    break;
                }
            }

            return grid;
        },
        huntAndKill(grid) {
            "use strict";
            let currentCell = grid.getRandomCell(ignoringMaskedCells);

            function markVisited(cell) {
                cell.metadata.visited = true;
            }

            markVisited(currentCell);
            while (true) {
                const nextCell = currentCell.randomNeighbour(ignoringVisitedAndMaskedCells);
                if (nextCell) {
                    markVisited(nextCell);
                    currentCell.linkTo(nextCell);
                    currentCell = nextCell;
                } else {
                    const newStartCell = grid.getRandomCell(cell => ignoringVisitedAndMaskedCells(cell) && cell.filterNeighbours(cell => cell.metadata.visited).length);
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

            visitCell(grid.getRandomCell(ignoringMaskedCells));

            while (stack.length) {
                const nextCell = currentCell.randomNeighbour(ignoringVisitedAndMaskedCells);
                if (nextCell) {
                    visitCell(nextCell);

                } else {
                    while (!currentCell.filterNeighbours(ignoringVisitedAndMaskedCells).length) {
                        stack.pop();
                        if (!stack.length) {
                            break;
                        }
                        currentCell = stack[stack.length - 1];
                    }
                }
            }

            return grid;
        },
        kruskals(grid) {
            "use strict";
            const links = [],
                connectedSets = {};
            let cellId = 0;
            grid.forEachCell(cell => {
                if (cell.neighbours.east.cell) {
                    links.push([cell, cell.neighbours.east.cell]);
                }
                if (cell.neighbours.south.cell) {
                    links.push([cell, cell.neighbours.south.cell]);
                }
                cell.metadata.id = cellId;
                connectedSets[cellId] = [cell];
                cellId += 1;
            });

            shuffleArray(links);

            function mergeSets(id1, id2) {
                connectedSets[id2].forEach(cell => {
                    cell.metadata.id = id1;
                    connectedSets[id1].push(cell);
                })
                delete connectedSets[id2];
            }

            while (links.length) {
                const [cell1, cell2] = links.pop(),
                    id1 = cell1.metadata.id,
                    id2 = cell2.metadata.id;
                if (id1 !== id2) {
                    cell1.linkTo(cell2);
                    mergeSets(id1, id2);
                }
            }
            return grid;
        },
        simplifiedPrims(grid) {
            "use strict";
            function addToActive(cell) {
                active.push(cell);
                cell.metadata.visited = true;
            }
            const active = [];

            addToActive(grid.getRandomCell(ignoringMaskedCells));

            while (active.length) {
                const randomActiveCell = randomChoice(active),
                    randomInactiveNeighbour = randomActiveCell.randomNeighbour(ignoringVisitedAndMaskedCells);
                if (!randomInactiveNeighbour) {
                    const indexOfRandomActiveCell = active.indexOf(randomActiveCell);
                    console.assert(indexOfRandomActiveCell > -1);
                    active.splice(indexOfRandomActiveCell, 1);
                } else {
                    randomActiveCell.linkTo(randomInactiveNeighbour);
                    addToActive(randomInactiveNeighbour);
                }
            }

            return grid;
        },
        truePrims(grid) {
            "use strict";
            function addToActive(cell) {
                active.push(cell);
                cell.metadata.visited = true;
            }

            function getCellWithLowestCost(cells) {
                return cells.sort((n1, n2) => n1.metadata.cost - n2.metadata.cost)[0]
            }

            const active = [];

            grid.forEachCell(cell => {
                cell.metadata.cost = randomInt(grid.width * grid.height);
            });

            addToActive(grid.getRandomCell(ignoringMaskedCells));

            while (active.length) {
                const randomActiveCell = getCellWithLowestCost(active),
                    inactiveNeighbours = randomActiveCell.filterNeighbours(ignoringVisitedAndMaskedCells);
                if (!inactiveNeighbours.length) {
                    const indexOfRandomActiveCell = active.indexOf(randomActiveCell);
                    console.assert(indexOfRandomActiveCell > -1);
                    active.splice(indexOfRandomActiveCell, 1);
                } else {
                    const inactiveNeighbourWithLowestCost = getCellWithLowestCost(inactiveNeighbours);
                    randomActiveCell.linkTo(inactiveNeighbourWithLowestCost);
                    addToActive(inactiveNeighbourWithLowestCost);
                }
            }

            grid.clearMetadata('cost');

            return grid;
        },
        ellers(grid) {
            "use strict";
            const ODDS_OF_MERGE = 2,
                ODDS_OF_LINK_BELOW = 4,
                sets = {};
            let nextSetId = 1;

            function addCellToSet(setId, cell) {
                cell.metadata.setId = setId;
                if (!sets[setId]) {
                    sets[setId] = [];
                }
                sets[setId].push(cell);
            }

            function mergeSets(setId1, setId2) {
                const set1 = sets[setId1],
                    set2 = sets[setId2];
                console.assert(set1.length && set2.length);
                set2.forEach(cell => addCellToSet(setId1, cell));
                delete sets[setId2];
            }

            function linkToCellBelow(cell) {
                const {x,y} = cell,
                    cellBelow = grid.getCell(x, y+1);
                cell.linkTo(cellBelow);
                addCellToSet(cell.metadata.setId, cellBelow);
            }

            function mergeCellsInRow(y, oddsOfMerge=1) {
                for(let i=0; i<grid.width-1; i++) {
                    const cell1 = grid.getCell(i, y),
                        cell2 = grid.getCell(i+1, y),
                        cell1SetId = cell1.metadata.setId,
                        cell2SetId = cell2.metadata.setId;

                    if (cell1SetId !== cell2SetId && randomInt(oddsOfMerge) === 0) {
                        cell1.linkTo(cell2);
                        mergeSets(cell1.metadata.setId, cell2.metadata.setId);
                    }
                }
            }

            for (let y = 0; y < grid.height; y++) {
                const row = [];
                for (let x = 0; x < grid.width; x++) {
                    const cell = grid.getCell(x, y);
                    if (!cell.metadata.setId) {
                        addCellToSet(nextSetId++, cell);
                    }
                    row.push(cell);
                }

                const isLastRow = y === grid.height - 1;
                if (isLastRow) {
                    mergeCellsInRow(y);

                } else {
                    mergeCellsInRow(y, ODDS_OF_MERGE);

                    const cellsInRowBySet = {};
                    row.forEach(cell => {
                        const setId = cell.metadata.setId;
                        if (!cellsInRowBySet[setId]) {
                            cellsInRowBySet[setId] = [];
                        }
                        cellsInRowBySet[setId].push(cell);
                    });

                    Object.keys(cellsInRowBySet).forEach(setId => {
                        shuffleArray(cellsInRowBySet[setId]).forEach((cell, i) => {
                            if (i === 0) {
                                linkToCellBelow(cell);
                            } else if (randomInt(ODDS_OF_LINK_BELOW) === 0) {
                                linkToCellBelow(cell);
                            }
                        });
                    });
                }

            }
            grid.clearMetadata('setId');
            return grid;
        }
    };
})();