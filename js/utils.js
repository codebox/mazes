function randomInt(num) {
    "use strict";
    console.assert(num);
    return Math.floor(Math.random() * num);
}

function randomChoice(arr) {
    "use strict";
    console.assert(arr.length);
    return arr[randomInt(arr.length)];
}
