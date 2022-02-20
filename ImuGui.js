/**
 * Utility functions to tweak the MaCarte user interface
 */
class ImuGui {
    static BUTTONS = [
        {
            title: 'Couper (ctrl+x)',
            icon: 'fa-scissors',
            action: e => ImuActions.cut(e),
            bodyEvent: 'cut',
        },
        {
            title: 'Copier (ctrl+c)',
            icon: 'fa-copy',
            action: e => ImuActions.copy(e),
            bodyEvent: 'copy',
        },
        {
            title: 'Coller (ctrl+v)',
            icon: 'fa-paste',
            action: e => ImuActions.paste(e),
            bodyEvent: 'paste',
        },
        {
            title: 'Coller le style',
            icon: 'fa-tint',
            action: e => ImuActions.pasteStyle(e),
        },
        {
            title: 'Ajouter un rectangle',
            icon: 'fa-square-o',
            action: e => ImuActions.addRectangle(e),
        },
        {
            title: 'Ajouter un segment',
            iconText: '/',
            action: e => ImuActions.addSegment(e),
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
            element.style.minWidth = '22px';
            element.classList.add('tool', 'fa');
            if (button.icon) {
                element.classList.add(button.icon);
            }
            else if (button.iconText) {
                element.style.fontWeight = 'bold';
                element.innerText = button.iconText
            }
            element.addEventListener('click', button.action)
            drawToolBoxInner.appendChild(element)

            // Bind shorcuts only if event target is body because that's what
            // append when you click on the canva and press ctrl+c.
            // The target will not be body, if you try to copy and
            // paste text from somewhere else in the page
            if (button.bodyEvent) {
                document.addEventListener(button.bodyEvent, e => {
                    if (e.target == document.body) {
                        e.preventDefault()
                        return button.action(e)
                    }
                });
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

    /**
     * Generate a style function that should be set on every vector layers
     * @param {function} styleFn The existing styleFn that will still be executed
     * @returns {function} the new style function to set on vector layers
     */
    static #getTweakedStyleFunction(styleFn) {
        return (feature, resolution, clustered) => {
            const geometry = feature.getGeometry()
            // Compute text rotation angle if possible
            let textAngle = 0
            if (ImuUtils.isRectangle(geometry)) {
                textAngle = ImuUtils.getRectangleAngle(geometry)
                // We have a trigonometric angle between pi and -pi
                // We want a positive clockwise angle with 0 on the left
                textAngle = (2*Math.PI - textAngle) % (2*Math.PI)
            }
            else {
                const segmentAngle = ImuUtils.getSegmentAngle(geometry)
                if (segmentAngle) {
                    textAngle = segmentAngle
                    // We have a trigonometric angle between pi and -pi
                    // We want a positive clockwise angle with 0 on the left
                    textAngle = (2*Math.PI - textAngle) % (2*Math.PI)
                }
            }

            let styles = styleFn(feature, resolution, clustered)
            for (const style of styles) {
                if (style.getText()) {
                    // Scale text with zoom
                    // This is an arbitrary ratio that fit well my exisiting project
                    const ratio = 0.1
                    style.getText().setScale(ratio / resolution)

                    // Rotate text properly for rectangles and lines
                    style.getText().setRotation(textAngle)
                }
            }
            return styles
        }
    }

    /**
     * Configure vector layers to use our custom style function
     */
    static #configureTweakedStyleFunction() {
        const layers = ImuUtils.map.getLayers().getArray()
        for (const layer of layers) {
            // Ensure we configure the function once with _imuEventConfigured
            if (layer.getType() == 'vector' && !layer.layerVector_._imuEventConfigured) {
                let styleFunction = layer.layerVector_.getStyle()
                let newStyleFunction = this.#getTweakedStyleFunction(styleFunction)
                layer.layerVector_.setStyle(newStyleFunction)
                layer.layerVector_._imuEventConfigured = true
            }
        }
    }

    /**
     * Add event listening on layer count to allow overriding the style function
     * on each layer
     */
    static initStyleTweaking() {
        ImuUtils.map.getLayers()
        .addEventListener('change:length', () => {
            this.#configureTweakedStyleFunction()
        })
        this.#configureTweakedStyleFunction()
    }

    /**
     * Called when interaction list has changed to tweak new interactions
     */
    static #tweakInteractions() {
        // Tweak addCondition on TransformInteraction
        // to allow multi select with shift
        const interactions = ImuUtils.map.getInteractions().getArray()
        for (const interaction of interactions) {
            if (interaction instanceof ol.interaction.Transform) {
                // This is the same as setting the addCondition option
                // whild construcitng the TransformInteraction. Except that we
                // cannot modify this code easily
                interaction.addFn_ = ol.events.condition.shiftKeyOnly
            }
        }
    }

    /**
     * Add event listening on interaction collection to allow tweaking on them
     */
    static initInteractionTweaking() {
        ImuUtils.map.getInteractions()
        .addEventListener('change:length', () => {
            this.#tweakInteractions()
        })
        this.#tweakInteractions()
    }
}