let max_canvas_width = 500;
var finalgif,libgif_gif;
let spiral_speed = 50;
let opacity = 0.6;
let defaultColor;
let defaultSize=36;

function onLoad(){
    initAnimations();
    finalgif = new GIF({
        workers: 6,
        quality: 1
    });
    finalgif.on('finished', function(blob) {
        console.log("Done!")
        let urlData = URL.createObjectURL(blob);
        document.querySelector('#download .loadingSign').classList.add('hidden')
        document.querySelector('#preview').src=urlData;
    });    
    document.getElementById('opacitySlider').addEventListener('input', changeOpacity)
    document.getElementById('speedSlider').addEventListener('input', changeSpeed)    
    for (let elem of document.querySelectorAll('#textInputs input')){
        elem.addEventListener('input', onInputChange)
    }
    document.getElementById('addInput').addEventListener('click', ()=>{
        addInput();
    })
    document.getElementById('working').addEventListener('mousedown', canvasClicked)

    for (let elem of document.querySelectorAll('.fileContainer')){
        elem.addEventListener('click', (event) =>{
            let elem = event.target;
            let fileElement = elem.querySelector('input');
            if (fileElement != null){
                fileElement.click();
            }
        });
    }
    populatePresets();
}
function canvasClicked(event)
{
    event.preventDefault()
    let canvas = document.getElementById('working')
    let ctx = canvas.getContext('2d');

    /* Get click location*/
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    let textInputs = getTextToAdd().map((obj)=>obj.elem);
    for (let elem of textInputs){
        if (elemRowHasFocus(elem)){
            elem.setAttribute('x',x);
            elem.setAttribute('y',y);
        }
    }
}
function handleFileUpload(fileInput) {    
    const reader = new FileReader();
    reader.onload = function(event){
        let imgdata = event.target.result;      
        let overlayImg = document.getElementById('placeholder');
        let bgImg = document.getElementById('background');
        let checkReady = function(){
            if (overlayImg.src && bgImg.src){
                // Unhide the second step and scroll into view.
                let target = document.querySelector('section.secondStep');
                target.classList.remove('hidden');
                //Scroll into view
                target.scrollIntoView();
                initGif();
            }
        }
        if (fileInput.id == 'fileOverlay'){
            overlayImg.src = imgdata;
            overlayImg.onload = checkReady;
            overlayImg.classList.remove('hidden');            
        }
        else{
            bgImg.src = imgdata;
            bgImg.onload = checkReady;
            bgImg.classList.remove('hidden');
        }   
    }

    const file = fileInput.files[0];
    reader.readAsDataURL(file);
}
function initGif(){
    let img = document.getElementById('placeholder');
    libgif_gif = SuperGif({gif:img,auto_play:false,max_width:max_canvas_width});        
    libgif_gif.load(() => {
        document.getElementById('working').classList.remove('hidden');
        let loading = document.querySelector('.workingContainer .loadingSign')
        loading.classList.add('hidden');
        let downloadButton = document.querySelector('.workingContainer button')
        downloadButton.classList.remove('hidden');
        let controls = document.querySelector('.secondStep .controls')
        controls.classList.add('expand');
        defaultColor = [0,0,0]
        textInfo = determineText(libgif_gif.get_length(),[]);
        resizeDest(libgif_gif)
        manualAnimate(0,0);
    });   
}
function manualAnimate(i,current_iteration){    
    //Check if we need to add extra fake frames due to the text requiring more time.       
    let iterations_needed = Math.floor(textInfo.last / libgif_gif.get_length())        
    setFrame(libgif_gif,i,current_iteration*libgif_gif.get_length());
    i+=1;    
    if (i >= libgif_gif.get_length()){                
        i=0        
        if (current_iteration < iterations_needed){
            current_iteration+=1            
        }
        else{
            current_iteration = 0;
        }
    }    
    setTimeout(()=>{
        manualAnimate(i,current_iteration)
    },spiral_speed);

}
function resizeDest(img){    
    let source = img.get_canvas();
    document.getElementById('working').width = source.width
    document.getElementById('working').height = source.height
}
var textInfo;
function setFrame(gif,i,fake_frames){
    gif.move_to(i);    

    /*Get current image on canvas */
    let canvas = document.querySelector('.jsgif canvas')
    let ctx = canvas.getContext('2d');

    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    textInfo = determineText(gif.get_length(),getTextToAdd());

    writeToCanvas(imgData, opacity, i, fake_frames)
}
function getTextToAdd(){
    let textInputs = document.querySelectorAll('#textInputs input[type="text"]')
    let colorInputs = document.querySelectorAll('#textInputs input[type="color"]')
    let sizeInputs = document.querySelectorAll('#textInputs input[type="number"]')
    
    let textInfo = [];
    
    for (let i=0;i<textInputs.length;i++){
        let info = {
            text:textInputs[i].value,
            color:colorInputs[i].value,
            x:textInputs[i].getAttribute('x'),
            y:textInputs[i].getAttribute('y'),
            elem:textInputs[i],
            size:sizeInputs[i].value
        }
        textInfo.push(info)
    }

    return textInfo
}
function onInputChange(){    
    if (libgif_gif){
        determineText(libgif_gif.get_length(),getTextToAdd())
    }
}
function addInput(text="",size=36,x=-1,y=-1){
    console.log(text,size,x,y)
    let newRow = constructInputRow(text,size,x,y);    
    let button = document.getElementById('addInput')
    document.querySelector('#textInputs .textInputContainer').insertBefore(newRow,button)
    newRow.querySelector('input').focus();
}
function constructTrashSVG(){
    let svg = document.getElementById('refTrash');
    let newSvg = svg.cloneNode(true);
    newSvg.id = "";
    return newSvg
}
function constructInputRow(text="",size=36,x=-1,y=-1){
    let container = document.createElement('div');
    let textInput = document.createElement('input')
    let colorInput = document.createElement('input')
    let sizeInput = document.createElement('input')
    let deleteLine = document.createElement('a')
    let trash = constructTrashSVG();

    textInput.addEventListener('input', onInputChange)
    colorInput.addEventListener('input', onInputChange)
    sizeInput.addEventListener('change', onInputChange)
    deleteLine.addEventListener('click', removeRow)

    textInput.type = 'text'
    if (x == -1){
        document.getElementById('working').width/2        
    }
    if (y == -1){
        document.getElementById('working').height/2
    }
    textInput.setAttribute('x',x)
    textInput.setAttribute('y',y)
    textInput.value = text;
    colorInput.type = 'color'

    sizeInput.type = 'number'
    sizeInput.setAttribute('min',18)
    sizeInput.setAttribute('max',200)
    sizeInput.setAttribute('value',size)

    colorInput.value = colorRGBToHex(defaultColor);
    trash.classList.add('trash')

    deleteLine.appendChild(trash)

    container.appendChild(textInput)
    container.appendChild(colorInput)
    container.appendChild(sizeInput)
    container.appendChild(deleteLine)
    container.classList.add('inputRow')
    
    return container
}
function removeRow(event) {
    const elem = event.target.closest('.inputRow');
    if (elem) {
      elem.remove();
    }
  }
  
function determineText(gif_length, textToAdd){
    let canvas = document.getElementById('working')    
    textToAdd = textToAdd.filter(elem => elem.text.length > 0);

    let textDisplayTime = 0 ;
    let iteration_goal = 1;
    let sanity = 0;
    while (textDisplayTime < 6)
    {
        textDisplayTime = Math.floor(gif_length*iteration_goal / textToAdd.length);        
        if (textDisplayTime < 6)
        {
            iteration_goal++;
        }
        sanity++;
        if (sanity>100){
            break;
        }
    }        
    let delayBetweenTexts = 0;

    let counter = 0;

    let framesWithText = [];
    /* Determine which frames to display each piece of text on */    
    for (let i=0;i<textToAdd.length;i++){
        framesWithText.push({text:textToAdd[i].text, 
            start:counter,
            end:counter+textDisplayTime,
            x:textToAdd[i].x,
            y:textToAdd[i].y
        });
        counter = counter+textDisplayTime+delayBetweenTexts;

    }
    return {framesWithText:framesWithText,last:counter}
}
function elemRowHasFocus(elem){
    return elem.parentNode.querySelector(':focus') != null;
}
function writeToCanvas(imgData, opacity, framecount, fake_frames){    
    invopacity = 1-opacity

    let canvas = document.getElementById('working');
    let ctx = canvas.getContext('2d');

    let textToAdd = getTextToAdd();
    let background = document.getElementById('background');
    // Draw the background to get the image data
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    let bgData = ctx.getImageData(0,0, canvas.width, canvas.height)

    // create a new ImageData object with the same dimensions
    let newImgData = new ImageData(imgData.width, imgData.height)

    // loop through the pixel data
    for (let i = 0; i < imgData.data.length; i += 4) {

        let r = Math.floor(imgData.data[i] * opacity + bgData.data[i] * invopacity)
        let g = Math.floor(imgData.data[i + 1] * opacity + bgData.data[i + 1] * invopacity)
        let b = Math.floor(imgData.data[i + 2] * opacity + bgData.data[i + 2] * invopacity)        

        // set the alpha value for each pixel in the new image data
        newImgData.data[i] = r
        newImgData.data[i + 1] = g
        newImgData.data[i + 2] = b
        newImgData.data[i + 3] = imgData.data[i + 3];
    }

    // put the modified image data onto the canvas
    ctx.putImageData(newImgData, 0, 0);
    
    //If an input element is focused display an indicator on the element
    for (let i=0;i<textToAdd.length;i++){        

        if (elemRowHasFocus(textToAdd[i].elem)){
            let x = textToAdd[i].x
            let y = textToAdd[i].y
            ctx.font = `${textToAdd[i].size}px Luckiest Guy`;
            let textDims = ctx.measureText(textToAdd[i].text);
            let textWidth = textDims.width;
            let textHeight = textDims.actualBoundingBoxAscent + textDims.actualBoundingBoxDescent;
            ctx.strokeStyle = textToAdd[i].color
            ctx.setLineDash([10,5])
            ctx.lineWidth = 2            
            ctx.strokeRect(x-textDims.width/2,y-textHeight/2,textWidth,textHeight)            
        }
    }

    let framesWithText = textInfo.framesWithText;
    //Write text over the image on certain frames
    for (let i=0;i<framesWithText.length;i++){     
        let frameCheck = framecount+fake_frames        
        
        if (frameCheck >= framesWithText[i].start && frameCheck <= framesWithText[i].end){                                    
            let fadeMiddle = (framesWithText[i].start + framesWithText[i].end) / 2;
            let distanceFromMiddle = Math.abs(frameCheck - fadeMiddle);
            let a = 1- (distanceFromMiddle / (framesWithText[i].end - framesWithText[i].start));
            
            ctx.font = `${textToAdd[i].size}px Luckiest Guy`;
            let textDims = ctx.measureText(framesWithText[i].text);
            let textWidth = textDims.width;
            let textHeight = textDims.actualBoundingBoxAscent + textDims.actualBoundingBoxDescent;            
            let color = colorHexToRGB(textToAdd[i].color)            
            ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${a})`            
            let textX = parseInt(framesWithText[i].x) - textWidth/2;
            let textY = parseInt(framesWithText[i].y) + textHeight/2;
            
            ctx.fillText(framesWithText[i].text,textX,textY) 
        }
    }
   
}
function colorHexToRGB(hex)
{
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}
function colorRGBToHex(color){
    let r = Math.floor(color[0])
    let b = Math.floor(color[1])
    let g = Math.floor(color[2])
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}
function saveGif()
{
    //Set width and height to the width and height of the first frame of the spiral
    let canvas = document.getElementById('working');
    finalgif.setOptions({width:canvas.width,height:canvas.height});
    
    //Check if we need to add extra fake frames due to the text requiring more time.    
    let iterations_needed = Math.floor(textInfo.last / libgif_gif.get_length())     
    iterations_needed = iterations_needed > 0 ? iterations_needed:1;
    for (let current_iteration=0;current_iteration<=iterations_needed;current_iteration++)
    {
        for (let i=0;i<libgif_gif.get_length();i++)
        {        
            setFrame(libgif_gif,i,current_iteration*libgif_gif.get_length());
            addCanvasToGif();
        }
    }    
    console.log("Starting render.")
    let target = document.getElementById('download')
    target.classList.remove('hidden');
    //Scroll into view
    target.scrollIntoView();
    finalgif.render();
}
function addCanvasToGif()
{
    let canvas = document.getElementById('working');
    let ctx = canvas.getContext('2d');
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);    
    finalgif.addFrame(imageData,{delay:spiral_speed});
}
/* Controls */
function changeOpacity(){
    let opacitySlider = document.getElementById('opacitySlider');    
    opacity = opacitySlider.value/100;    
}
function changeSpeed(){
    slider_elem = document.getElementById('speedSlider');
    spiral_speed = slider_elem.max - slider_elem.value + 20; //Minimum delay for gifs is about 20, otherwise it silently defaults to a higher value.    
}
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
function setInputs(key){
    let words = [...presets[key]['normal']]
    //Shuffle arrays.
    words = shuffle(words);
    let strong = [...presets[key]['strong']]
    strong = shuffle(strong);    
    let inputRows = document.getElementsByClassName('inputRow');
    //Delete all inputRows.
    for (let i=inputRows.length-1;i>=0;i--){ //Yes, backwards, because dom ordering messes things up if we go forwards.
        inputRows[i].remove();
    }
    //Get locations
    let locations = [...presets[key]['locations']];
    for (let key in locations){
        let loc_arr = percentageToPixels(locations[key]);
        let x = loc_arr[0]
        let y = loc_arr[1]
        let size = locations[key][2]
        let word;
        if (size > 90){
            word = strong[0];
            strong.shift();
        }
        else{
            word = words[0];
            words.shift();
        }                
        //Populate the input rows
        addInput(word, size, x, y);
   }
    
}
function percentageToPixels(arr){
    arr = [...arr]
    let canvas = document.getElementById('working');    
    arr[0] = arr[0] * canvas.width;
    arr[1] = arr[1] * canvas.height;
    return arr;
}
function populatePresets(){
    for (let key in presets){
        let preset = presets[key];
        
        let button = document.createElement('button');        
        button.textContent = key;
        button.addEventListener('click',function(event){
            //Set all the other buttons to inactive
            let parent = event.target.parentNode;
            for (let i=0;i<parent.querySelectorAll('button').length;i++){
                parent.children[i].classList.remove('active');
            }
            event.target.classList.add('active');
            setInputs(event.target.textContent)
        });
        if (key == 'Blank'){
            button.classList.add('active');
        }
        document.getElementById('presets').appendChild(button)
    }
}