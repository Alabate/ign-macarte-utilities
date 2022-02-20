class ImuActions {
    /** List of features stored after a copy action */
    static clipboard = []

    /**
     * Clone selected features and store them until paste
     */
    static copy() {
        const selectedFeatures = ImuUtils.getSelectedFeatures()
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
        const selectedFeatures = ImuUtils.getSelectedFeatures()
        for (const feature of selectedFeatures) {
            const layers = ImuUtils.findLayersFromFeature(feature)
            for (const layer of layers) {
                layer.getSource().removeFeature(feature);
                feature.changed()
            }
        }
        // Clear selection to definitely delete them
        ImuUtils.unselect()
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
        const center = ImuUtils.getViewCenter()
        const firstPoint = this.clipboard[0].getGeometry().getFirstCoordinate()
        const tx = center[0] - firstPoint[0]
        const ty = center[1] - firstPoint[1]

        // Copy
        const newFeatures = [];
        const currentLayerSource = ImuUtils.getCurrentLayerSource()
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
        ImuUtils.select(newFeatures, true)
    }

    /**
     * Paste style of the first element copied onto selected features
     * Don't copy label text and size even if it's in the style object
     */
    static pasteStyle() {
        // Get style of the first clipboard element and remove label text and size
        if (this.clipboard.length == 0) {
            return
        }
        const copiedStyle = Object.assign({}, this.clipboard[0].getIgnStyle())
        if (copiedStyle.labelAttribute) {
            delete copiedStyle.labelAttribute
        }
        if (copiedStyle.textSize) {
            delete copiedStyle.textSize
        }

        // Paste style on all selected features while keeping the label
        const selectedFeatures = ImuUtils.getSelectedFeatures()
        for (const feature of selectedFeatures) {
            const newStyle = Object.assign({}, copiedStyle)
            if (feature.getIgnStyle().labelAttribute) {
                newStyle.labelAttribute = feature.getIgnStyle().labelAttribute
            }
            if (feature.getIgnStyle().textSize) {
                newStyle.textSize = feature.getIgnStyle().textSize
            }
            feature.setIgnStyle(newStyle)
            feature.changed()
        }
    }

    /**
     * Prompt for dimensions and create a rectangle
     */
    static addRectangle() {
        // Form
        const htmlTemplate = `
            <p class="titre">Créer un rectangle</p>
            <form id="addRectangleForm">
                <label>
                    Largeur (m) :
                    <input id="addRectangleWidth" required></input>
                </label>
                <br/>

                <label>
                    Hauteur (m) :
                    <input id="addRectangleHeight" required></input>
                </label>
                <br/>

                <label>
                    Rotation horaire (°) :
                    <input id="addRectangleAngle" value="0" required></input>
                </label>
                <br/>

                <button type="submit" class="bouton">Créer le rectangle</button>
            </form>
        `
        ImuUtils.macarte.wdialog.show(
            htmlTemplate,
            { 'modal': false, 'width': 400, 'class': 'wizzard'}
        );

        // Submit
        document.getElementById('addRectangleForm').onsubmit = e => {
            e.preventDefault()

            // Input validation
            const width = ImuUtils.parseInputFloat(
                document.getElementById('addRectangleWidth').value
            )
            const height = ImuUtils.parseInputFloat(
                document.getElementById('addRectangleHeight').value
            )
            const angle = ImuUtils.parseInputFloat(
                document.getElementById('addRectangleAngle').value
            )
            if (isNaN(width) || isNaN(height) || isNaN(angle)) {
                console.log('[IMU] Failed to parse inputs ', width, height, angle)
                return
            }

            // Parsing validated close modal
            ImuUtils.macarte.wdialog.hide();

            // Convert rectangle dimensions from real world to EPSG:3857
            const ratio = ImuUtils.computeDistanceConversionRatio(width)
            const convertedWidth = width * ratio
            const convertedHeight = height * ratio

            // Compute rectangle coordinates in the screen
            const center = ImuUtils.getViewCenter()
            const x1 = center[0] - (convertedWidth / 2)
            const x2 = center[0] + (convertedWidth / 2)
            const y1 = center[1] - (convertedHeight / 2)
            const y2 = center[1] + (convertedHeight / 2)

            // Create the feature and rotate it as requested
            const feature = new ol.Feature({
                geometry: new ol.geom.Polygon(
                    [[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]]
                )
            })
            feature.getGeometry().rotate(- angle / 180 * Math.PI, center)

            // Add rectangle to the currently selected layer
            // And select it in transform mode
            ImuUtils.getCurrentLayerSource().addFeature(feature)
            ImuUtils.select([feature], true)
        }
    }

    /**
     * Prompt for dimensions and create a segment
     */
    static addSegment() {
        // Form
        const htmlTemplate = `
            <p class="titre">Créer un segment</p>
            <form id="addSegmentForm">
                <label>
                    Longeur (m) :
                    <input id="addSegmentLength" required></input>
                </label>
                <br/>

                <label>
                    Rotation horaire depuis l'horizontale (°) :
                    <input id="addSegmentAngle" value="0" required></input>
                </label>
                <br/>

                <button type="submit" class="bouton">Créer le segment</button>
            </form>
        `
        ImuUtils.macarte.wdialog.show(
            htmlTemplate,
            { 'modal': false, 'width': 400, 'class': 'wizzard'}
        );

        // Submit
        document.getElementById('addSegmentForm').onsubmit = e => {
            e.preventDefault()

            // Input validation
            const length = ImuUtils.parseInputFloat(
                document.getElementById('addSegmentLength').value
            )
            const angle = ImuUtils.parseInputFloat(
                document.getElementById('addSegmentAngle').value
            )
            if (isNaN(length) || isNaN(angle)) {
                console.log('[IMU] Failed to parse inputs ', length, angle)
                return
            }

            // Parsing validated close modal
            ImuUtils.macarte.wdialog.hide();

            // Convert rectangle dimensions from real world to EPSG:3857
            const ratio = ImuUtils.computeDistanceConversionRatio(length)
            const convertedLength = length * ratio

            // Compute rectangle coordinates in the screen
            const center = ImuUtils.getViewCenter()
            const x1 = center[0] - (convertedLength / 2)
            const x2 = center[0] + (convertedLength / 2)

            // Create the feature and rotate it as requested
            const feature = new ol.Feature({
                geometry: new ol.geom.LineString(
                    [[x1, center[1]], [x2, center[1]]]
                )
            })
            feature.getGeometry().rotate(- angle / 180 * Math.PI, center)

            // Add rectangle to the currently selected layer
            // And select it in transform mode
            ImuUtils.getCurrentLayerSource().addFeature(feature)
            ImuUtils.select([feature], true)
        }
    }
}
