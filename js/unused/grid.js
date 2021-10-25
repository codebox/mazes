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
                    if (thisAsNeighbour) {
                        neighbour.cell = null;
                        neighbour.link = false;
                        thisAsNeighbour.cell = null;
                        thisAsNeighbour.link = false;
                    }
                });
                this.masked = true;
            },
            unmask() {
                this.populateNeighbours();
                this.masked = false;
            },
            populateNeighbours() {
                this.neighbours.north = {cell: grid.getCell(x, y-1), link: false};
                this.neighbours.south = {cell: grid.getCell(x, y+1), link: false};
                this.neighbours.west = {cell: grid.getCell(x-1, y), link: false};
                this.neighbours.east = {cell: grid.getCell(x+1, y), link: false};
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
            let maxDistance = 0, maxDistancePoint;
            while(frontier.length) {
                const next = frontier.shift(),
                    frontierDistance = next.metadata.distance;
                const linkedUndistancedNeighbours = Object.values(next.neighbours).filter(neighbour => neighbour.link).filter(neighbour => neighbour.cell.metadata.distance === undefined).map(neighbour => neighbour.cell);
                linkedUndistancedNeighbours.forEach(neighbour => {
                    neighbour.metadata.distance = frontierDistance + 1;
                });
                frontier.push(...linkedUndistancedNeighbours);
                if (linkedUndistancedNeighbours.length) {
                    if (frontierDistance >= maxDistance) {
                        maxDistancePoint = linkedUndistancedNeighbours[0];
                    }
                    maxDistance = Math.max(frontierDistance+1, maxDistance);
                }
            }
            this.metadata.maxDistance = maxDistance + 1;
            if (maxDistancePoint) {
                this.metadata.maxDistancePoint = {x: maxDistancePoint.x, y: maxDistancePoint.y};
            } else {
                delete this.metadata.maxDistancePoint;
            }
        },
        findRoute(startPosition, endPosition) {
            const start = this.getCell(startPosition.x, startPosition.y),
                end = this.getCell(endPosition.x, endPosition.y);

            this.findDistancesFrom(endPosition.x, endPosition.y);

            let current = start,
                route = [current];

            while (current !== end) {
                const currentDist = current.metadata.distance,
                    next = current.filterNeighbours((cell, link) => link).find(cell => cell.metadata.distance === currentDist - 1);
                route.push(current = next);
            }

            this.clearMetadata('maxDistance', 'maxDistancePoint', 'distance');
            return route.map(cell => {
                return {x:cell.x, y:cell.y};
            });
        },
        clearMetadata(...keys) {
            if (keys.length) {
                keys.forEach(key => {
                    delete this.metadata[key];
                    this.forEachCell(cell => delete cell.metadata[key]);
                });
            } else {
                this.forEachCell(cell => cell.metadata = {});
                this.metadata = {};
            }
        },
        getDetails() {
            const randomPoint = this.getRandomCell(cell => !cell.masked);
            this.findDistancesFrom(randomPoint.x, randomPoint.y);
            const startPointX = this.metadata.maxDistancePoint.x,
                startPointY = this.metadata.maxDistancePoint.y;
            this.findDistancesFrom(startPointX, startPointY);
            const endPointX = this.metadata.maxDistancePoint.x,
                endPointY = this.metadata.maxDistancePoint.y;

            const maxDistance = this.metadata.maxDistance,
                cellCount = this.countCells(cell => !cell.masked),
                deadEndCount = this.countCells(cell => !cell.masked && Object.values(cell.neighbours).filter(neighbour => neighbour.link).length === 1);

            this.clearMetadata('maxDistance', 'maxDistancePoint', 'distance');

            return {
                cellCount,
                maxDistance,
                longestPath: {
                    start: {x:startPointX, y:startPointY},
                    finish: {x:endPointX, y:endPointY}
                },
                deadEnds: deadEndCount
            };
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
        metadata: {},
        width,height
    };

    grid.forEachCell(cell => cell.populateNeighbours());

    return grid;
}