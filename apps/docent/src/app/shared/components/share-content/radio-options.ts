import { IconName } from 'harmony-icons';
import { accent_alt_1, accent_negative_1, accent_positive_1, accent_warning_1, primary_1 } from '../../../rooster-shared/colors';

export interface RadioOption {
    value: string;
    icon: IconName;
    iconColor: string;
    placeholder: string;
}

export const radioOptions: RadioOption[] = [
    {
        value: 'HUISWERK',
        icon: 'huiswerk',
        iconColor: primary_1,
        placeholder: 'Huiswerk'
    },
    {
        value: 'GROTE_TOETS',
        icon: 'toetsGroot',
        iconColor: accent_negative_1,
        placeholder: 'Grote toets'
    },
    {
        value: 'TOETS',
        icon: 'toets',
        iconColor: accent_warning_1,
        placeholder: 'Toets'
    },
    {
        value: 'LESSTOF',
        icon: 'lesstof',
        iconColor: accent_positive_1,
        placeholder: 'Lesstof'
    },
    {
        value: 'INLEVEROPDRACHT',
        icon: 'inleveropdracht',
        iconColor: accent_alt_1,
        placeholder: 'Inleveropdracht'
    }
];
