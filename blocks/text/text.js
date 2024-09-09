export default function decorate(block) {
    //check if the section has class button and add the button class to a tag check if it has button-secondary class and add secondary class to a tag, check if section has button-branded and check the a href to map the brand (fro example apple.com add icon <span class="icon icon-apple"></span> after the text in a)
    //section is the first div with classes on the the first div
    
    const isButton = block.classList.contains('button') || block.classList.contains('button-outline') || block.classList.contains('button-secondary');
    if(isButton){
        const a = block.querySelectorAll('a');
        if(a){
              
            a.forEach(el => {
                //add button-container to the parent p element
                el.parentNode.classList.add('button-container');
                el.classList.add('button');
                if(block.classList.contains('button-secondary')){
                    el.classList.add('button-secondary');
                }
                if(block.classList.contains('button-outline')){  
                    el.classList.add('outline');
                }
                
                const href = el.getAttribute('href');
                if(href.includes('apple.com')){
                    el.innerHTML += '<span class="icon icon-apple"></span>';
                }
                if(href.includes('spotify.com')){
                    el.innerHTML += '<span class="icon icon-spotify"></span>';
                }
                

            });

           
        }
    }
}