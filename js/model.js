function buildModel() {
    const size = config.mazeSizes[config.mazeSizes.length - 3],
        algorithm = config.algorithms.find(algorithm => algorithm.defaultSelection);

    const model = {
        applyMask: true,
        size,
        algorithm
    };

    model.masks = buildMaskManager(model);

    return model;
}