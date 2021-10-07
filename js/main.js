window.onload = () => {
    "use strict";
    const model = buildModel(),
        view = buildView();

    config.mazeSizes.forEach(size => {
        view.addMazeSize(size, `${size}x${size}`);
    });

    config.algorithms.forEach(algorithm => {
        view.addMazeAlgorithm(algorithm.function, algorithm.name) ;
    });
    view.setMazeAlgorithm(model.algorithm);

    view.on(EVENT_GO_BUTTON_CLICKED).then(() => {
        const grid = buildGrid(model.size, model.size);
        view.renderMaze(model.maze = algorithms[model.algorithm](grid));
    });

    function onMazeSizeChanged(newSize) {
        view.setMazeSize(model.size = newSize);
        model.maze = buildGrid(model.size, model.size);
        view.renderMaze(model.maze);
    }
    view.on(EVENT_MAZE_SIZE_SELECTED).then(event => onMazeSizeChanged(event.data));
    onMazeSizeChanged(model.size);

    view.on(EVENT_MAZE_ALGORITHM_SELECTED).then(event => {
        view.setMazeAlgorithm(model.algorithm = event.data);
    });

    view.on(EVENT_RESIZE).then(() => {
        view.renderMaze(model.maze);
    });
};