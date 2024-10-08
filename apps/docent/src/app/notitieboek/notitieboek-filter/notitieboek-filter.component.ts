import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, model, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DeviceService, DropdownComponent, DropdownItem, IconDirective, SettingButtonComponent } from 'harmony';
import { IconFilter, IconZoeken, provideIcons } from 'harmony-icons';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';
import { injectToonSchooljaarSelectie } from '../notitieboek-providers';

@Component({
    selector: 'dt-notitieboek-filter',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SettingButtonComponent, DropdownComponent, IconDirective],
    providers: [provideIcons(IconZoeken, IconFilter)],
    templateUrl: './notitieboek-filter.component.html',
    styleUrl: './notitieboek-filter.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[class.with-schooljaar-selector]': 'schooljaarDropdownItems().length > 0' }
})
export class NotitieboekFilterComponent implements OnInit {
    private deviceService = inject(DeviceService);
    private destroyRef = inject(DestroyRef);
    private toonSchooljaarSelectie = injectToonSchooljaarSelectie();
    private schooljaarDropdown = viewChild(DropdownComponent, { read: DropdownComponent });

    public context = input.required<NotitieboekContext>();
    public filterOptie = model.required<NotitieFilter | undefined>();
    public schooljaar = model.required<number | undefined>();
    public searchValue = model.required<string>();
    public schooljaarOpties = input<number[]>();

    public showGroepsNotitiesFilter = computed(() => !!this.context().lesgroep || !!this.context().stamgroep);
    public filterOpties: () => NotitieFilter[] = computed(() =>
        this.showGroepsNotitiesFilter() ? [...filterOpties] : filterOpties.filter((optie) => optie !== 'Groepsnotities')
    );
    public readonly searchControl = new FormControl('', { nonNullable: true });
    public isDesktop = toSignal(this.deviceService.isDesktop$);
    public schooljaarDropdownItems: () => DropdownItem<number>[] = computed(() => this.createSchooljaarDropdownItems());

    public selectedSchooljaar = computed(() =>
        this.schooljaarDropdownItems().find((sj) => sj.data === getSchooljaar(new Date()).start.getFullYear())
    );

    public selectSchooljaar(schooljaar: number | undefined) {
        if (!schooljaar) return;
        this.schooljaar.set(schooljaar);
    }

    constructor() {
        explicitEffect(
            [this.showGroepsNotitiesFilter],
            ([show]) => {
                if (!show && this.filterOptie() === 'Groepsnotities') {
                    this.filterOptie.set(undefined);
                }
            },
            { allowSignalWrites: true }
        );
    }

    public ngOnInit() {
        this.searchControl.valueChanges
            .pipe(startWith(''), debounceTime(100), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe(this.searchValue.set);

        this.searchValue.subscribe((text) => {
            if (this.searchControl.value === text) return;
            this.searchControl.setValue(text);
        });

        this.searchControl.setValue(this.searchValue());

        this.toonSchooljaarSelectie.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.schooljaarDropdown()?.openOptionsList());
    }

    private createSchooljaarDropdownItems(): DropdownItem<number>[] {
        if (this.schooljaarOpties()) {
            return this.schooljaarOpties()!.map((startYear) => getSchooljaarDropdownItemFromStartYear(startYear));
        }
        const opties = this.context().leerling?.schooljaren?.map((sj) => getSchooljaarDropdownItemFromStartYear(sj)) || [];
        return opties.length > 0 ? opties : [getSchooljaarDropdownItemFromStartYear(getSchooljaar(new Date()).start.getFullYear())];
    }
}

function getSchooljaarDropdownItemFromStartYear(startYear: number): DropdownItem<number> {
    return {
        label: `${startYear}/${startYear + 1}`,
        data: startYear
    };
}

const filterOpties = ['Mijn notities', 'Docenten', 'Groepsnotities', 'Mentor', 'Belangrijk', 'Vastgeprikt', 'Gemarkeerd'] as const;
export type NotitieFilter = (typeof filterOpties)[number];
