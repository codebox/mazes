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
            }
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
            }
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
            }
        },
        'circle': {
            description: 'Circular',
            parameters: {
                layers: {
                    min: 2,
                    max: 30,
                    initial: 10
                }
            }
        }
    }
});