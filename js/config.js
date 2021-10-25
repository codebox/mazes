import {ALGORITHM_RECURSIVE_BACKTRACK} from '../../mazejs/web/js/constants.js';

export const config = Object.freeze({
    shapes: {
        'square': {
            description: 'Square Grid',
            parameters: {
                width: {
                    min: 2,
                    max: 50,
                    initial: 10
                },
                height: {
                    min: 2,
                    max: 50,
                    initial: 10
                }
            },
            defaultAlgorithm: ALGORITHM_RECURSIVE_BACKTRACK
        },
        'triangle': {
            description: 'Triangle Grid',
            parameters: {
                width: {
                    min: 2,
                    max: 50,
                    initial: 10
                },
                height: {
                    min: 2,
                    max: 50,
                    initial: 10
                }
            },
            defaultAlgorithm: ALGORITHM_RECURSIVE_BACKTRACK
        },
        'hexagon': {
            description: 'Hexagon Grid',
            parameters: {
                width: {
                    min: 2,
                    max: 50,
                    initial: 10
                },
                height: {
                    min: 2,
                    max: 50,
                    initial: 10
                }
            },
            defaultAlgorithm: ALGORITHM_RECURSIVE_BACKTRACK
        },
        'circle': {
            description: 'Circular',
            parameters: {
                layers: {
                    min: 2,
                    max: 30,
                    initial: 10
                }
            },
            defaultAlgorithm: ALGORITHM_RECURSIVE_BACKTRACK
        }
    }
});