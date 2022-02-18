const INJECTED_SCRIPTS = [
    'MiuGui.js',
    'MiuActions.js',
    'MiuUtils.js',
    'MiuInit.js',
]
// Inject all js files into the main web page scope because we will need
// to access variables from the main js scope like the map object of OpenLayer
// However in those files we will prefix everything with Miu to reduce the
// risk of collision with the web page js
for (const script of INJECTED_SCRIPTS) {
    const scriptTag = document.createElement('script')
    scriptTag.src = chrome.runtime.getURL(script)
    document.body.appendChild(scriptTag)
    scriptTag.onload = () => {
        scriptTag.parentNode.removeChild(scriptTag)
    }
}