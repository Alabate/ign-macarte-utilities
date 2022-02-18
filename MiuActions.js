class MiuActions {
    /** List of features stored after a copy action */
    static clipboard = []

    /**
     * Clone selected features and store them until paste
     */
    static copy() {
        const selectedFeatures = MiuUtils.getSelectedFeatures()
        this.clipboard = []
        for (const feature of selectedFeatures) {
            const newFeature = feature.clone()
            const ignStyle = Object.assign({}, feature.getIgnStyle())
            newFeature.setIgnStyle(ignStyle)
            this.clipboard.push(newFeature)
        }
    }

    /**
     * Copy and delete what's selected
     */
    static cut() {
        this.copy()

        // Delete selected features from all layers
        const selectedFeatures = MiuUtils.getSelectedFeatures()
        for (const feature of selectedFeatures) {
            const layers = MiuUtils.findLayersFromFeature(feature)
            for (const layer of layers) {
                layer.getSource().removeFeature(feature);
                feature.changed()
            }
        }
        // Clear selection to definitely delete them
        MiuUtils.unselect()
    }

    /**
     * Paste what have been copied on the center of the screen
     */
    static paste() {
        if (this.clipboard.length == 0) {
            return
        }

        // Compute the transform applied to all features
        // Center the first point of the first feature in the middle of the view
        // And translate all the copied feature like the first to conserve relative positions
        const center = MiuUtils.getViewCenter()
        const firstPoint = this.clipboard[0].getGeometry().getFirstCoordinate()
        const tx = center[0] - firstPoint[0]
        const ty = center[1] - firstPoint[1]

        // Copy
        const newFeatures = [];
        const currentLayerSource = MiuUtils.getCurrentLayerSource()
        for (const feature of this.clipboard) {
            const newFeature = feature.clone()
            const ignStyle = Object.assign({}, feature.getIgnStyle())
            newFeature.setIgnStyle(ignStyle)
            newFeature.getGeometry().translate(tx, ty)
            currentLayerSource.addFeature(newFeature)
            newFeatures.push(newFeature)
        }

        // Select in transform mode the first feature to make the
        // "paste and move" action easier
        MiuUtils.select(newFeatures, true)
    }

    /**
     * Paste style of the first element copied onto selected features
     * Don't copy text even if it's in the style object
     */
    static pasteStyle() {
        // Get style of the first clipboard element and remove label
        if (this.clipboard.length == 0) {
            return
        }
        const copiedStyle = Object.assign({}, this.clipboard[0].getIgnStyle())
        if (copiedStyle.labelAttribute) {
            delete copiedStyle.labelAttribute
        }

        // Paste style on all selected features while keeping the label
        const selectedFeatures = MiuUtils.getSelectedFeatures()
        for (const feature of selectedFeatures) {
            const newStyle = Object.assign({}, copiedStyle)
            if (feature.getIgnStyle().labelAttribute) {
                newStyle.labelAttribute = feature.getIgnStyle().labelAttribute
            }
            feature.setIgnStyle(newStyle)
            feature.changed()
        }
    }
}
