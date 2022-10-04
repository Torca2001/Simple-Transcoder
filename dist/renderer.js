let dragOverlay = document.getElementById('dragAndDropOverlay');

dragOverlay.addEventListener('drop', function dragOverHandler(ev) {
    let files = ev.dataTransfer.files;


    console.log(ev);
    console.log(files);


    ev.preventDefault();
});

dragOverlay.addEventListener('dragover', function dragHandler(ev) {
    ev.preventDefault();
});

document.querySelector('html').addEventListener('drop', function dragOverHandler(ev) {
    let files = ev.dataTransfer.files;
    if (files.length > 0){
        let blobUrl = URL.createObjectURL(files[0]);
        let mainPlayer = document.getElementById('mainPlayer');
        let currentSrc = mainPlayer.getAttribute('src');
        if (typeof currentSrc == "string" && currentSrc.length > 0) {
            console.log(currentSrc);
            URL.revokeObjectURL(currentSrc);
        }

        document.title = "Simple Transcoder - " + files[0].name; 

        mainPlayer.setAttribute('src', blobUrl)
        
    
        console.log(ev);
        console.log(files);
    }

    ev.preventDefault();
});

document.querySelector('html').addEventListener('dragover', (ev) => {
    //dragOverlay.style.display = "block";
    ev.preventDefault();
});

