import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApolloQueryResult } from '@apollo/client/core';
import { groupBy, orderBy, padStart } from 'lodash-es';
import { Observable, map, startWith } from 'rxjs';
import { P, match } from 'ts-pattern';
import {
    ExamendossierContext,
    KeuzelijstVrijVeldWaardeFieldsFragment,
    LeerlingAfwezigheidsKolom,
    LeerlingExamenCijferOverzicht,
    LeerlingRapportCijferOverzicht,
    MentordashboardOverzichtPeriode,
    MentordashboardOverzichtRegistratieCategorie,
    MentordashboardOverzichtRegistratieKolomCategorie,
    MentordashboardOverzichtRegistratieVrijVeldCategorie,
    MentorleerlingenQuery,
    Registratie,
    RegistratieDetailQuery,
    RegistratiePeriode,
    RegistratiesCijferperiode,
    TotaalRegistraties,
    VrijveldFieldsFragment,
    VrijveldRegistratiesFieldsFragment
} from '../../generated/_types';
import { LeerlingCijferOverzicht } from '../core/models/mentordashboard.model';
import { formatDateNL, getSchooljaar } from '../rooster-shared/utils/date.utils';
import { Optional } from '../rooster-shared/utils/utils';
import { commaResult } from '../shared/pipes/comma-result.pipe';
import { TrendwaardePill } from './groepsoverzicht/groepsoverzicht-resultaten-sidebar/groepsoverzicht-sidebar-vak-resultaat/groepsoverzicht-sidebar-vak-resultaat.component';
import { registratieContent } from './leerlingoverzicht/leerlingoverzicht.model';
import { TotaalRegistratie } from './leerlingregistraties-totalen/leerlingregistraties-totalen.component';

interface VrijVeldRegistratie {
    vrijVeld: VrijveldFieldsFragment;
    keuzelijstWaarde?: Optional<KeuzelijstVrijVeldWaardeFieldsFragment>;
}

export const vrijVeldRegistratieId = (registratie: VrijVeldRegistratie) =>
    registratie.keuzelijstWaarde ? `${registratie.vrijVeld.id}-${registratie.keuzelijstWaarde.id}` : `${registratie.vrijVeld.id}`;

export const invertedVrijVeldNaam = (registratie: {
    vrijVeld: VrijveldFieldsFragment;
    keuzelijstWaarde?: Optional<KeuzelijstVrijVeldWaardeFieldsFragment>;
}): string => {
    const keuzelijstWaarde = registratie.keuzelijstWaarde?.waarde;
    if (keuzelijstWaarde) {
        return `${keuzelijstWaarde} • ${registratie.vrijVeld.naam}`;
    }

    return registratie.vrijVeld.naam;
};

export const vrijVeldNaam = (registratie: {
    vrijVeld: VrijveldFieldsFragment;
    keuzelijstWaarde?: Optional<KeuzelijstVrijVeldWaardeFieldsFragment>;
}): string => {
    const keuzelijstWaarde = registratie.keuzelijstWaarde?.waarde;
    if (keuzelijstWaarde) {
        return `${registratie.vrijVeld.naam} • ${keuzelijstWaarde}`;
    }

    return registratie.vrijVeld.naam;
};

const vasteKolommenPattern = P.union(
    LeerlingAfwezigheidsKolom.GEOORLOOFD_AFWEZIG,
    LeerlingAfwezigheidsKolom.ONGEOORLOOFD_AFWEZIG,
    LeerlingAfwezigheidsKolom.TE_LAAT,
    LeerlingAfwezigheidsKolom.VERWIJDERD,
    LeerlingAfwezigheidsKolom.HUISWERK_NIET_IN_ORDE,
    LeerlingAfwezigheidsKolom.MATERIAAL_NIET_IN_ORDE
);

export const vrijveldRegistratiesCategorieId = (
    registratie: Pick<VrijveldRegistratiesFieldsFragment, 'vrijVeld' | 'keuzelijstWaarde'>
): string =>
    match(registratie)
        .with(
            { vrijVeld: { naam: registratieContent['HUISWERK_NIET_IN_ORDE'].naam } },
            () => LeerlingAfwezigheidsKolom.HUISWERK_NIET_IN_ORDE
        )
        .with(
            { vrijVeld: { naam: registratieContent['MATERIAAL_NIET_IN_ORDE'].naam } },
            () => LeerlingAfwezigheidsKolom.MATERIAAL_NIET_IN_ORDE
        )
        .with({ vrijVeld: P.not(P.nullish) }, vrijVeldRegistratieId)
        .exhaustive();

export const totaalRegistratiesCategorieId = (registratie: TotaalRegistraties): string =>
    match(registratie)
        .with({ kolom: vasteKolommenPattern }, (reg) => reg.kolom)
        .with({ kolom: LeerlingAfwezigheidsKolom.VRIJ_VELD, vrijVeld: P.not(P.nullish) }, vrijVeldRegistratieId)
        .with({ kolom: LeerlingAfwezigheidsKolom.VRIJ_VELD }, () => {
            throw new Error('Ongeldig vrijveld kolom zonder vrijveld object');
        })
        .exhaustive();

export const totaalRegistratiesCategorieNaam = (registratie: TotaalRegistratie): string =>
    match(registratie)
        .with({ kolom: vasteKolommenPattern }, (reg) => registratieContent[reg.kolom].naam)
        .with({ kolom: LeerlingAfwezigheidsKolom.VRIJ_VELD, vrijVeld: P.not(P.nullish) }, vrijVeldNaam)
        .with({ kolom: LeerlingAfwezigheidsKolom.VRIJ_VELD }, () => {
            throw new Error('Ongeldig vrijveld kolom zonder vrijveld object');
        })
        .exhaustive();

export const mentordashboardOverzichtRegistratieCategorieId = (categorie: MentordashboardOverzichtRegistratieCategorie) =>
    isKolomCategorie(categorie) ? categorie.kolom : vrijveldRegistratiesCategorieId(categorie);
export const mentordashboardOverzichtRegistratieCategorieNaam = (categorie: MentordashboardOverzichtRegistratieCategorie) =>
    isKolomCategorie(categorie) ? registratieContent[categorie.kolom].naam : vrijVeldNaam(categorie);

export const isKolomCategorie = (
    categorie: MentordashboardOverzichtRegistratieCategorie
): categorie is MentordashboardOverzichtRegistratieKolomCategorie => !!(<MentordashboardOverzichtRegistratieKolomCategorie>categorie).kolom;

export const isVrijveldCategorie = (
    categorie: MentordashboardOverzichtRegistratieCategorie
): categorie is MentordashboardOverzichtRegistratieVrijVeldCategorie =>
    !!(<MentordashboardOverzichtRegistratieVrijVeldCategorie>categorie).vrijVeld;

export const alleMentorLeerlingen = (queryResult: MentorleerlingenQuery['mentorleerlingen']) => [
    ...queryResult.individueleMentorleerlingen.map((individueleMentorleerling) => individueleMentorleerling.leerling),
    ...queryResult.stamgroepMentorleerlingen.map((stamgroepMentorleerlingen) => stamgroepMentorleerlingen.mentorleerlingen).flat()
];

export const alleMentorLeerlingenMetStamgroep = (queryResult: MentorleerlingenQuery['mentorleerlingen']) => [
    ...queryResult.individueleMentorleerlingen.map((indivLeerling) => ({ ...indivLeerling, isIndividueel: true })),
    ...queryResult.stamgroepMentorleerlingen
        .map((stamgroepMentorleerlingen) =>
            stamgroepMentorleerlingen.mentorleerlingen.map((mentorleerling) => ({
                leerling: mentorleerling,
                stamgroep: stamgroepMentorleerlingen.stamgroep,
                isIndividueel: false
            }))
        )
        .flat()
];

export const rapportCijferKolomToResultatenKolom = (rapportCijferOverzicht: LeerlingRapportCijferOverzicht): LeerlingCijferOverzicht => ({
    leerling: rapportCijferOverzicht.leerling,
    cijferbalken: [{ label: null, cijfers: rapportCijferOverzicht.rapportCijfers }],
    totaalgemiddelde: rapportCijferOverzicht.totaalgemiddelde,
    totaalgemiddeldeTooltip: 'Indicatief gemiddelde over alle recente rapportcijfers per vak',
    trendindicatie: rapportCijferOverzicht.trendindicatie,
    aantalResultatenVoorTrendindicatie: rapportCijferOverzicht.aantalResultatenVoorTrendindicatie
});

export const rapportExamenCijferKolomToResultatenKolom = (
    rapportCijferOverzicht: LeerlingExamenCijferOverzicht
): LeerlingCijferOverzicht => ({
    leerling: rapportCijferOverzicht.leerling,
    cijferbalken: [
        { label: 'SE', cijfers: rapportCijferOverzicht.seCijfers },
        { label: 'CE', cijfers: rapportCijferOverzicht.ceCijfers },
        { label: 'Eind', cijfers: rapportCijferOverzicht.eindCijfers }
    ].filter((balk) => balk.cijfers.length > 0),
    totaalgemiddelde:
        rapportCijferOverzicht.eindCijfers.length > 0
            ? rapportCijferOverzicht.totaalgemiddeldeEind
            : rapportCijferOverzicht.totaalgemiddeldeSe,
    totaalgemiddeldeTooltip:
        rapportCijferOverzicht.eindCijfers.length > 0
            ? 'Indicatief gemiddelde over alle recente eindcijfers per vak'
            : 'Indicatief gemiddelde over alle recente SE cijfers per vak',
    trendindicatie: rapportCijferOverzicht.trendindicatie,
    aantalResultatenVoorTrendindicatie: rapportCijferOverzicht.aantalResultatenVoorTrendindicatie
});

export const registratiePeriodeTooltip = ({ vanaf, tot, nummer }: Pick<RegistratiePeriode, 'vanaf' | 'tot' | 'nummer'>) =>
    vanaf && tot
        ? `<span>
            <span class="text-content-semi">Cijferperiode</span><br>
        ${formatDateNL(vanaf, 'dagnummer_maand_kort')} tot ${formatDateNL(tot, 'dagnummer_maand_kort')}</span>
        </span>`
        : `<span>
            <span class="text-content-semi">Cijferperiode</span><br>
            Geen data ingesteld voor periode ${nummer}
        </span>`;

export const registratieDetailTooltip = (
    detail: RegistratieDetailQuery['registratieDetail'],
    kolom: string,
    periodeNummer: number,
    vakNaam: string
) => {
    if (kolom === 'Geoorloofd afwezig' || kolom === 'Ongeoorloofd afwezig') {
        return afwezigTooltip(kolom, detail, periodeNummer, vakNaam);
    }

    return overigTooltip(kolom, detail, periodeNummer, vakNaam);
};

const overigTooltip = (kolom: string, detail: RegistratieDetailQuery['registratieDetail'], periodeNummer: number, vakNaam: string) => `
<div class="text-small-content">
    ${kolomRegel(kolom)}
    ${lesurenRegel(detail.aantal, detail.aantalLessen)}
    ${aantalToetsmomentenRegel(detail.aantalToetsmomenten)}
    ${rapportCijferRegel(detail.rapportCijfer)}
    ${vakPeriodeRegel(vakNaam, periodeNummer)}
</div>
`;

const afwezigTooltip = (kolom: string, detail: RegistratieDetailQuery['registratieDetail'], periodeNummer: number, vakNaam: string) => `
<div class="text-small-content">
    ${kolomRegel(kolom)}
    ${lesurenRegel(detail.aantal, detail.aantalLessen)}
    ${duurRegel(detail.totaalMinuten)}
    ${aantalKeerZiekRegel(detail.aantalZiek)}
    ${aantalToetsmomentenRegel(detail.aantalToetsmomenten)}
    ${rapportCijferRegel(detail.rapportCijfer)}
    ${vakPeriodeRegel(vakNaam, periodeNummer)}
</div>
`;

export const loaderTooltip = `<span style="width: 100px; height: 48px; display: block; text-align: center">
<img style="width:20px; height:48px;" src="/assets/img/spinner-docent.svg">
</span>`;

export const registratieHeatmapTooltip = (items: Registratie[]): string => {
    return orderBy(
        Object.entries(groupBy(items, (item) => item.absentieReden ?? 'Onbekende reden')),
        ([, registraties]) => registraties.length,
        ['desc']
    )
        .map(([key, value]) => `<b>${value.length}x • </b> ${key}`)
        .join('</br>');
};

export const formatPercentage = (aantal: number, totaal: number) => {
    if (aantal === 0) return 0;

    return Math.round(100 / (totaal / aantal));
};

const lesurenRegel = (aantal: number, totaal: number) => {
    const percentageLesuren = formatPercentage(aantal, totaal);
    return `<span class="text-small-content-semi">${aantal}/${totaal}</span> lesuren • ${percentageLesuren}%<br>`;
};

export const formatMinutenAlsUren = (minuten: Optional<number>) => {
    if (!minuten) return '';
    const uren = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    return `${padStart(String(uren ?? 0), 2, '0')}:${padStart(String(restMinuten ?? 0), 2, '0')}`;
};

const duurRegel = (minuten: Optional<number>) => {
    if (!minuten) return '';

    const formattedUren = formatMinutenAlsUren(minuten);
    return `<span class="text-small-content-semi">${formattedUren} uur</span> totaal<br>`;
};

const kolomRegel = (kolom: string) => `<span class="text-small-content-semi">${kolom}</span><br>`;
const aantalKeerZiekRegel = (aantal: Optional<number>) =>
    aantal ? `<span class="text-small-content-semi">${aantal}x</span> ziek<br>` : '';
const aantalToetsmomentenRegel = (aantal: number) => `${divider}<span class="text-small-content-semi">${aantal}x</span> op toetsmoment<br>`;
const vakPeriodeRegel = (naam: string, periodeNummer: number) =>
    `${divider}<span class="text-small-content-semi">${naam} • periode ${periodeNummer}</span><br>`;
const rapportCijferRegel = (cijfer: string) =>
    !!cijfer && cijfer !== '-'
        ? `${divider}<span class="text-small-content-semi">${cijfer}</span> • Rapportcijfer<br>`
        : `${divider}Geen rapportcijfer<br>`;
const divider = `<br><span style="border-bottom: 1px solid #627186; display: block; margin: -10px 0px"></span><br>`;

export const createTrendwaardePill = (
    trend: Optional<number>,
    aantalResultaten: number,
    vaknaam: string,
    examen?: Optional<boolean>
): TrendwaardePill => {
    const meervoud = aantalResultaten > 1;

    if (trend === undefined || trend === null) {
        return {
            text: '-',
            icon: undefined,
            color: 'neutral',
            tooltip: `Geen trendwaarde beschikbaar voor ${vaknaam}`
        };
    } else if (trend > 0.0) {
        return {
            text: `${commaResult(trend)}`,
            icon: 'trendBoven',
            color: 'positive',
            tooltip:
                (meervoud
                    ? `Scoorde laatste ${aantalResultaten} ${examen ? 'SE-' : ''}resultaten `
                    : `Scoorde het laatste ${examen ? 'SE-' : ''}resultaat `) +
                `<b>${trend.toFixed(1)} hoger</b> dan gemiddeld voor ${vaknaam} ${examen ? '' : 'dit schooljaar'}`
        };
    } else if (trend < 0.0) {
        return {
            text: `${commaResult(Math.abs(trend))}`,
            icon: 'trendBeneden',
            color: 'negative',
            tooltip:
                (meervoud
                    ? `Scoorde laatste ${aantalResultaten} ${examen ? 'SE-' : ''}resultaten `
                    : `Scoorde het laatste ${examen ? 'SE-' : ''}resultaat `) +
                `<b>${Math.abs(trend).toFixed(1)} lager</b> dan gemiddeld voor ${vaknaam} ${examen ? '' : 'dit schooljaar'}`
        };
    } else {
        return {
            text: '0,0',
            icon: undefined,
            color: 'neutral',
            tooltip: meervoud
                ? `De laatste ${aantalResultaten} ${examen ? 'SE-' : ''}resultaten voor ${vaknaam} zijn gemiddeld gelijk gebleven`
                : `Het laatste ${examen ? 'SE-' : ''}resultaat voor ${vaknaam} is gelijk gebleven`
        };
    }
};

const periodeDateRange = (vanafDatum: Date, totDatum: Date): string =>
    `${formatDateNL(vanafDatum, 'dagnummer_maand_kort')} - ${formatDateNL(totDatum, 'dagnummer_maand_kort')}`;

export const periodeText = (
    periode: MentordashboardOverzichtPeriode,
    vanafDatum: Date,
    totDatum: Date,
    cijferperiode: Optional<RegistratiesCijferperiode>
) =>
    match(periode)
        .with(MentordashboardOverzichtPeriode.ZEVEN_DAGEN, () => periodeDateRange(vanafDatum, totDatum))
        .with(MentordashboardOverzichtPeriode.DERTIG_DAGEN, () => periodeDateRange(vanafDatum, totDatum))
        // als we een cijferperiode verwachten, maar er is er geen aanwezig: gebruik een lege string
        .with(MentordashboardOverzichtPeriode.CIJFERPERIODE, () => cijferperiode?.naam || '')
        .with(MentordashboardOverzichtPeriode.SCHOOLJAAR, () => {
            const { start, eind } = getSchooljaar(new Date());
            return `${start.getFullYear()} - ${eind.getFullYear()}`;
        })
        .exhaustive();

export const examenDossierContextId = (context: ExamendossierContext) =>
    context.lichtingId ? `${context.plaatsingId}-${context.lichtingId}` : context.plaatsingId;

// functies voor tabs groepsoverzicht en leerlingoverzicht

export const getResultatentab = (
    heeftVoortgangsdossierInzienRecht: boolean,
    examendossierBeschikbaar: boolean,
    resultatentabQueryParam: Optional<Resultatensoort>,
    localstorageResultatenTabKey: LocalstorageResultatenTabKey
): Resultatensoort => {
    const selectedTab = resultatentabQueryParam ?? (localStorage.getItem(localstorageResultatenTabKey) as Resultatensoort);
    return isTabValid(selectedTab, heeftVoortgangsdossierInzienRecht, examendossierBeschikbaar)
        ? selectedTab
        : getDefaultTab(heeftVoortgangsdossierInzienRecht);
};

export const isTabValid = (
    selectedTab: Optional<Resultatensoort>,
    heeftVoortgangsdossierInzienRecht: boolean,
    examendossierBeschikbaar: boolean
): boolean => {
    if (!selectedTab) {
        return false;
    }
    return (selectedTab == 'resultaten' && heeftVoortgangsdossierInzienRecht) || (selectedTab == 'examens' && examendossierBeschikbaar);
};

export const getDefaultTab = (heeftVoortgangsdossierInzienRecht: boolean): Resultatensoort =>
    heeftVoortgangsdossierInzienRecht ? 'resultaten' : 'examens';

export const getBeschikbareTabs = (heeftVoortgangsdossierInzienRecht: boolean, examendossierBeschikbaar: boolean): Resultatensoort[] => {
    const beschikbareTabs: Resultatensoort[] = [];
    if (heeftVoortgangsdossierInzienRecht) {
        beschikbareTabs.push('resultaten');
    }
    if (examendossierBeschikbaar) {
        beschikbareTabs.push('examens');
    }
    return beschikbareTabs;
};

export type Resultatensoort = 'resultaten' | 'examens';

export type LocalstorageResultatenTabKey = 'groepsoverzicht-resultatentab' | 'leerlingoverzicht-resultatentab';

export function apolloToSignal<T, Q extends keyof T, U>(
    query: Observable<ApolloQueryResult<T>>,
    queryName: Q,
    initialValue: U
): Signal<ApolloQueryResult<T[Q]> | ApolloQueryResult<U>> {
    return toSignal(
        query.pipe(
            map((result) => ({
                ...result,
                data: result.data[queryName]
            })),
            startWith({ data: initialValue, loading: true, errors: undefined, networkStatus: 1 })
        ),
        { requireSync: true }
    );
}
