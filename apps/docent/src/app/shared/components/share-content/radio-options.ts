import { ColorToken } from 'harmony';
import { IconName } from 'harmony-icons';

export interface RadioOption {
    value: string;
    icon: IconName;
    iconColor: ColorToken;
    placeholder: string;
}

export const radioOptions: RadioOption[] = [
    {
        value: 'HUISWERK',
        icon: 'huiswerk',
        iconColor: 'fg-primary-normal',
        placeholder: 'Huiswerk'
    },
    {
        value: 'GROTE_TOETS',
        icon: 'toetsGroot',
        iconColor: 'fg-negative-normal',
        placeholder: 'Grote toets'
    },
    {
        value: 'TOETS',
        icon: 'toets',
        iconColor: 'fg-warning-normal',
        placeholder: 'Toets'
    },
    {
        value: 'LESSTOF',
        icon: 'lesstof',
        iconColor: 'fg-positive-normal',
        placeholder: 'Lesstof'
    },
    {
        value: 'INLEVEROPDRACHT',
        icon: 'inleveropdracht',
        iconColor: 'fg-alternative-normal',
        placeholder: 'Inleveropdracht'
    }
];
