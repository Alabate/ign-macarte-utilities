/**
 * Utility functions to tweak the MaCarte user interface
 */
class ImuGui {
    static BUTTONS = [
        {
            title: 'Couper (ctrl+x)',
            icon: 'fa-scissors',
            action: e => ImuActions.cut(e),
            documentEvent: 'cut',
        },
        {
            title: 'Copier (ctrl+c)',
            icon: 'fa-copy',
            action: e => ImuActions.copy(e),
            documentEvent: 'copy',
        },
        {
            title: 'Coller (ctrl+v)',
            icon: 'fa-paste',
            action: e => ImuActions.paste(e),
            documentEvent: 'paste',
        },
        {
            title: 'Coller le style',
            icon: 'fa-tint',
            action: e => ImuActions.pasteStyle(e),
        }
    ]

    /**
     * Get the drawToolBox inner div element
     */
    static #getDrawToolBoxInner() {
        return document
        .getElementById('drawToolBox')
        .firstElementChild
    }

    /**
     * Add buttons to the drawToolBox bar
     */
    static addDrawToolBoxButtons() {
        const drawToolBoxInner = this.#getDrawToolBoxInner()

        // Add vertical separator
        // We use a <i> tag because this is wath they used
        const separatorElement = document.createElement('i');
        separatorElement.style.borderLeft = 'solid black 1px';
        separatorElement.style.paddingRight = '0';
        separatorElement.style.paddingLeft = '0';
        separatorElement.style.margin = '0 4px';
        drawToolBoxInner.appendChild(separatorElement)

        for (const button of this.BUTTONS) {
            // Add button
            const element = document.createElement('i');
            element.title = button.title;
            element.classList.add('tool', 'fa', button.icon);
            element.addEventListener('click', button.action)
            drawToolBoxInner.appendChild(element)

            // Bind shortcuts
            if (button.documentEvent) {
                document.addEventListener(button.documentEvent, button.action);
            }
        }
    }


    /**
     * Enable a mode by simulating a click on the drawToolBox
     * @param {string} mode The mode that we want to enable (None, Point, Transform, etc)
     */
     static enableMode(mode) {
        const drawToolBoxInner = this.#getDrawToolBoxInner()
        for (const child of drawToolBoxInner.children) {
            if (child.dataset.mode == mode) {
                child.click()
                return
            }
        }
    }

}