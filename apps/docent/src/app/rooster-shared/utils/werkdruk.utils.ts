import { curry } from 'lodash-es';
import { HuiswerkType, WerkdrukStudiewijzeritem } from '../../../generated/_types';
import { LesitemType } from '../../core/models/studiewijzers/shared.model';

export const lestItemTypeToHuiswerkType = (type: LesitemType): HuiswerkType => {
    if (type === 'Huiswerk' || type === 'Inleveropdracht') {
        return HuiswerkType.HUISWERK;
    } else if (type === 'Grote toets') {
        return HuiswerkType.GROTE_TOETS;
    } else if (type === 'Lesstof') {
        return HuiswerkType.LESSTOF;
    } else {
        return HuiswerkType.TOETS;
    }
};

export const werkdrukDagenLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr'];
export const werkdrukLabels = ['Week<br>taken', ...werkdrukDagenLabels];
export const werkdrukGhostBar = (type: HuiswerkType) => ({ studiewijzerItem: { huiswerkType: type } });
export const werkdrukFilterType = curry((type: LesitemType, werkdrukItem: WerkdrukStudiewijzeritem) => {
    if (type === 'Inleveropdracht') {
        return !!werkdrukItem.studiewijzerItem.inleverperiode;
    }
    return !werkdrukItem.studiewijzerItem.inleverperiode && werkdrukItem.studiewijzerItem.huiswerkType === lestItemTypeToHuiswerkType(type);
});

export const defaultWerkdrukGhostBars = werkdrukLabels.map((label) => ({
    label,
    items: [werkdrukGhostBar(HuiswerkType.HUISWERK), werkdrukGhostBar(HuiswerkType.GROTE_TOETS)],
    loading: true
}));
