/**
 * Init function from the main web page js scope
 */
function ImuInit() {
    console.log('[IMU] ImuInit started')
    // Build the UI once page loaded
    window.addEventListener('load', () => {
        ImuGui.addDrawToolBoxButtons()
        ImuGui.initStyleTweaking()
    })
}
ImuInit()