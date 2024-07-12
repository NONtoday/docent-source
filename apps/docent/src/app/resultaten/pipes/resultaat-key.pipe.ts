import { Pipe, PipeTransform } from '@angular/core';
import { Optional } from '../../rooster-shared/utils/utils';

export const getResultaatKey = (kolomId: Optional<string>, leerlingUuid: string, herkansingNummer: Optional<number>): string =>
    `${kolomId}:${leerlingUuid}:${herkansingNummer}`;
@Pipe({
    name: 'resultaatKey',
    standalone: true
})
export class ResultaatKeyPipe implements PipeTransform {
    transform(kolomId: Optional<string>, leerlingUuid: string, herkansingNummer: Optional<number>): string {
        return getResultaatKey(kolomId, leerlingUuid, herkansingNummer);
    }
}
