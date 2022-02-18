const INJECTED_SCRIPTS = [
    'ImuGui.js',
    'ImuActions.js',
    'ImuUtils.js',
    'ImuInit.js',
]
// Inject all js files into the main web page scope because we will need
// to access variables from the main js scope like the map object of OpenLayer
// However in those files we will prefix everything with Imu to reduce the
// risk of collision with the web page js
for (const script of INJECTED_SCRIPTS) {
    const scriptTag = document.createElement('script')
    scriptTag.src = chrome.runtime.getURL(script)
    document.body.appendChild(scriptTag)
    scriptTag.onload = () => {
        scriptTag.parentNode.removeChild(scriptTag)
    }
}