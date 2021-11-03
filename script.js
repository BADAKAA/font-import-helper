/*
interface font {
    name:string,
    formats:string[],
    prefix:string,
    styleSeperator?:string,
    fileName:string,
    fontWeight?:string,
    fontStyle?:string
}
*/

const weightNumbers = {
    ExtraLight:100,
    Light:200,
    Thin:300,
    Regular:400,
    Medium:500,
    SemiBold:600,
    Bold:700,
    ExtraBold:800,
    Black:900,
}

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
const fileLowercaseCheckbox = $('#file-lowercase');
const syncNameCheckbox = $('#sync-name');

const styleLowercaseCheckbox = $('#style-lowercase');

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
function getFontTypes() {
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
    if (abbr === "eot") return 'embedded-opentype';
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

function getFormatSuffix(format,fontName) {
    if (format==="eot") return '?#iefix';
    if (format==="svg") return '#' + (fontName.includes(' ') ? fontName.replaceAll(' ', '') : fontName);
    return '';
}
function getFontUrl(font,format,disableSuffix) {
    const { name, fileName, prefix,styleSeparator: separator, fontStyle } = font;
    return `url('${parsePrefix(prefix, font)}${fileName}${fontStyle ? separator + (styleLowercaseCheckbox.checked ? fontStyle.toLowerCase() :fontStyle) : ''}.${format}${disableSuffix ? '' : getFormatSuffix(format,name)}') format('${getFormatName(format)}')`;
}
const checkIE9 = (font, formats)=>formats.includes('eot') ? '\n    src: '+getFontUrl(font,'eot',true)+';':'';

function getImport(font) {
    const { name, formats, fontStyle, fontWeight } = font;
    let output = `@font-face {
    font-family: '${name}';
    font-style: '${fontStyle ? fontStyle.toLowerCase() : 'normal'}';
    font-weight: ${fontWeight && weightNumbers[fontWeight] ? weightNumbers[fontWeight] : "'regular'"};${checkIE9(font,formats)}
    src: local(''),`
    for (const format of formats) {
        output += `\n        ${getFontUrl(font,format)}${formats.slice().pop() === format ? ';\n}' : ','}`
    }
    return output;
}

const getWeight = (fontType) => fontType && fontType.includes("-") ? fontType.split('-')[0]:fontType;
const getStyle = (fontType) => fontType && fontType.includes("-") ? fontType.split('-')[1]:null;

function updateOutput() {
    const fonts = [];
    for(const fontType of getFontTypes()) {
        fonts.push(
            {
                name: nameInput.value,
                fileName: fileNameInput.value,
                prefix: prefixInput.value,
                formats: getFormats(),
                fontWeight:getWeight(fontType),
                fontStyle: getStyle(fontType),
                styleSeparator:separatorInput.value
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
    syncFileName = false;
    syncNameCheckbox.checked = false;
});
syncNameCheckbox.addEventListener('change',() => {
    const value = syncNameCheckbox.checked; 
    syncFileName=value;
    document.cookie = 'syncNames='+value;
});
fileLowercaseCheckbox.addEventListener('change',()=>document.cookie = 'lowercase='+fileLowercaseCheckbox.checked)
function fontNameChange() {
    if (!syncFileName) return;
    let parsedName =  nameInput.value.replace(" ", "-");
    if (fileLowercaseCheckbox.checked) parsedName = parsedName.toLowerCase();
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
    const syncPreference = parseBool(getCookie('syncNames'));
    if (getCookie('syncNames') !== undefined) {
        syncNameCheckbox.checked = syncPreference;
        syncFileName = syncPreference;
    }
    if (getCookie('lowercase') !== undefined) fileLowercaseCheckbox.checked = parseBool(getCookie('lowercase'));
}
restorePreferences();