/*
interface font {
    name:string,
    formats:string[],
    prefix:string,
    fileName:string,
    fontWeight?:string,
    fontStyle?:string
}
*/
function copy(text) {
    const element = document.createElement("textarea");
    document.body.appendChild(element);
    element.value = text;
    element.select();
    document.execCommand("copy");
    element.remove();

}
const $ = (query) => document.querySelector(query);
const $all = (query) => document.querySelectorAll(query);

let errorTimer = 0;
const errorEl = $('#error');

const form = $('#form');
$('#updateButton').addEventListener('click', () => {
    updateOutput();
})

const nameInput = $('#name');
const fileNameInput = $('#file');
const lowercaseCheckbox = $('#lowercase');
const syncNameCheckbox = $('#sync-name');

const prefixInput = $('#prefix');
const separatorInput = $('#separator');
const formatInputs = $all('.format');
const weightInputs = $all('.weight');

const outputElement = $('#output')


const copyIcon = $('#copy-icon');
copyIcon.addEventListener('click', copyOutput);

function getFormats() {
    const formats = [];
    for (const input of formatInputs) {
        if (input.checked) formats.push(input.id);
    }
    return formats;
}
function getWeights() {
    const weights = [];
    for (const input of weightInputs) {
        if (input.checked) weights.push(input.id);
    }
    return weights;
}

function isValid(font) {
    return font.name && font.formats && font.fileName;
}

function getFormatName(abbr) {
    if (abbr === "ttf") return 'truetype';
    return abbr;
}
function error(message) {
    errorEl.textContent = message;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorEl.textContent = '', 4000);
}
function parsePrefix(prefix, font) {
    if (!prefix.includes('{')) return prefix;
    if (prefix.split('{').length > 2 || prefix.split('}').length > 2) return error('The prefix contains too many curly boys.');
    return prefix.replace('{name}', font.fileName);
}
function getImport(font) {
    const { name, formats, fileName, prefix,fontStyleSeparator } = font;
    let {fontWeight} = font;
    let fontStyle = null;

    if (fontWeight && fontWeight.includes("-")) {
        const parts= fontWeight.split('-');
        fontWeight = parts[0];
        fontStyle = parts[1];
    }

    let output = `@font-face {
    font-family: '${name}';
    font-style: '${fontStyle || 'normal'}';
    font-weight: '${fontWeight || 'regular'};
    src: local(''),`
    for (const format of formats) {
        output += `\n    url('${parsePrefix(prefix, font)}${fileName}${fontStyle ? fontStyleSeparator + fontStyle : ''}.${format}') format('${getFormatName(format)}')${formats.slice().pop() === format ? ';\n}' : ','}`
    }
    return output;
}



function updateOutput() {
    const fonts = [];
    
    for(const weight of getWeights()) {
        fonts.push(
            {
                name: nameInput.value,
                fileName: fileNameInput.value,
                prefix: prefixInput.value,
                formats: getFormats(),
                fontWeight:weight,
                fontStyleSeparator:separatorInput.value
            }
        )
    }
    
    let output = '';
    for (const font of fonts) {
        if (!isValid(fonts[0])) return error('Invalid Input. Please make sure to fill out the reqiured fields.')
        output += getImport(font)+"\n";
    }
    outputElement.textContent = output;
}


function copyOutput() {
    const copyIconClass = 'bi-clipboard-plus';
    const copiedClass = 'bi-clipboard-check';
    if (copyIcon.classList.contains(copyIconClass)) copyIcon.classList.replace(copyIconClass, copiedClass);
    copy(outputElement.textContent);
    setTimeout(() => {
        copyIcon.classList.contains(copiedClass) && copyIcon.classList.replace(copiedClass, copyIconClass);
    }, 750);
}


// SYNC FONT NAME AND FILE NAME INPUTS BEFORE INITIAL FILE NAME INPUT

let syncFileName = true;
nameInput.addEventListener('input', fontNameChange);
fileNameInput.addEventListener('input', () => {
    syncFileName = true;
    syncNameCheckbox.checked = false;
});
syncNameCheckbox.addEventListener('change',() => {
    const value = syncNameCheckbox.checked; 
    syncFileName=value;
    document.cookie = 'syncNames='+value;
});
lowercaseCheckbox.addEventListener('change',()=>document.cookie = 'lowercase='+lowercaseCheckbox.checked)
function fontNameChange() {
    if (!syncFileName) return;
    let parsedName =  nameInput.value.replace(" ", "-");
    if (lowercaseCheckbox.checked) parsedName = parsedName.toLowerCase();
    fileNameInput.value = parsedName;
}

// https://stackoverflow.com/a/15724300/16907637
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
const parseBool = (string) => string && string === 'true'; 

function restorePreferences() {
    console.log(getCookie('syncNames') );
    if (getCookie('syncNames') !== undefined) syncNameCheckbox.checked = parseBool(getCookie('syncNames'));
    if (getCookie('lowercase') !== undefined) lowercaseCheckbox.checked = parseBool(getCookie('lowercase'));
}
restorePreferences();