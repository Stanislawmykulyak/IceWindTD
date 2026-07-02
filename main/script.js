const changeText = ["Shady", "Stachu"];
const me = document.querySelector(".text");

let i = 0;
me.innerHTML = changeText[i];

setInterval(() => {
    setTimeout(() => {
        i = (i + 1) % changeText.length;
        me.innerHTML = changeText[i];
    }, 600);
    
}, 3000);
