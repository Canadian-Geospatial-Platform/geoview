/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../../api/api';
import PanelContent from './panel-content';

/**
 * Create a class for the plugin instance
 */
class DetailsPlugin {
    // store the created button panel object
    buttonPanel: unknown;

    /**
     * translations object to inject to the viewer translations
     */
    translations: Record<string, Record<string, string>> = {
        'en-CA': {
            detailsPanel: 'Details',
            nothing_found: 'Nothing found',
            action_back: 'Back',
        },
        'fr-CA': {
            detailsPanel: 'Détails',
            nothing_found: 'Aucun résultat',
            action_back: 'Retour',
        },
    };

    /**
     * Added function called after the plugin has been initialized
     */
    added = (): void => {
        const { mapId } = this.props;
        const { language } = api.map(mapId);

        // button props
        const button = {
            // set ID to detailsPanel so that it can be accessed from the core viewer
            id: 'detailsPanel',
            tooltip: this.translations[language].detailsPanel,
            icon: '<i class="material-icons">details</i>',
            visible: false,
        };

        // panel props
        const panel = {
            title: this.translations[language].detailsPanel,
            icon: '<i class="material-icons">details</i>',
            width: 300,
        };

        // create a new button panel on the appbar
        this.buttonPanel = api.map(mapId).createAppbarPanel(button, panel, null);

        // set panel content
        this.buttonPanel.panel.changeContent(<PanelContent buttonPanel={this.buttonPanel} mapId={mapId} />);
    };

    /**
     * Function called when the plugin is removed, used for clean up
     */
    removed(): void {
        const { mapId } = this.props;

        api.map(mapId).removeAppbarPanel(this.buttonPanel.id);
    }
}

export default DetailsPlugin;
