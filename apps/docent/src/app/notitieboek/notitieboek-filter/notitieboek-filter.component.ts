import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, model, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DeviceService, DropdownComponent, DropdownItem, IconDirective, SettingButtonComponent } from 'harmony';
import { IconFilter, IconZoeken, provideIcons } from 'harmony-icons';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { NotitieboekContext } from '../../core/models/notitieboek.model';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';

@Component({
    selector: 'dt-notitieboek-filter',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SettingButtonComponent, DropdownComponent, IconDirective],
    providers: [provideIcons(IconZoeken, IconFilter)],
    templateUrl: './notitieboek-filter.component.html',
    styleUrl: './notitieboek-filter.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotitieboekFilterComponent implements OnInit {
    private deviceService = inject(DeviceService);
    private destroyRef = inject(DestroyRef);

    public context = input.required<NotitieboekContext>();
    public filterOptie = model.required<NotitieFilter | undefined>();
    public schooljaar = model.required<number | undefined>();
    public searchValue = model.required<string>();
    public showSchooljaarSelector = input.required<boolean>();

    public readonly filterOpties: NotitieFilter[] = ['Mijn notities', 'Docenten', 'Mentor', 'Belangrijk', 'Vastgeprikt', 'Gemarkeerd'];
    public readonly searchControl = new FormControl('', { nonNullable: true });
    public isDesktop = toSignal(this.deviceService.isDesktop$);
    public schooljaarOpties: () => DropdownItem<number>[] = computed(() => {
        const opties = this.context().leerling?.schooljaren?.map((sj) => getSchooljaarOptieFromStartYear(sj)) || [];
        return opties.length > 0 ? opties : [getSchooljaarOptieFromStartYear(getSchooljaar(new Date()).start.getFullYear())];
    });
    public selectedSchooljaar = computed(() =>
        this.schooljaarOpties().find((sj) => sj.data === getSchooljaar(new Date()).start.getFullYear())
    );

    public selectSchooljaar(schooljaar: number | undefined) {
        if (!schooljaar) return;
        this.schooljaar.set(schooljaar);
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
    }
}

function getSchooljaarOptieFromStartYear(startYear: number): DropdownItem<number> {
    return {
        label: `${startYear}/${startYear + 1}`,
        data: startYear
    };
}

export type NotitieFilter = 'Mijn notities' | 'Docenten' | 'Mentor' | 'Belangrijk' | 'Vastgeprikt' | 'Gemarkeerd';
