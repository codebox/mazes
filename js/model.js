function buildModel() {
    const size = config.mazeSizes[config.mazeSizes.length - 3],
        algorithm = config.algorithms[config.algorithms.length - 1];

    const model = {
        applyMask: true,
        size,
        algorithm
    };

    model.masks = buildMaskManager(model);

    return model;
}