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

function shuffleArray(array) {
    let i = array.length, r;

    while (i) {
        const r = randomInt(i--);
        [array[i], array[r]] = [array[r], array[i]];
    }

    return array;
}

function padNum(num) {
    return num < 10 ? '0' + num : num;
}
function formatTime(millis) {
    const hours = Math.floor(millis / (1000 * 60 * 60)),
        minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60)),
        seconds = Math.floor((millis % (1000 * 60)) / 1000);

    return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
}
