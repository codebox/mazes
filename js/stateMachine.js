const STATE_START = 'Start';

function buildStateMachine() {
    "use strict";

    let state = STATE_START;

    function ifStateIsOneOf(...validStates) {
        return {
            thenChangeTo(newState) {
                if (validStates.includes(state)) {
                    console.log('State changed to', newState);
                    state = newState;
                } else {
                    console.warn(`Unexpected state transition requested: ${state} -> ${newState}`);
                }
            }
        }
    }

    return {
        get state() {
            return state;  
        }
    };

}