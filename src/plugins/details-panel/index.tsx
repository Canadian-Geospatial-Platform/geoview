/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import PanelContent from './panel-content';
import { api } from '../../api/api';
import { TypeButtonPanel, TypeProps, TypeButtonProps, TypePanelProps } from '../../types/cgpv-types';

/**
 * Create a class for the plugin instance
 */
class DetailsPlugin {
    // id of the plugin
    id: string;

    // plugin properties
    DetailsPluginProps: TypeProps;

    // store the created button panel object
    buttonPanel: TypeButtonPanel | null;

    constructor(id: string, props: TypeProps) {
        this.id = id;
        this.DetailsPluginProps = props;
        this.buttonPanel = null;
    }

    /**
     * translations object to inject to the viewer translations
     */
    translations: TypeProps<TypeProps<string>> = {
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
        const { mapId } = this.DetailsPluginProps;
        const { language } = api.map(mapId);

        // button props
        const button: TypeButtonProps = {
            // set ID to detailsPanel so that it can be accessed from the core viewer
            id: 'detailsPanelButton',
            tooltip: this.translations[language].detailsPanel,
            icon: '<i class="material-icons">details</i>',
            visible: false,
        };

        // panel props
        const panel: TypePanelProps = {
            title: this.translations[language].detailsPanel,
            icon: '<i class="material-icons">details</i>',
            width: 300,
        };

        // create a new button panel on the appbar
        this.buttonPanel = api.map(mapId).buttonPanel.createAppbarPanel(button, panel, null);

        // set panel content
        this.buttonPanel?.panel?.changeContent(<PanelContent buttonPanel={this.buttonPanel} mapId={mapId} />);
    };

    /**
     * Function called when the plugin is removed, used for clean up
     */
    removed(): void {
        const { mapId } = this.DetailsPluginProps;

        if (this.buttonPanel) {
            api.map(mapId).buttonPanel.removeAppbarPanel(this.buttonPanel.id);
        }
    }
}

export default DetailsPlugin;
