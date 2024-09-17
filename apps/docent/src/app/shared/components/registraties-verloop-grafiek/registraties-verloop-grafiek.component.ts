import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, effect, input } from '@angular/core';
import { HuiswerkType, Registratie } from '@docent/codegen';
import { eachDayOfInterval, eachWeekOfInterval, endOfDay, endOfWeek, isAfter, isBefore, isSameDay, startOfWeek } from 'date-fns';
import { HorizontalScrollButtonsDirective, IconDirective, TooltipDirective } from 'harmony';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { groupBy, partition } from 'lodash-es';
import { formatDateNL } from '../../../rooster-shared/utils/date.utils';
import { isPresent } from '../../../rooster-shared/utils/utils';
import { RegistratieVerloopWeek, RegistratiesVerloopWeekComponent } from './registraties-verloop-week/registraties-verloop-week.component';

@Component({
    selector: 'dt-registraties-verloop-grafiek',
    standalone: true,
    imports: [CommonModule, RegistratiesVerloopWeekComponent, TooltipDirective, IconDirective, HorizontalScrollButtonsDirective],
    templateUrl: './registraties-verloop-grafiek.component.html',
    styleUrl: './registraties-verloop-grafiek.component.scss',
    providers: [provideIcons(IconInformatie)],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistratiesVerloopGrafiekComponent {
    @ViewChild('scrollElement', { read: ElementRef }) scrollElement: ElementRef;

    beginDatum = input.required<Date>();
    eindDatum = input.required<Date>();
    registraties = input.required<Registratie[]>();

    grafiekModel = computed<RegistratieVerloopWeek[]>(() =>
        this.wekenVanDePeriode(this.beginDatum(), this.eindDatum())
            .map((week) => ({
                week,
                dagenMetRegistraties: this.dagenVanDeWeek(week)
                    .filter((dag) => {
                        const beginBinnenPeriode = isSameDay(dag, this.beginDatum()) || isAfter(dag, this.beginDatum());
                        const eindBinnenPeriode = isSameDay(dag, this.eindDatum()) || isBefore(dag, this.eindDatum());
                        const voorVandaagOfVandaag = isBefore(dag, endOfDay(new Date()));

                        return beginBinnenPeriode && eindBinnenPeriode && voorVandaagOfVandaag;
                    })
                    .map((dag) => {
                        const registraties = this.registraties().filter((registratie) => isSameDay(registratie.beginDatumTijd, dag));

                        return {
                            datum: dag,
                            registraties,
                            tooltip: this.createDagTooltip(dag, registraties)
                        };
                    })
            }))
            .filter((week) => week.dagenMetRegistraties.length > 0)
    );

    wekenVanDePeriode = (begin: Date, eind: Date) => eachWeekOfInterval({ start: begin, end: eind }, { weekStartsOn: 1 });
    dagenVanDeWeek = (week: Date) =>
        eachDayOfInterval({
            start: startOfWeek(week, { weekStartsOn: 1 }),
            end: endOfWeek(week, { weekStartsOn: 1 })
        });

    createDagTooltip = (datum: Date, registraties: Registratie[]) => `
        <b>${formatDateNL(datum, 'dag_kort_dagnummer_maand_kort')}</b></br>
        ${this.tooltipRegistratieRedenen(registraties)}
        ${this.tooltipToetsen(registraties)}
    `;

    tooltipRegistratieRedenen(registraties: Registratie[]) {
        const registratiesGesplitst: [metReden: Registratie[], zonderReden: Registratie[]] = partition(registraties, (registratie) =>
            isPresent(registratie.absentieReden)
        );

        const metRedenTooltip =
            registratiesGesplitst[0].length > 0
                ? Object.entries(groupBy(registratiesGesplitst[0], (registratie) => registratie.absentieReden))
                      .map(([key, value]) => `<b>${value.length}x</b> ${key}`)
                      .join(' <br> ')
                : '';
        const zonderRedenTooltip = registratiesGesplitst[1].length > 0 ? `<b>${registratiesGesplitst[1].length}x</b> Onbekende reden` : '';

        return `${metRedenTooltip} ${metRedenTooltip ? '<br>' : ''} ${zonderRedenTooltip}`;
    }

    tooltipToetsen(registraties: Registratie[]) {
        const aantalRoosterToetsen = registraties.filter((registratie) => registratie.roosterToets).length;
        const aantalToetsen = registraties.filter((registratie) => registratie.toetsmoment === HuiswerkType.TOETS).length;
        const aantalGroteToetsen = registraties.filter((registratie) => registratie.toetsmoment === HuiswerkType.GROTE_TOETS).length;

        if (aantalGroteToetsen === 0 && aantalToetsen === 0 && aantalRoosterToetsen === 0) return '';

        return `<hr style="border: none; border-top: 1px dotted black;">
                ${aantalRoosterToetsen > 0 ? '<b>' + aantalRoosterToetsen + 'x</b> roostertoets <br>' : ''}
                ${aantalToetsen > 0 ? '<b>' + aantalToetsen + 'x</b> toets <br>' : ''}
                ${aantalGroteToetsen > 0 ? '<b>' + aantalGroteToetsen + 'x</b> grote toets' : ''}
        `;
    }

    constructor() {
        effect(() => {
            if (this.registraties().length > 0) {
                this.scrollElement?.nativeElement.scrollTo({ left: this.scrollElement.nativeElement.scrollWidth });
            }
        });
    }
}
