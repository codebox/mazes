import {config} from './config.js';

export function buildModel() {
   const model = {
       shape: 'square',
       mask: {}
   };

    // model.masks = buildMaskManager(model);

    return model;
}