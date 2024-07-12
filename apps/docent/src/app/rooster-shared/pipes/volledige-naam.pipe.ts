import { Pipe, PipeTransform } from '@angular/core';
import { Maybe } from '../../../generated/_types';
import { Optional } from '../utils/utils';

export interface Persoon {
    voornaam?: Maybe<string>;
    tussenvoegsels?: Maybe<string>;
    achternaam?: Maybe<string>;
    voorletters?: Maybe<string>;
}

export const getVolledigeNaam = (persoon: Persoon) => {
    const volledigeNaam = [persoon.voorletters, persoon.voornaam, persoon.tussenvoegsels, persoon.achternaam].filter(Boolean).join(' ');
    return volledigeNaam.length > 0 ? volledigeNaam : 'Onbekend';
};

@Pipe({
    name: 'volledigeNaam',
    standalone: true
})
export class VolledigeNaamPipe implements PipeTransform {
    transform(persoon: Optional<Persoon>): string {
        return persoon ? getVolledigeNaam(persoon) : '';
    }
}
