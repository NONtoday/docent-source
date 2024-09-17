import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { SignaleringFilterInput } from '@docent/codegen';
import { IconDirective, NumbersOnlyDirective } from 'harmony';
import { IconNoRadio, provideIcons } from 'harmony-icons';
import { BehaviorSubject, Observable, combineLatest, map, of } from 'rxjs';
import { Appearance, PopupDirection, PopupSettings } from '../../core/popup/popup.settings';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { InlineEditComponent } from '../../shared/components/inline-edit/inline-edit.component';
import { MentordashboardDataService } from '../mentordashboard-data.service';

export interface SignaleringPopupFilter {
    column: string;
    value: Optional<number>;
    placeholder: string;
}

export interface SignaleringPopupData {
    iedereenFilters: SignaleringPopupFilter[];
    leerlingFilters: SignaleringPopupFilter[];
}

type Tab = 'leerling' | 'iedereen';

@Component({
    selector: 'dt-signalering-aantal-popup',
    templateUrl: './signalering-aantal-popup.component.html',
    styleUrls: ['./signalering-aantal-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        InlineEditComponent,
        FormsModule,
        ReactiveFormsModule,
        TooltipDirective,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe,
        NumbersOnlyDirective,
        IconDirective
    ],
    providers: [provideIcons(IconNoRadio)]
})
export class SignaleringAantalPopupComponent implements Popup, OnInit {
    private mentordashboardService = inject(MentordashboardDataService);
    private medewerkerDataService = inject(MedewerkerDataService);
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    signaleringPopupData: SignaleringPopupData;
    medewerkerUuid: string;
    leerlingId: string;
    onIngesteld: () => void;

    activeTab$ = new BehaviorSubject<Tab>('leerling');
    activeFilters$: Observable<SignaleringPopupFilter[]>;

    filterForm = new UntypedFormGroup({});

    inlineEditValidators = [Validators.min(0)];
    alleKolommenInEdit = false;

    ngOnInit(): void {
        this.signaleringPopupData.iedereenFilters.forEach((filter) => {
            this.filterForm.addControl(`iedereen-${filter.column}`, new UntypedFormControl(filter.value, Validators.min(0)));
        });
        this.signaleringPopupData.leerlingFilters.forEach((filter) => {
            this.filterForm.addControl(`leerling-${filter.column}`, new UntypedFormControl(filter.value, Validators.min(0)));
        });

        this.activeFilters$ = combineLatest([this.activeTab$, of(this.signaleringPopupData)]).pipe(
            map(([activeTab, popupData]) => (activeTab === 'leerling' ? popupData.leerlingFilters : popupData.iedereenFilters))
        );
    }

    mayClose(): boolean {
        return true;
    }

    resetValue(filter: SignaleringPopupFilter, tab: Tab, event: Event) {
        event.stopPropagation();
        const control = this.filterForm.get(`${tab}-${filter.column}`);
        control!.setValue(null);
        control!.markAsDirty();
    }

    opslaan() {
        const leerlingFilters: SignaleringFilterInput[] = [];
        const filters: SignaleringFilterInput[] = [];

        Object.keys(this.filterForm.controls).forEach((key) => {
            const value = parseInt(this.filterForm.get(key)?.value) || null;
            if (key.startsWith('leerling-')) {
                leerlingFilters.push({
                    kolom: key.substring(9, key.length),
                    value
                });
            } else if (key.startsWith('iedereen-')) {
                filters.push({
                    kolom: key.substring(9, key.length),
                    value
                });
            }
        });

        this.mentordashboardService
            .setSignaleringenFilters(this.medewerkerDataService.medewerkerUuid, {
                filters,
                leerlingFilters: {
                    leerlingId: this.leerlingId,
                    filters: leerlingFilters
                }
            })
            .subscribe(() => {
                this.onIngesteld?.();
                this.popup.onClose();
            });
    }

    annuleer() {
        this.popup.onClose();
    }

    setAlleKolommen(value: string) {
        const activeTab = this.activeTab$.value;
        Object.keys(this.filterForm.controls)
            .filter((key) => key.startsWith(activeTab))
            .forEach((key) => this.filterForm.get(key)!.setValue(value));
        this.filterForm.markAsDirty();
        this.setAlleKolommenInEdit(false);
    }

    setAlleKolommenInEdit(inEdit: boolean) {
        this.alleKolommenInEdit = inEdit;
    }

    switchTab(tab: Tab) {
        if (tab !== this.activeTab$.value) {
            this.activeTab$.next(tab);
            this.alleKolommenInEdit = false;
        }
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();

        popupSettings.width = 356;
        popupSettings.showCloseButton = false;
        popupSettings.showHeader = false;
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        return popupSettings;
    }
}
