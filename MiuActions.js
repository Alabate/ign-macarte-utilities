class MiuActions {

    static duplicateSelection() {
        const currentLayerSource = MiuUtils.getCurrentLayerSource()
        const selectedFeatures = MiuUtils.getSelectedFeatures()
        console.log('[MIU] Cloning features', selectedFeatures)

        if (selectedFeatures.length == 0) {
            MiuUtils.timedMsgBox(
                (
                    'Aucun élement selectionné. <br/>'
                    + 'Veuillez utiliser l\'outil de selection '
                    + '<i data-mode="None" class="fa fa-hand-o-up"></i>.'
                ),
                2000
            )
        }
        else {
            for (const feature of selectedFeatures) {
                const newFeature = feature.clone()
                const ignStyle = Object.assign({}, feature.getIgnStyle())
                newFeature.setIgnStyle(ignStyle)
                currentLayerSource.addFeature(newFeature)
            }
        }
    }
}
