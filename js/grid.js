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