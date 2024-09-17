import { InleveringStatus, Inleverperiode } from '@docent/codegen';
import { PillTagColor } from 'harmony';

export type InleveringenOverzichtProperty = 'teBeoordelen' | 'inBeoordeling' | 'afgewezen' | 'akkoord' | 'nietIngeleverd';
export type InleveropdrachtDownloadableStatus = Exclude<InleveringenOverzichtProperty, 'nietIngeleverd'>;

const inleveringStatusConverter: Record<InleveringenOverzichtProperty, InleveringStatus> = {
    teBeoordelen: InleveringStatus.TE_BEOORDELEN,
    inBeoordeling: InleveringStatus.IN_BEOORDELING,
    afgewezen: InleveringStatus.AFGEWEZEN,
    akkoord: InleveringStatus.AKKOORD,
    nietIngeleverd: InleveringStatus.NIET_INGELEVERD
};

export const inleveringenOverzichtPropToInleveringStatus = (prop: InleveropdrachtDownloadableStatus) => inleveringStatusConverter[prop];

interface InleveringenOverzichtWrapper {
    label: string;
    property: InleveringenOverzichtProperty;
    color: PillTagColor;
}

export const inleveringenOverzichtStatussen: InleveringenOverzichtWrapper[] = [
    {
        label: 'Te beoordelen',
        property: 'teBeoordelen',
        color: 'primary'
    },
    {
        label: 'In beoordeling',
        property: 'inBeoordeling',
        color: 'warning'
    },
    {
        label: 'Afgewezen',
        property: 'afgewezen',
        color: 'negative'
    },
    {
        label: 'Akkoord',
        property: 'akkoord',
        color: 'positive'
    },
    {
        label: 'Niet ingeleverd',
        property: 'nietIngeleverd',
        color: 'neutral'
    }
];

export const teDownloadenStatussen = ['teBeoordelen', 'inBeoordeling', 'afgewezen', 'akkoord'];
export const inleveropdrachtenStatussen: InleveringenOverzichtProperty[] = [
    'teBeoordelen',
    'inBeoordeling',
    'afgewezen',
    'akkoord',
    'nietIngeleverd'
];

export const getInleveringenAantalPillTagColor = (inleverperiode: Inleverperiode): PillTagColor => {
    if (inleverperiode.inleveringenAantal === 0) {
        return 'neutral';
    }

    return inleverperiode.inleveringenAantal === inleverperiode.inleveringenVerwacht ? 'positive' : 'primary';
};
