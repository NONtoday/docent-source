import { isWithinInterval } from 'date-fns';
import { NotitieFieldsFragment, NotitieInput, NotitiestreamQuery, PartialLeerlingFragment } from '../../generated/_types';
import { getVolledigeNaam } from '../shared/utils/leerling.utils';
import { Betrokkene, BetrokkeneTag } from './betrokkene-selectie/betrokkene-selectie.component';

export const defaultNieuweNotitie: NotitieInput = {
    belangrijk: false,
    gedeeldVoorDocenten: false,
    gedeeldVoorMentoren: false,
    inhoud: '',
    vastgeprikt: false,
    initieelVastgeprikt: false,
    privacygevoelig: false,
    reactiesToegestaan: false,
    titel: '',
    betrokkenen: [],
    bijlagen: []
};

export const defaultSavedNotitie: NotitieFieldsFragment = {
    id: '1234',
    belangrijk: false,
    gedeeldVoorDocenten: false,
    gedeeldVoorMentoren: false,
    inhoud: '',
    vastgeprikt: false,
    initieelVastgeprikt: false,
    privacygevoelig: false,
    reactiesToegestaan: false,
    aantalReacties: 0,
    auteurInactief: false,
    bookmarked: false,
    createdAt: new Date(),
    lastModifiedAt: new Date(),
    auteur: {
        id: '321',
        uuid: 'abc',
        nummer: '1',
        voornaam: 'Mark',
        achternaam: 'Entor',
        initialen: 'M.'
    },
    titel: '',
    leerlingBetrokkenen: [],
    lesgroepBetrokkenen: [],
    stamgroepBetrokkenen: [],
    bijlagen: []
};

export const betrokkeneToTag = (betrokkene: Betrokkene): BetrokkeneTag => {
    if (betrokkeneIsLeerling(betrokkene)) {
        return {
            id: betrokkene.id,
            naam: getVolledigeNaam(betrokkene),
            pasfoto: betrokkene.pasfoto,
            initialen: betrokkene.initialen,
            type: 'leerling'
        };
    }

    return {
        id: betrokkene.id,
        naam: betrokkene.naam,
        type: 'groep'
    };
};

const betrokkeneIsLeerling = (betrokkene: Betrokkene): betrokkene is PartialLeerlingFragment => betrokkene.__typename === 'Leerling';

export const isHuidigeWeek = (week: NotitiestreamQuery['notitiestream'][number]): boolean => {
    return isWithinInterval(new Date(), { start: week.start, end: week.eind });
};
