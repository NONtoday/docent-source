import { Pipe, PipeTransform } from '@angular/core';
import {
    Advieskolom,
    BevrorenStatus,
    Deeltoetskolom,
    Herkansing,
    MatrixResultaatkolomFieldsFragment,
    PeriodeGemiddeldekolom,
    RapportCijferkolom,
    RapportGemiddeldekolom,
    RapportToetskolom,
    ResultaatkolomType
} from '../../../generated/_types';
import { isKolomOfType, isToetskolom } from '../resultaten.utils';
import { convertHerkansingToNaam } from './herkansing-naam.pipe';

@Pipe({
    name: 'kolomHeaderTooltip',
    standalone: true
})
export class KolomHeaderTooltipPipe implements PipeTransform {
    transform(kolom: MatrixResultaatkolomFieldsFragment, periode?: number): string | undefined {
        const resultaatkolom = kolom.resultaatkolom;
        const status = resultaatkolom.bevrorenStatus;
        const omschrijving = kolom.lesgroepSpecifiekeOmschrijving ?? resultaatkolom.omschrijving ?? '';
        const kolomStatus =
            status === BevrorenStatus.Ontdooid ? '' : `<div style="font-weight: 600">Toetskolom ${status.toLocaleLowerCase()}</div>`;
        const geimporteerdeKolom = !kolom.resultaatAnderVakKolom ? '' : `<div style="font-weight: 600">Geïmporteerde toets</div>`;
        const uitPeriode = periode ? `uit periode ${periode - 1}` : '';

        if (isKolomOfType<Advieskolom>(resultaatkolom, ResultaatkolomType.ADVIES)) {
            return `${geimporteerdeKolom}${kolomStatus}<div style="font-weight: 600">Advieskolom</div><div>${[
                resultaatkolom.categorie,
                omschrijving
            ].join(' - ')}</div>`;
        } else if (isKolomOfType<PeriodeGemiddeldekolom>(resultaatkolom, ResultaatkolomType.PERIODE_GEMIDDELDE)) {
            return '<div style="font-weight: 600">Periodegemiddelde</div>';
        } else if (isKolomOfType<RapportGemiddeldekolom>(resultaatkolom, ResultaatkolomType.RAPPORT_GEMIDDELDE)) {
            return '<div style="font-weight: 600">Berekend rapportcijfer</div>';
        } else if (isKolomOfType<RapportCijferkolom>(resultaatkolom, ResultaatkolomType.RAPPORT_CIJFER)) {
            const vastgezet = resultaatkolom.vastgezet ? '<div style="font-weight: 600">Rapportcijfers zijn vastgezet<div>' : '';
            return `<div style="font-weight: 600">Rapportcijfer</div><div>Waarbij een overschreven cijfer voorrang heeft</div>${kolomStatus}${vastgezet}`;
        } else if (isKolomOfType<Deeltoetskolom>(resultaatkolom, ResultaatkolomType.DEELTOETS)) {
            const toetsSoort = resultaatkolom.toetsSoort
                ? `<div><span style="font-weight: 600">Toetssoort: </span>${resultaatkolom.toetsSoort.naam}</div>`
                : '';
            return `${geimporteerdeKolom}${kolomStatus}${toetsSoort}<div><span style="font-weight: 600">Weging samengestelde toets: </span>${String(
                resultaatkolom.deeltoetsWeging ?? 0
            )}</div><div><span style="font-weight: 600">Omschrijving: </span>${omschrijving}</div>`;
        } else if (isToetskolom(resultaatkolom)) {
            const herkansing =
                resultaatkolom.herkansing && resultaatkolom.herkansing !== Herkansing.Geen
                    ? convertHerkansingToNaam(resultaatkolom.herkansing)
                    : null;
            const herkansingInfo = herkansing ? `<div><span style="font-weight: 600">Herkansing: </span>${herkansing}</div>` : '';
            const toetsSoort = resultaatkolom.toetsSoort
                ? `<div><span style="font-weight: 600">Toetssoort: </span>${resultaatkolom.toetsSoort.naam}</div>`
                : '';
            return `${geimporteerdeKolom}${kolomStatus}${toetsSoort}${herkansingInfo}<div><span style="font-weight: 600">Weging voortgangsdossier: </span>${String(
                resultaatkolom.weging
            )}</div><div><span style="font-weight: 600">Omschrijving: </span>${omschrijving}</div>`;
        } else if (isKolomOfType<RapportToetskolom>(resultaatkolom, ResultaatkolomType.RAPPORT_TOETS)) {
            return `<div style="font-weight: 600">Rapporttoets</div><div>Rapportcijfer ${uitPeriode}</div>`;
        }
    }
}
