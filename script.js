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
let successTimer = 0;
const errorEl = $('#error');
const successEl = $('#success');

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
const typeInputs = $all('.weight');

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
    const types = [];
    for (const input of typeInputs) {
        if (input.checked) types.push(input.id);
    }
    return types;
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
    successEl.textContent = '';
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorEl.textContent = '', 4000);
}
function showMessage(message) {
    errorEl.textContent = '';
    successEl.textContent = message;
    clearTimeout(successTimer);
    successTimer = setTimeout(() => successEl.textContent = '', 3000);
}
function parsePrefix(prefix, font) {
    if (!prefix.includes('{')) return prefix;
    if (prefix.split('{').length > 2 || prefix.split('}').length > 2) return error('The prefix contains too many curly boys.');
    return prefix.replace('{name}', font.name);
}

function getFormatSuffix(format,fontName) {
    if (format==="eot") return '?#iefix';
    if (format==="svg") return '#' + (fontName.includes(' ') ? fontName.replaceAll(' ', '') : fontName);
    return '';
}
function getFontUrl(font,format,disableSuffix) {
    const { name, fileName, prefix,styleSeparator: separator, fontStyle,fontWeight } = font;
    return `url('${parsePrefix(prefix, font)}${fileName+fontWeight}${fontStyle ? separator + (styleLowercaseCheckbox.checked ? fontStyle.toLowerCase() :fontStyle) : ''}.${format}${disableSuffix ? '' : getFormatSuffix(format,name)}') format('${getFormatName(format)}')`;
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
    if (getFontTypes().length < 1) error("No weights selected.");
    for(const fontType of getFontTypes()) {
        fonts.push(
            {
                name: nameInput.value,
                fileName: fileLowercaseCheckbox.checked && fileNameInput.value ? fileNameInput.value.toLowerCase() : fileNameInput.value,
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
    !outputElement.textContent ? error('No text could be copied.') : showMessage('copied!');
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
fileLowercaseCheckbox.addEventListener('change',()=>document.cookie = 'fileLowercase='+fileLowercaseCheckbox.checked);
styleLowercaseCheckbox.addEventListener('change',()=>document.cookie = 'styleLowercase='+styleLowercaseCheckbox.checked);

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
    if (getCookie('fileLowercase') !== undefined) fileLowercaseCheckbox.checked = parseBool(getCookie('fileLowercase'));
    if (getCookie('styleLowercase') !== undefined) styleLowercaseCheckbox.checked = parseBool(getCookie('styleLowercase'));

}
restorePreferences();

function setSeparator(string) {
    if ((string || string === '') && typeof string === "string") separatorInput.value = string;
    $all('.separator-field').forEach(field=> {
        field.textContent = separatorInput.value;
    })
}
separatorInput.addEventListener('input',setSeparator);
function resetPage() {
    nameInput.value = '';
    fileNameInput.value = '';
    setSeparator('');
    prefixInput.value = './fonts/{name}/';
}
$('#reset-button').addEventListener('click',resetPage);


function spin(el) {
    console.log(el);
    if (el.classList.contains('spinning')) el.classList.remove('spinning');
    el.classList.add('spinning');
    setTimeout(()=> {
        if (el.classList.contains('spinning')) el.classList.remove('spinning');
    },300)
}

const spinners = $all('.spin');
for (const el of Array.from(spinners)) {
    el.addEventListener('click',()=>spin(el));
}