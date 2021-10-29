import {config} from './config.js';

export function buildModel() {
   const model = {
       shape: 'square',
       mask: {},
       algorithmDelay: 0
   };

    // model.masks = buildMaskManager(model);

    return model;
}