import { CommonModule, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, WritableSignal, computed, signal } from '@angular/core';
import { eachDayOfInterval } from 'date-fns';
import { IconInformatie, provideIcons } from 'harmony-icons';
import { filter, flow, identity, map, orderBy, uniqBy } from 'lodash-es';
import { match } from 'ts-pattern';
import { TooltipDirective } from '../directives/tooltip/tooltip.directive';
import { IconDirective } from '../icon/icon.directive';
import { isPresent } from '../operators/is-present.operator';
import { Optional } from '../optional/optional';
import { HeatmapCellComponent } from './heatmap-cell/heatmap-cell.component';
import { HeatmapTijdLabelPipe } from './heatmap-tijd-label.pipe';

/**
 *  Toont een heatmap component van een week. Momenteel is de input gericht op Registraties met een beginDatumTijd en eindDatumTijd property,
 *  maar dit kan in de toekomst aangepast worden naar een dynamische property die je kan meegeven,
 *  zodat het voor elk soort type data met start/eind datum werkt
 */
@Component({
    selector: 'hmy-heatmap',
    standalone: true,
    imports: [CommonModule, SlicePipe, HeatmapCellComponent, TooltipDirective, IconDirective, HeatmapTijdLabelPipe],
    templateUrl: './heatmap.component.html',
    styleUrls: ['./heatmap.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconInformatie)]
})
export class HeatmapComponent<T extends { beginDatumTijd: Date; eindDatumTijd?: Date | null }> {
    public heatmapTijden = [...heatmapTijden, -1] as const;
    public heatmapDagen = ['', ...heatmapDagen] as const;
    @HostBinding('class.geen-data') geenData: boolean;

    _data = signal<T[]>([]);
    @Input({ required: true }) set data(data: T[]) {
        this._data.set(data);
        this.geenData = data.length === 0;
    }

    _tooltipFn: WritableSignal<Optional<TooltipFn<T>>> = signal(null);
    @Input() set tooltipFn(tooltipFn: Optional<(items: T[]) => string>) {
        this._tooltipFn.set(tooltipFn);
    }

    @Input() label: Optional<string>;
    @Input() infoTooltip: Optional<string>;
    @Input() geenDataTekst: Optional<string>;

    heatmap = computed(() => {
        const heatmap = this.createEmptyHeatmap();

        // voeg data toe aan de heatmap
        this._data().forEach((item) => this.addToHeatmap(item, heatmap));

        // voeg sortering toe
        const cells = Object.values(heatmap).flatMap((dag) => Object.values(dag));
        const uniekeHoogsteAantallen: number[] = flow(
            (cells) => map(cells, 'items.length'),
            (cells) => filter(cells, (i) => i !== 0),
            (cells) => orderBy(cells, identity, ['desc']),
            (cells) => uniqBy(cells, identity)
        )(cells);
        cells.forEach((cell) => {
            cell.sortering = uniekeHoogsteAantallen.indexOf(cell.items.length);
        });

        // voeg tooltip toe
        if (this._tooltipFn()) {
            cells
                .filter((cell) => cell.items.length > 0)
                .forEach((cell) => {
                    const cellTijd = `${String(cell.tijd).padStart(2, '0')}:00 - ${String(cell.tijd + 2).padStart(2, '0')}:00`;
                    const tooltipHeader = `<b>${cell.dag.slice(0, 2)} ${cellTijd}</b>`;
                    cell.tooltip = `${tooltipHeader} </br> ${this._tooltipFn()?.(cell.items)}`;
                });
        }

        return heatmap;
    });

    /**
     * We halen voor elk item de dagen op tussen het begin en eind. Deze filteren we zodat we alleen de dagen overhouden
     * die ook daadwerkelijk zichtbaar zijn in de heatmap. Dan checken we per dag binnen welke tijdsblokken de begin en
     * eindtijden vallen.
     */
    private addToHeatmap(item: T, heatmap: Heatmap<T>) {
        eachDayOfInterval({ start: item.beginDatumTijd, end: item.eindDatumTijd ?? new Date() })
            .map(toHeatMapDag)
            .filter(isPresent)
            .map((dag, index, dagen) => {
                const beginUur = item.beginDatumTijd.getHours();
                const eindUur = (item.eindDatumTijd ?? new Date()).getHours();
                const eindigtOpHeleUur = (item.eindDatumTijd ?? new Date()).getMinutes() === 0;

                // wanneer het item op 1 dag valt
                if (dagen.length === 1) {
                    const cells = heatmapTijden.filter((celstart) => {
                        const tijdblokNaofInclStart = celstart + 2 > beginUur;
                        const tijdblokVoorEind = celstart < eindUur;

                        return (tijdblokNaofInclStart && tijdblokVoorEind) || (celstart === eindUur && !eindigtOpHeleUur);
                    });
                    return { dag, cells };
                }
                // wanneer het de begin dag is
                if (index === 0) {
                    const cells = heatmapTijden.filter((celstart) => celstart + 2 > beginUur);
                    return { dag, cells };
                }
                // wanneer het de einddag is
                if (index === dagen.length - 1) {
                    const cells = heatmapTijden.filter((celstart) => celstart < eindUur || (celstart === eindUur && !eindigtOpHeleUur));
                    return { dag, cells };
                }
                // geen start of eind, dus de hele dag.
                return { dag, cells: heatmapTijden };
            })
            .forEach(({ dag, cells }) => {
                cells.forEach((cell) => {
                    heatmap[dag][cell].items.push(item);
                });
            });
    }

    private createEmptyHeatmap(): Heatmap<T> {
        const emptyCell = (dag: HeatMapDag, tijd: HeatMapTijd): HeatmapCell<T> => ({ items: new Array<T>(), sortering: -1, dag, tijd });
        const emptyDag = (dag: HeatMapDag) =>
            heatmapTijden.reduce((kolom, tijd) => ({ ...kolom, [tijd]: emptyCell(dag, tijd) }), {} as HeatmapDag<T>);
        return heatmapDagen.reduce((heatmap, dag) => ({ ...heatmap, [dag]: emptyDag(dag) }), {} as Heatmap<T>);
    }
}

const toHeatMapDag = (date: Date): HeatMapDag | null =>
    match(date.getDay())
        .returnType<HeatMapDag | null>()
        .with(1, () => 'Maandag')
        .with(2, () => 'Dinsdag')
        .with(3, () => 'Woensdag')
        .with(4, () => 'Donderdag')
        .with(5, () => 'Vrijdag')
        .otherwise(() => null);

const heatmapTijden = [7, 9, 11, 13, 15] as const;
type HeatMapTijd = (typeof heatmapTijden)[number];
const heatmapDagen = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'] as const;
type HeatMapDag = (typeof heatmapDagen)[number];

export interface HeatmapCell<T> {
    dag: HeatMapDag;
    tijd: HeatMapTijd;
    items: T[];
    sortering: number;
    tooltip?: Optional<string>;
}

type HeatmapDag<T> = Record<HeatMapTijd, HeatmapCell<T>>;
export type Heatmap<T> = Record<HeatMapDag, HeatmapDag<T>>;
type TooltipFn<T> = (items: T[]) => string;
