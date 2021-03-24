import { api } from '../../api/api';
import TestPluginComponent from './test-plugin';

/**
 * Create a class for the plugin instance
 */
class TestPlugin {
    // store the created button panel object
    panel: unknown;

    /**
     * translations object to inject to the viewer translations
     */
    translations: Record<string, Record<string, string>> = {
        'en-CA': {
            testMessage: 'Test Message',
        },
        'fr-CA': {
            testMessage: "Message d'essai",
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
            tooltip: this.translations[language].testMessage,
            icon: '<i class="material-icons">map</i>',
        };

        // panel props
        const panel = {
            title: this.translations[language].testMessage,
            icon: '<i class="material-icons">map</i>',
            content: TestPluginComponent,
            width: 200,
        };

        // create a new button panel on the appbar
        this.panel = api.map(mapId).createAppbarPanel(button, panel, null);
    };

    /**
     * Function called when the plugin is removed, used for clean up
     */
    removed(): void {
        console.log('removed');
    }
}

export default TestPlugin;
