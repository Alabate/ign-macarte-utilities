/**
 * Init function from the main web page js scope
 */
function MiuInit() {
    console.log('[MIU] MiuInit started')
    // Build the UI once page loaded
    window.addEventListener('load', () => {
        MiuGui.addDrawToolBoxButtons()
    })
}
MiuInit()