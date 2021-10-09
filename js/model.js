function buildModel() {
    const size = config.mazeSizes[config.mazeSizes.length - 1],
        algorithm = config.algorithms[config.algorithms.length - 1];

    return {
        mask: {},
        applyMask: true,
        size,
        algorithm
    };
}