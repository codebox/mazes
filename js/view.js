import {buildEventTarget} from '../../mazejs/web/js/utils.js';
export const
    EVENT_MAZE_SHAPE_SELECTED = 'mazeShapeSelected',
    EVENT_SIZE_PARAMETER_CHANGED = 'mazeSizeParameterChanged';

export function buildView(model) {
    "use strict";

    const eventTarget = buildEventTarget(),
        elCanvas = document.getElementById('maze'),
        elMazeContainer = document.getElementById('mazeContainer'),
        elGoButton = document.getElementById('go'),
        elSizeParameterList = document.getElementById('sizeParameters'),
        elMazeShapeList = document.getElementById('shapeSelector'),
        elMazeAlgorithmList = document.getElementById('algorithmSelector');
        // elRefreshButton = document.getElementById('refreshMaze'),
        // elChangeMazeConfigButton = document.getElementById('changeMazeConfig'),
        // elMaskButton = document.getElementById('mask'),
        // elSaveMaskButton = document.getElementById('saveMask'),
        // elClearMaskButton = document.getElementById('clearMask'),
        // elPlayButton = document.getElementById('play'),
        // elApplyMaskToggle = document.getElementById('applyMaskToggle'),
        // elMaskNotSupported = document.getElementById('maskNotSupported'),
        // elApplyMask = document.getElementById('applyMask'),
        // elInfo = document.getElementById('info'),
        // elDetails = document.getElementById('details'),
        // elQuitButton = document.getElementById('quit'),
        // elSolutionButton = document.getElementById('solution'),
        // elDownloadButton = document.getElementById('downloadMaze'),
        //
        // imgPlayer = new Image(),
        // imgExit = new Image(),

    return {
        // Shape
        addShape(shapeName) {
            const elMazeShapeItem = document.createElement('li');
            elMazeShapeItem.innerHTML = shapeName;
            elMazeShapeItem.onclick = () => eventTarget.trigger(EVENT_MAZE_SHAPE_SELECTED, shapeName);
            elMazeShapeList.appendChild(elMazeShapeItem);
            elMazeShapeItem.dataset.value = shapeName;
        },
        setShape(shapeName) {
            [...elMazeShapeList.querySelectorAll('li')].forEach(el => {
                el.classList.toggle('selected', el.dataset.value === shapeName);
            });
        },

        // Size
        clearSizeParameters() {
            elSizeParameterList.innerHTML = '';
        },
        addSizeParameter(name, minimumValue, maximumValue) {
            const elParameterItem = document.createElement('li'),
                elParameterName = document.createElement('label'),
                elParameterValue = document.createElement('input');

            elParameterName.innerHTML = name;

            elParameterValue.setAttribute('type', 'number');
            elParameterValue.setAttribute('required', 'required');
            elParameterValue.setAttribute('min', minimumValue);
            elParameterValue.setAttribute('max', maximumValue);
            elParameterValue.oninput = () => eventTarget.trigger(EVENT_SIZE_PARAMETER_CHANGED);
            elParameterValue.dataset.value = name;

            elParameterItem.appendChild(elParameterName);
            elParameterItem.appendChild(elParameterValue);
            elSizeParameterList.appendChild(elParameterItem);
        },
        setSizeParameter(name, value) {
            const elParamInput = [...elSizeParameterList.querySelectorAll('input')].find(el => el.dataset.value === name);
            elParamInput.value = value;
        },

        on(eventName) {
            return {
                then(handler) {
                    eventTarget.on(eventName, handler);
                }
            };
        }
    };
}