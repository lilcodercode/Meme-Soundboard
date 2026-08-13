/* --- MEMERZ: PER-SOUND DOWNLOAD BUTTONS --- */
/*
Adds a download control next to every sound button (and nothing else).
Tablets and computers get the boxicons arrow-to-bottom button, which saves
the audio file straight to the device. Phones get the GitHub button instead,
which opens the file on GitHub where mobile browsers can save it properly.
*/
(function () {

/* Pulls the audio URL out of the button's onclick="playSound('...')" call. */
function urlOf(btn) {
var attr = btn.getAttribute('onclick') || '';
var start = attr.indexOf("('");
var end = attr.indexOf("')", start);
if (start === -1 || end === -1) return null;
return attr.slice(start + 2, end);
}

/* Filename to save the download as. */
function fileNameOf(url) {
var last = url.split('/').pop().split('?')[0].split('#')[0];
try {
return decodeURIComponent(last);
} catch (e) {
return last;
}
}

/* github.com/owner/repo/raw/... -> raw.githubusercontent.com/owner/repo/... */
/* The raw host sends CORS headers, so fetch() can read the file. */
function rawUrl(url) {
if (url.indexOf('https://github.com/') !== 0) return url;
var parts = url.split('/raw/');
if (parts.length < 2) return url;
var repo = parts[0].replace('https://github.com/', '');
return 'https://raw.githubusercontent.com/' + repo + '/' + parts.slice(1).join('/raw/');
}

/* The GitHub page for the file, used by the phone button. */
function blobPageUrl(url) {
var prefix = 'https://raw.githubusercontent.com/';
if (url.indexOf(prefix) === 0) {
var bits = url.slice(prefix.length).split('/');
var owner = bits.shift();
var repo = bits.shift();
return 'https://github.com/' + owner + '/' + repo + '/blob/' + bits.join('/');
}
return url.replace('/raw/', '/blob/');
}

/* Fetches the audio and saves it, falling back to GitHub if that is blocked. */
function saveFile(url, name, btn) {
btn.classList.add('dl-busy');
fetch(rawUrl(url))
.then(function (res) {
if (!res.ok) throw new Error('HTTP ' + res.status);
return res.blob();
})
.then(function (blob) {
var href = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = href;
a.download = name;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function () {
URL.revokeObjectURL(href);
}, 1000);
})
.catch(function (err) {
console.log('Download fallback: ', err);
window.open(blobPageUrl(url), '_blank', 'noopener');
})
.then(function () {
btn.classList.remove('dl-busy');
});
}

/* Builds one download control per sound button. */
function build() {
var buttons = document.querySelectorAll('.soundboard-grid .sound-btn');

Array.prototype.forEach.call(buttons, function (btn) {
if (btn.parentNode && btn.parentNode.classList.contains('sound-item')) return;

var url = urlOf(btn);
if (!url) return;

var name = btn.getAttribute('data-name') || 'sound';
var file = fileNameOf(url);

var wrap = document.createElement('div');
wrap.className = 'sound-item';
btn.parentNode.insertBefore(wrap, btn);
wrap.appendChild(btn);

/* Tablets and computers: download straight to the device. */
var dl = document.createElement('button');
dl.type = 'button';
dl.className = 'dl-btn dl-desktop';
dl.title = 'Download ' + name;
dl.setAttribute('aria-label', 'Download ' + name);
dl.innerHTML = '<i class="bx bx-arrow-to-bottom"></i>';
dl.addEventListener('click', function (e) {
e.preventDefault();
e.stopPropagation();
saveFile(url, file, dl);
});
wrap.appendChild(dl);

/* Phones: same download icon, but it opens the file on GitHub to save. */
var gh = document.createElement('a');
gh.className = 'dl-btn dl-mobile';
gh.href = blobPageUrl(url);
gh.target = '_blank';
gh.rel = 'noopener';
gh.title = 'Download ' + name + ' from GitHub';
gh.setAttribute('aria-label', 'Download ' + name + ' from GitHub');
gh.innerHTML = '<i class="bx bx-arrow-to-bottom"></i>';
wrap.appendChild(gh);
});
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', build);
} else {
build();
}

})();
