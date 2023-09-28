
function initAnimations(){
    //Set up the loading sign
    let containers = document.getElementsByClassName('loadingSign');
    for (let container of containers){
        let loading = document.createElement('div');
        let loading2 = document.createElement('div');
    
        loading.classList.add('loading');
        loading2.classList.add('loading2');    
        loading.classList.add('animated');
        loading2.classList.add('animated');
        container.classList.add('animated')
        container.classList.add('animationContainer')
    
        container.appendChild(loading);
        container.appendChild(loading2);
    }
    console.log("Loading animations...")
    let animated = document.getElementsByClassName('animated');
    if (animated.length > 0){
        for (let i=0;i<animated.length;i++){
            let elem = animated[i]               
            elem.addEventListener('animationend',function(event){                
                if (!event.animationName.endsWith('-then')){
                    resetAnimation(event.target);
                }
            })
        }
    }
}
function resetAnimation(el) {
    console.log('resetting..')
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null; 
}