import { curry } from 'lodash-es';
import { Leerling, PartialLeerlingFragment } from '../../../generated/_types';

export function getVolledigeNaam(leerling: Pick<Leerling, 'voornaam' | 'tussenvoegsels' | 'achternaam'>): string {
    const tussenvoegsel = leerling.tussenvoegsels ? leerling.tussenvoegsels + ' ' : '';
    return `${leerling.voornaam} ${tussenvoegsel}${leerling.achternaam}`;
}

export const sortLeerlingByAchternaamVoornaam = (
    a: Pick<Leerling | PartialLeerlingFragment, 'voornaam' | 'achternaam'>,
    b: Pick<Leerling | PartialLeerlingFragment, 'voornaam' | 'achternaam'>
): number => {
    const achternaamA = a.achternaam;
    const achternaamB = b.achternaam;
    const voornaamA = a.voornaam;
    const voornaamB = b.voornaam;
    if (achternaamA < achternaamB) {
        return -1;
    }
    if (achternaamA > achternaamB) {
        return 1;
    }
    if (voornaamA < voornaamB) {
        return -1;
    }
    if (voornaamA > voornaamB) {
        return 1;
    }
    return 0;
};

export const sortLeerlingBySelectionAndAchternaam = curry(
    (selectedLeerlingIds: string[], a: PartialLeerlingFragment, b: PartialLeerlingFragment) => {
        const aSelected = selectedLeerlingIds.includes(a.id);
        const bSelected = selectedLeerlingIds.includes(b.id);
        return aSelected === bSelected ? sortLeerlingByAchternaamVoornaam(a, b) : aSelected ? -1 : 1;
    }
);
