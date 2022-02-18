class MiuUtils {

    /**
     * Get the macarte object
     * This is not a standard OpenLayer object
     * @returns {Object} The macarte object
     */
    static get macarte() {
        return window.macarte
    }

    /**
     * Get the Carte object
     * This is not a standard OpenLayer object
     * @returns {Object} The carte object
     */
    static get carte() {
        return window.macarte.getCarte()
    }

    /**
     * Get the OpenLayer Map object
     * @see https://openlayers.org/en/latest/apidoc/module-ol_Map-Map.html
     * @returns {ol.Map} The map
     */
    static get map() {
        return window.macarte.getCarte().getMap()
    }

    /**
     * Get selected features (Polygon, points, etc.)
     * @see https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html
     * @returns {ol.Feature[]} List of OpenLayer features
     */
    static getSelectedFeatures() {
        // Try to use the hand selection tool first
        let interaction = this.carte.getInteractionByName("SelectInteraction")
        if (interaction) {
            return interaction.getFeatures().getArray()
        }

        // If it didn't work try to get what's selected by the transform mode
        interaction = this.carte.getInteractionByName("TransformInteraction")
        if (interaction && Array.isArray(interaction.selection_)) {
            return interaction.selection_
        }

        // Else act like nothing is selected
        return []
    }

    /**
     * Unselect every selected items (compatible with transform select)
     */
    static unselect() {
        // Unselect for the hand selection tool
        let interaction = this.carte.getInteractionByName("SelectInteraction")
        if (interaction) {
            return interaction.getFeatures().clear()
        }

        // Unselect for the transform mode
        interaction = this.carte.getInteractionByName("TransformInteraction")
        if (interaction) {
            interaction.select();
            interaction.drawSketch_();
        }

        // Else act like nothing is selected
        return []
    }

    /**
     * Selected the given features
     * Compatible with transform select, but select only the first feature
     */
    static select(features, useTransform = false) {
        if (useTransform) {
            // Ensure we are in the selection mode
            MiuGui.enableMode('Transform')
            const interaction = this.carte.getInteractionByName("TransformInteraction")

            // We select the first one because this mode doens't support more
            interaction.select(features[0])
        }
        else {
            // Ensure we are in the selection mode
            MiuGui.enableMode('None')

            this.unselect()
            const interaction = this.carte.getInteractionByName("SelectInteraction")
            for (const feature of features) {
                // Didn't find a clean way to do it :(
                interaction.featureOverlay_.getSource().getFeaturesCollection().push(feature)
            }
        }
    }

    /**
     * Get the source of the layer that is currently selected for drawing
     * You can then modify this source to add or remove elemnts from this layer
     * @see https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html
     * @returns {ol.source.Vector} The currently selected layer source
     */
    static getCurrentLayerSource() {
        return this.carte
            .getCurrentLayerDessin()
            .getSource()
    }

    /**
     * Show a messagebox modal that may expires and may contain a button
     *
     * Binding of the WDialog:msgInfo() method from
     *      webpack:///./assets/bundles/app/js/dialog/wdialog.ts
     * @param {string} text Text show in the message box
     * @param {number} duration Duration in ms. Default to 3000ms
     * @param {boolean|Object} button May be false or contain the dict that
     * define 2 attributes: 'name' and 'action'. 'name' is the button text.
     * 'action' is the function executed on click. Default to false.
     */
    static timedMsgBox(text, duration = null, button = null) {
        return this.macarte.wdialog.msgInfo(text, duration, button)
    }

    /**
     * Get the coordinates of the center of the view
     * @see https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#getCenter
     * @returns {Array} x as first element, y as second
     */
    static getViewCenter() {
        return this.map.getView().getCenter()
    }

    /**
     * Find layers where the given feature is
     * A feature shouldn't be in multiple layer but can it's still possible
     * @param {ol.Feature} feature The feature to look for
     * @returns {ol.layer.Vector[]} List of vector layers that contains the feature
     */
    static findLayersFromFeature(feature) {
        const out = [];
        const layers = this.map.getLayers().getArray()
        for (const layer of layers) {
            if (layer.getType() == 'vector') {
                const layerFeatures = layer.getSource().getFeatures()
                if (layerFeatures.indexOf(feature) != -1) {
                    out.push(layer)
                }
            }
        }
        return out
    }
}