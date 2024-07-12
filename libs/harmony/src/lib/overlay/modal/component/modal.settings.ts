import { IconName } from 'harmony-icons';
import { ColorToken } from '../../../tokens/color-token';

export interface ModalSettings {
    showClose: boolean;
    contentPadding: number;
    heightRollup: string;
    maxHeightRollup: string;
    heightModal: string;
    widthModal: string;
    maxHeightModal: string;
    keepOnNavigation: boolean;
    title: string | undefined;
    titleIcon: IconName | undefined;
    titleIconColor: ColorToken | undefined;
    onClose?: () => void;
}

export type MaskAnimationState = 'show' | 'hide';
export type ContentAnimationState = 'show-modal' | 'show-rollup' | 'hide-modal' | 'hide-rollup';

export function createModalSettings(updatedSettings?: Partial<ModalSettings>): ModalSettings {
    return {
        showClose: true,
        contentPadding: 16,
        heightRollup: 'initial',
        maxHeightRollup: '75%',
        heightModal: 'initial',
        maxHeightModal: '75%',
        widthModal: 'max-content',
        keepOnNavigation: false,
        title: undefined,
        titleIcon: undefined,
        titleIconColor: undefined,
        ...updatedSettings
    };
}
