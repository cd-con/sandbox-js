// Автоматическая локализация

function getJSON(yourUrl){
    try {
        var Httpreq = new XMLHttpRequest(); // a new request
        Httpreq.open("GET",yourUrl,false);
        Httpreq.send(null);
        return JSON.parse(Httpreq.responseText);  
    } catch (error) {
        console.error("Language not found on static webserver. Wanna help? -> PM cd-con on GitHub.")
    }
            
}

const localeData = getJSON("https://sandbox-js.vercel.app/locale_"+navigator.language+".json");
 
let localizationElements = document.querySelectorAll('[data-locale-tag]');

if (localeData == undefined){
    throw new Error("Seems like developer made a mistake in translation file or your language is unsupported.");
} else{
    localizationElements.forEach(element => {
        const content = element.textContent;
        const nodes = element.childNodes;
        for(var i = 0; i < nodes.length; i++){
            if(nodes[i].nodeType === 3){
              nodes[i].textContent = getDataByStringPath(`localeKeys.${element.getAttribute("data-locale-tag")}`);
              break;
            }
          };
    });    
}


function getLocale(tag){
    return getDataByStringPath(`localeKeys.${tag}`)
}

function getDataByStringPath(path){
    const keys = path.split('.');
    const targetKey = keys.pop();
    let current = localeData;
    for (let i = 0; i < keys.length; ++i) {
        current = current[keys[i]];
        if (!current) {
            throw new Error('Specified key not found. ' + keys[i]);
        }
    }
    return current[targetKey]
}
      
