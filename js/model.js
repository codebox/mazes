import {config} from './config.js';

export function buildModel() {
   const model = {
       shape: 'square',
       size: [10,5],
       algorithm: 'sidewwinder'
   };

    // model.masks = buildMaskManager(model);

    return model;
}