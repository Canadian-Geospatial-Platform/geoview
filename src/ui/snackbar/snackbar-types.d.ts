import { TypeJsonValue } from '../../core/types/global-types';
/** ******************************************************************************************************************************
 * Interface used to initialize a snackbar message.
 */
export type TypeSnackbarMessage = {
    type: string;
    value: string;
    params?: TypeJsonValue[];
};
