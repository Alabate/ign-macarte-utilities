/**
 * Utility functions to tweak the MaCarte user interface
 */
class MiuGui {
    static BUTTONS = [
        {
            title: 'Dupliquer la sélection',
            icon: 'fa-clone',
            action: e => MiuActions.duplicateSelection(e),
        }
    ]

    /**
     * Add buttons to the drawToolBox bar
     */
    static addDrawToolBoxButtons() {
        const drawToolBoxInner = document
            .getElementById('drawToolBox')
            .firstElementChild

        // Add vertical separator
        // We use a <i> tag because this is wath they used
        const separatorElement = document.createElement('i');
        separatorElement.style.borderLeft = 'solid black 1px';
        separatorElement.style.paddingRight = '0';
        separatorElement.style.paddingLeft = '0';
        separatorElement.style.margin = '0 4px';
        drawToolBoxInner.appendChild(separatorElement)

        // add our buttons
        for (const button of this.BUTTONS) {
            const element = document.createElement('i');
            element.title = button.title;
            element.classList.add('tool', 'fa', button.icon);
            element.addEventListener('click', button.action)
            drawToolBoxInner.appendChild(element)
        }
    }

}