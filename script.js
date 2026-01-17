let button = document.getElementById(`Generate-btn`);
let colourBox1 = document.getElementById(`colour-box1`);
let colourBox2 = document.getElementById(`colour-box2`);
let colourBox3 = document.getElementById(`colour-box3`);
let colourBox4 = document.getElementById(`colour-box4`);
let colourBox5 = document.getElementById(`colour-box5`);
let hexContent1 = document.getElementById(`hex-code1`);
let hexContent2 = document.getElementById(`hex-code2`);
let hexContent3 = document.getElementById(`hex-code3`);
let hexContent4 = document.getElementById(`hex-code4`);
let hexContent5 = document.getElementById(`hex-code5`);

let hexCode = [0,1,2,3,4,5,6,7,8,9,"A","B","C","D","E","F"]

function generateHex(){
    let result = Math.floor(Math.random()*hexCode.length)
    return result
}
button.addEventListener(`click`, function(){
    let myColor = "#"
    for(let x = 0; x < 6; x++){
       myColor += hexCode[generateHex()]
    }
    colourBox1.style.backgroundColor = myColor
    hexContent1.textContent = myColor

    let myColor2 = "#";
    for(let i =0; i<6; i++){
        myColor2+=hexCode[generateHex()]
    }
    colourBox2.style.backgroundColor = myColor2
    hexContent2.textContent = myColor2

    let myColor3 = "#";
    for(let i =0; i<6; i++){
        myColor3+=hexCode[generateHex()]
    }
    colourBox3.style.backgroundColor = myColor3
    hexContent3.textContent = myColor3

    let myColor4 = "#";
    for(let i =0; i<6; i++){
        myColor4+=hexCode[generateHex()]
    }
    colourBox4.style.backgroundColor = myColor4
    hexContent4.textContent = myColor4

    let myColor5 = "#";
    for(let i =0; i<6; i++){
        myColor5+=hexCode[generateHex()]
    }
    colourBox5.style.backgroundColor = myColor5
    hexContent5.textContent = myColor5

})