/**
 * Init function from the main web page js scope
 */
function ImuInit() {
    // Build the UI once page loaded
    const onload = (retryCount = 0) => {
        // Retry later if ImuGui is not yet defined
        if (typeof ImuGui === 'undefined') {
            if (retryCount > 50) {
                throw 'Failed to load the ImuGui global object'
            }
            setTimeout(() => onload(retryCount + 1), 100)
        }
        else {
            console.log('[IMU] ImuInit started with', retryCount, 'tries')
            ImuGui.addDrawToolBoxButtons()
            ImuGui.initStyleTweaking()
            ImuGui.initInteractionTweaking()
        }
    }
    onload()
}
console.log('[IMU] Calling ImuInit')
ImuInit()