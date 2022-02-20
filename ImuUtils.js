class ImuUtils {

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
        if (interaction && Array.isArray(interaction.getFeatures())) {
            return interaction.getFeatures()
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
            ImuGui.enableMode('Transform')
            const interaction = this.carte.getInteractionByName("TransformInteraction")

            // We select the first one because this mode doens't support more
            for (const feature of features) {
                interaction.select(feature, true)
            }
        }
        else {
            // Ensure we are in the selection mode
            ImuGui.enableMode('None')

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

    /**
     * Check if the angled formed by 3 points is orthogonal
     * @param {ol.coordinate.Coordinate} a Point coordinates
     * @param {ol.coordinate.Coordinate} b Point coordinates
     * @param {ol.coordinate.Coordinate} c Point coordinates
     * @returns {boolean} True if the angle is orthogonal
     */
    static isOrthogonal(a, b, c, epsilon = 1e-10)
    {
        return Math.abs((b[0] - a[0]) * (b[0] - c[0]) + (b[1] - a[1]) * (b[1] - c[1])) <= epsilon;
    }

    /**
     * Compute euclidean distance between two points
     * @param {ol.coordinate.Coordinate} a Point coordinates
     * @param {ol.coordinate.Coordinate} b Point coordinates
     * @returns {float} The computed distance
     */
    static getDistance(a, b)
    {
        return Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    }

    /**
     * Check if the given geometry is a rectangle
     * @param {ol.geom.Geometry} geometry The geometry to test
     * @returns {boolean} True if the geometry is a rectangle
     */
    static isRectangle(geometry) {
        // Simples checks for polygon and number of coordinates
        if (geometry.getType() != 'Polygon') {
            return false
        }
        const coordinates = geometry.getCoordinates()
        if (coordinates.length != 1 && coordinates[0].length != 4) {
            return false
        }

        // Check if rectangle by checking if 3 angles are orthogonal
        const a = coordinates[0][0]
        const b = coordinates[0][1]
        const c = coordinates[0][2]
        const d = coordinates[0][3]
        const EPSILON = 1e-1
        return (
            this.isOrthogonal(a, b, c, EPSILON)
            && this.isOrthogonal(b, c, d, EPSILON)
            && this.isOrthogonal(c, d, a, EPSILON)
        )
    }

    /**
     * Get angle of the longest side of the rectangle on unit circle
     *  (=> counter clockwise + start on the right)
     * If geometry is not a rectangle, this will return unexpected results
     * @param {ol.geom.Geometry} geometry The geometry work on
     * @returns {float} The angle of the longest side of the rectangle in radians
     */
    static getRectangleAngle(geometry) {
        const coordinates = geometry.getCoordinates()
        const a = coordinates[0][0]
        const b = coordinates[0][1]
        const c = coordinates[0][2]

        // Find the longest side
        if (this.getDistance(a,b) > this.getDistance(b,c)) {
            return Math.atan2((b[1] - a[1]),(b[0] - a[0]))
        }
        else {
            return Math.atan2((c[1] - b[1]),(c[0] - b[0]))
        }
    }

    /**
     * Return the angle of the segment on the unit circle
     *  (=> counter clockwise + start on the right)
     * This function only work for 2 points line string
     * @param {ol.geom.Geometry} geometry The geometry work on
     * @returns {float} The angle of the segment or false if geometry is not a 2
     *  points line string
     */
    static getSegmentAngle(geometry) {
        // Simples checks for polygon and number of coordinates
        if (geometry.getType() != 'LineString') {
            return false
        }
        const coordinates = geometry.getCoordinates()
        if (coordinates.length != 2) {
            return false
        }

        const a = coordinates[0]
        const b = coordinates[1]
        return Math.atan2((b[1] - a[1]),(b[0] - a[0]))
    }

    /**
     * Parse the string as float
     * Coma and dot are accepted as floating point separator
     * Return NaN if parsing failed
     * @param {string} input The string to parse
     * @returns {float} The parsed fload or NaN in case of failure
     */
    static parseInputFloat(input) {
        input = input.replace(',', '.')
        return parseFloat(input)
    }

    /**
     * Compute distance conversion ratio between OpenLayer projection
     * format (EPSG:3857) and approximate real heart distances
     * This ratio depends on the size of the shape because
     * of the elliptic shape of the earth. This is why we use the shape size
     * to compute the ratio
     * @param {float} width Shape width or height or length
     * @returns {float} The computed ratio, multiply it on with and height.
     */
    static computeDistanceConversionRatio(width) {
        const center = this.getViewCenter()
        const x1 = center[0] - (width/2)
        const x2 = center[0] + (width/2)
        const line = new ol.geom.LineString([[x1, center[1]], [x2, center[1]]])
        const ratio = (width != 0) ? Math.abs(width / ol.sphere.getLength(line)) : 1
        return ratio
    }
}