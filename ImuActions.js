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
        ImuUtils.deleteFeaturesFromLayers(selectedFeatures)

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
            <h3>Créer un rectangle</h3>
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
            const viewAngle = ImuUtils.map.getView().getRotation()
            feature.getGeometry().rotate(viewAngle - angle / 180 * Math.PI, center)

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
            <h3>Créer un segment</h3>
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
            const viewAngle = ImuUtils.map.getView().getRotation()
            feature.getGeometry().rotate(viewAngle - angle / 180 * Math.PI, center)

            // Add rectangle to the currently selected layer
            // And select it in transform mode
            ImuUtils.getCurrentLayerSource().addFeature(feature)
            ImuUtils.select([feature], true)
        }
    }

    /**
     * Prompt for map heading and rotate the map
     */
    static setMapOrientation() {
        // Form
        const htmlTemplate = `
            <h3>Changer l'orientation de la carte</h3>
            <form id="setMapOrientationForm">
                <label>
                    Orientation de la carte (°) :
                    <input id="SetMapOrientationValue" required></input>
                </label>
                <br/>
                <br/>
                <strong>Exemples de valeurs:</strong><br/>
                <ul>
                    <li>• 0°: Le nord en haut</li>
                    <li>• 45°: Le nord-ouest en haut</li>
                    <li>• 90°: L'ouest en haut</li>
                    <li>• -90°: L'est en haut</li>
                </ul>
                <button type="submit" class="bouton">Orienter la carte</button>
            </form>
        `
        ImuUtils.macarte.wdialog.show(
            htmlTemplate,
            { 'modal': false, 'width': 400, 'class': 'wizzard'}
        );
        // Pre-fill the value with the current orientation
        const oldRotationDeg = ImuUtils.map.getView().getRotation() / Math.PI * 180
        document.getElementById('SetMapOrientationValue').value = oldRotationDeg

        // Submit
        document.getElementById('setMapOrientationForm').onsubmit = e => {
            e.preventDefault()

            // Input validation
            let rotationDeg = ImuUtils.parseInputFloat(
                document.getElementById('SetMapOrientationValue').value
            )
            if (isNaN(rotationDeg)) {
                console.log('[IMU] Failed to parse inputs ', rotationDeg)
                return
            }

            // Parsing validated close modal
            ImuUtils.macarte.wdialog.hide();

            // Set map rotation
            ImuUtils.map.getView().setRotation(rotationDeg / 180 * Math.PI)
        }
    }

    /**
     * Recreate the delete feature to fix the foolowing issues
     * - Delete should not be an edition mode, it's an action applied on selection
     * - Add support for delete key shortcut
     * - Support deleting elements from different layers
     * - Support transform selection
     */
    static delete() {
        const selectedFeatures = ImuUtils.getSelectedFeatures()
        if (selectedFeatures.length == 0) {
            ImuUtils.timedMsgBox('Veuiller sélectionner un ou des objects.')
            return
        }
        ImuUtils.macarte.wdialog.msgChoice(
            `Supprimer les ${selectedFeatures.length} objects sélectionnés ?`,
            () => {
                ImuUtils.deleteFeaturesFromLayers(selectedFeatures)
                ImuUtils.unselect()
                ImuUtils.macarte.wdialog.hide()
            },
            () => ImuUtils.macarte.wdialog.hide()
        );
    }

    /**
     * Prompt to which layer you want to move the selection and do it
     */
    static moveToLayer() {
        const selectedFeatures = ImuUtils.getSelectedFeatures()
        if (selectedFeatures.length == 0) {
            ImuUtils.timedMsgBox('Veuiller sélectionner un ou des objects.')
            return
        }

        // Form
        const htmlTemplate = `
            <h3>Changer le calque pour les <span id="moveToLayerSelectionLength"></span> objet(s) sélectionnés</h3>
            <form id="moveToLayerForm">
                <label>
                    Calsque de destination :
                    <select required id="moveToLayerSelect">
                    </select>
                </label>
                <br/>

                <button type="submit" class="bouton">Déplacer vers ce calque</button>
            </form>
        `
        ImuUtils.macarte.wdialog.show(
            htmlTemplate,
            { 'modal': false, 'width': 600, 'class': 'wizzard'}
        );

        // Configure form
        const selectionLengthSpan = document.getElementById('moveToLayerSelectionLength')
        selectionLengthSpan.innerText = selectedFeatures.length
        const select = document.getElementById('moveToLayerSelect')
        const layers = ImuUtils.map.getLayers().getArray()
        for (const [i, layer] of layers.entries()) {
            if (layer.getType() == 'vector') {
                const option = document.createElement("option")
                option.value = i
                option.text = layer.get('name')
                select.add(option)
            }
        }

        // Submit
        document.getElementById('moveToLayerForm').onsubmit = e => {
            e.preventDefault()

            // Input validation
            const layerId = parseInt(select.value)
            if (isNaN(layerId) || !layers[layerId]) {
                console.log('[IMU] Failed to parse inputs ', layerId)
                return
            }

            // Delete features from all layers
            // Then add them back to the new layer
            ImuUtils.deleteFeaturesFromLayers(selectedFeatures)
            layers[layerId].getSource().addFeatures(selectedFeatures)

            ImuUtils.macarte.wdialog.hide()
        }
    }

    /**
     * Show information on selected feature
     */
    static showInfo() {
        const selectedFeatures = ImuUtils.getSelectedFeatures()
        if (selectedFeatures.length == 0) {
            ImuUtils.timedMsgBox('Veuiller sélectionner un object.')
            return
        }
        if (selectedFeatures.length > 1) {
            ImuUtils.timedMsgBox('Veuiller sélectionner un seul object.')
            return
        }
        console.log('[IMU] Selected feature:', selectedFeatures[0])

        // Form
        const htmlTemplate = `
            <h3>Informations sur l'objet sélectionnés</h3>
            <div id="showInfoDiv">
            </form>
        `
        ImuUtils.macarte.wdialog.show(
            htmlTemplate,
            { 'modal': false, 'width': 600, 'class': 'wizzard'}
        );

        // Utility consts
        const infoDiv = document.getElementById('showInfoDiv')
        const feature = selectedFeatures[0]
        const geometry = feature.getGeometry()
        const coordinates = geometry.getCoordinates()

        // Add rectangle informations
        const isRectangle = ImuUtils.isRectangle(geometry)
        infoDiv.innerHTML +=
            '<h4>Rectangle</h4>'
            + `isRectangle: ${isRectangle}<br/>`
        if (isRectangle) {
            const a = ImuUtils.getDistance(coordinates[0][0], coordinates[0][1])
            const b = ImuUtils.getDistance(coordinates[0][1], coordinates[0][2])
            const ratio = ImuUtils.computeDistanceConversionRatio(a)
            const angle = ImuUtils.getRectangleAngle(geometry)*180/Math.PI
            infoDiv.innerHTML +=
                `getRectangleAngle: ${angle.toFixed(2)}<br/>`
                + `Dimensions: ${(a/ratio).toFixed(3)} x ${(b/ratio).toFixed(3)} m<br/>`
        }

        // Add segment informations
        const segmentAngle = ImuUtils.getSegmentAngle(geometry)
        const isSegment = segmentAngle !== false
        infoDiv.innerHTML +=
            '<h4>Segment</h4>'
            + `isSegment: ${isSegment}<br/>`
        if (isSegment) {
            const length = ImuUtils.getDistance(coordinates[0], coordinates[1])
            const ratio = ImuUtils.computeDistanceConversionRatio(length)
            const angle = segmentAngle * 180 / Math.PI
            infoDiv.innerHTML +=
                `getSegmentAngle: ${angle.toFixed(2)}°<br/>`
                + `Length: ${(length/ratio).toFixed(3)} m<br/>`
        }

        // LineString
        const isLineString = (geometry.getType() == 'LineString')
        infoDiv.innerHTML +=
            '<h4>LineString</h4>'
            + `isLineString: ${isLineString}<br/>`
        if (isLineString) {
            const firstLength = ImuUtils.getDistance(coordinates[0], coordinates[1])
            const ratio = ImuUtils.computeDistanceConversionRatio(firstLength)
            for (let i = 1; i < coordinates.length; i++) {
                const length = ImuUtils.getDistance(coordinates[i-1], coordinates[i])
                infoDiv.innerHTML +=
                    `segment length: ${(length/ratio).toFixed(3)} m<br/>`

            }
        }

        // isPolygon
        const isPolygon = (geometry.getType() == 'Polygon')
        infoDiv.innerHTML +=
            '<h4>Polygon</h4>'
            + `isPolygon: ${isPolygon}<br/>`
        if (isPolygon) {
            const firstLength = ImuUtils.getDistance(coordinates[0][0], coordinates[0][1])
            const ratio = ImuUtils.computeDistanceConversionRatio(firstLength)
            for (let i = 0; i < coordinates[0].length; i++) {
                const precedentCoordinates = (i == 0) ? coordinates[0][coordinates[0].length - 1] : coordinates[0][i-1]
                const length = ImuUtils.getDistance(precedentCoordinates, coordinates[0][i])
                infoDiv.innerHTML +=
                    `segment length: ${(length/ratio).toFixed(3)} m<br/>`

            }
        }

        // Add coordinate list to infos
        infoDiv.innerHTML +=
            '<h4>Coordonnées</h4>'
            + '<pre>' + JSON.stringify(coordinates, null, 2) + '</pre>'
            // Todo distances entre chaque point
    }



}
