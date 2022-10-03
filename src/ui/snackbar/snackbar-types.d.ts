import { TypeJsonValue } from '../../core/types/global-types';
/** ******************************************************************************************************************************
 * Interface used to initialize a snackbar message.
 */
export declare type TypeSnackbarMessage = {
    type: string;
    value: string;
    params?: TypeJsonValue[];
};
