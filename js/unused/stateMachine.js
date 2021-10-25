const STATE_INIT = 'Init',
    STATE_MASKING = 'Masking',
    STATE_DISPLAYING = 'Displaying',
    STATE_PLAYING = 'Playing';

function buildStateMachine() {
    "use strict";

    let state = STATE_INIT;

    function ifStateIsOneOf(...validStates) {
        return {
            thenChangeTo(newState) {
                if (validStates.includes(state)) {
                    console.debug('State changed to', newState);
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
        },
        init() {
            ifStateIsOneOf(STATE_DISPLAYING, STATE_MASKING)
                .thenChangeTo(STATE_INIT);
        },
        masking() {
            ifStateIsOneOf(STATE_INIT)
                .thenChangeTo(STATE_MASKING);
        },
        displaying() {
            ifStateIsOneOf(STATE_INIT, STATE_MASKING, STATE_PLAYING)
                .thenChangeTo(STATE_DISPLAYING);
        },
        playing() {
            ifStateIsOneOf(STATE_DISPLAYING)
                .thenChangeTo(STATE_PLAYING);
        }
    };

}