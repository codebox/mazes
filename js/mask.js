function buildMaskManager(model) {
    "use strict";
    function buildMask(size) {
        const cells = [...Array(size)].map((row, y) => [...Array(size)].map((_, x) => false));
        return {
            forEach(fn) {
                for (let x=0; x<size; x++) {
                    for (let y=0; y<size; y++) {
                        fn(x, y, this.get(x,y));
                    }
                }
            },
            setFromModel() {
                model.maze.forEachCell(cell => {
                    cells[cell.x][cell.y] = cell.masked;
                });
            },
            get(x,y) {
                return cells[x][y];
            },
            isEmpty() {
                let maskCount = 0;
                this.forEach((x,y,isMasked) => {
                    if (isMasked) {
                        maskCount++;
                    }
                });
                return maskCount === 0;
            },
            isConnected() {
                const grid = buildGrid(size, size);
                this.forEach((x,y,masked) => {
                    if (masked) {
                        grid.getCell(x,y).mask();
                    }
                });
                const isNotMasked = cell => !cell.masked,
                    startCell = grid.getRandomCell(isNotMasked),
                    unmaskedCellCount = grid.filterCells(isNotMasked).length;

                if (!startCell) {
                    return false;
                }

                function countUnmasked(cell) {
                    cell.metadata.visited = true;
                    let count = 1;
                    cell.filterNeighbours(isNotMasked).forEach(neighbourCell => {
                        if (!neighbourCell.metadata.visited) {
                            count += countUnmasked(neighbourCell);
                        }
                    });
                    return count;
                }

                return unmaskedCellCount == countUnmasked(startCell);
            }
        };
    }

    const masks = {};
    return {
        getCurrent() {
            const currentSize = model.size;
            if (! masks[currentSize]) {
                masks[currentSize] = buildMask(currentSize);
            }
            return masks[currentSize];
        }
    };
}