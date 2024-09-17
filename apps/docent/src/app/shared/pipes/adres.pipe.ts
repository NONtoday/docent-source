import { Pipe, PipeTransform } from '@angular/core';
import { Adres } from '@docent/codegen';
import { capitalize } from 'lodash-es';
import { Optional } from '../../rooster-shared/utils/utils';

type BuitenlandsAdres = Pick<Adres, 'land' | 'buitenland1' | 'buitenland2' | 'buitenland3'>;
type NederlandsAdres = Pick<Adres, 'straat' | 'huisnummer' | 'plaatsnaam' | 'isBuitenlandsAdres'>;

const getNederlandsAdresString = (adres: NederlandsAdres): string => {
    // Wanneer er geen straat of huisnummer en geen plaatsnaam is toon dan maar niks
    if (!adres.straat && !adres.plaatsnaam) {
        return '';
    }

    return [
        adres.straat,
        adres.straat && adres.huisnummer ? ' ' : '',
        adres.huisnummer,
        adres.straat && adres?.plaatsnaam ? ', ' : '',
        capitalize(adres.plaatsnaam!)
    ]
        .filter(Boolean)
        .join('');
};

const getBuitenlandsAdresString = (adres: BuitenlandsAdres): string => {
    const buitenlandAdressen = [adres.buitenland1, adres.buitenland2, adres.buitenland3].filter(Boolean).join(', ');
    const heeftBuitenlandRegel = Boolean(buitenlandAdressen);
    const adressenLandSeperator = adres.land && heeftBuitenlandRegel ? ', ' : '';

    return `${buitenlandAdressen}${adressenLandSeperator}${adres.land ?? ''}`;
};

export const getAdresString = (
    adres: Optional<BuitenlandsAdres & NederlandsAdres & Pick<Adres, 'isBuitenlandsAdres'>>,
    suffix?: string
) => {
    if (!adres) {
        return '';
    }

    const adresString = adres.isBuitenlandsAdres ? getBuitenlandsAdresString(adres) : getNederlandsAdresString(adres);
    const adresSuffix = suffix ? ` ${suffix}` : '';

    return adresString === '' ? '' : `${adresString}${adresSuffix}`;
};

@Pipe({
    name: 'adres',
    standalone: true
})
export class AdresPipe implements PipeTransform {
    transform(adres: Optional<BuitenlandsAdres & NederlandsAdres & Pick<Adres, 'isBuitenlandsAdres'>>, suffix?: string): string {
        return getAdresString(adres, suffix);
    }
}
