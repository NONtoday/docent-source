import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Leerling, MentorleerlingenQuery, PartialLeerlingFragment, Stamgroep } from '@docent/codegen';
import { CheckboxComponent } from 'harmony';
import { IconGroep, provideIcons } from 'harmony-icons';
import { identity } from 'lodash-es';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QueriedWerkdrukDifferentiatiegroep, QueriedWerkdrukLesgroepen } from '../../../../core/models/werkdruk.model';
import { Appearance, HorizontalOffset, PopupDirection, PopupSettings } from '../../../../core/popup/popup.settings';
import { TooltipDirective } from '../../../directives/tooltip.directive';
import { PersonenNamenPipe } from '../../../pipes/personen-namen.pipe';
import { VolledigeNaamPipe } from '../../../pipes/volledige-naam.pipe';
import { Optional, equalsId, sortLocale, sortLocaleNested, toId } from '../../../utils/utils';
import { AvatarComponent } from '../../avatar/avatar.component';
import { BackgroundIconComponent } from '../../background-icon/background-icon.component';
import { KleurKeuzeComponent } from '../../kleur-keuze/kleur-keuze.component';
import { Popup, PopupComponent } from '../../popup/popup.component';

export interface WerkdrukFilterGroep {
    id: string;
    naam: string;
    color?: string;
    leerlingen: PartialLeerlingFragment[];
    differentiatieGroepen: QueriedWerkdrukDifferentiatiegroep[];
}

export interface WerkdrukFilterOptie {
    type: 'lesgroep' | 'stamgroep' | 'differentiatiegroep' | 'leerling';
    selected: boolean;
    id: string;
    parent?: string;
    allSelected?: boolean;
}

export interface LeerlingStamgroep {
    leerling: PartialLeerlingFragment;
    stamgroep: Stamgroep;
}

/**
 *  In dit component kan je individuele mentorleerlingen en stamgroepmentorleerlingen OF
 *  hele lesgroepen, losse leerlingen of differentiatiegroepen. Wanneer je een lesgroep of diffGroep selecteerd
 *  dan worden die leerlingen verborgen.
 *
 *  Er wordt een object gemaakt die de formState bijhoud, dit is een object met het id van groep, leerling of differentiegroep als key
 *  en een WerkdrukFilterOptie als value. Wanneer er iets wijzigt in het formulier, dan wordt er een nieuwe state opgebouwd
 *  (in de subscribe van van de formgroup.valueChanges).
 */
@Component({
    selector: 'dt-werkdruk-filter-popup',
    templateUrl: './werkdruk-filter-popup.component.html',
    styleUrls: ['./werkdruk-filter-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        FormsModule,
        ReactiveFormsModule,
        BackgroundIconComponent,
        AvatarComponent,
        KleurKeuzeComponent,
        TooltipDirective,
        PersonenNamenPipe,
        VolledigeNaamPipe,
        CheckboxComponent
    ],
    providers: [provideIcons(IconGroep)]
})
export class WerkdrukFilterPopupComponent implements OnInit, Popup, OnDestroy {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    @Input() lesgroepen: Optional<QueriedWerkdrukLesgroepen>;
    @Input() mentorLeerlingen: Optional<MentorleerlingenQuery['mentorleerlingen']>;

    @Input() initialSelectedLesgroepen: QueriedWerkdrukLesgroepen = [];
    @Input() initialSelectedLeerlingen: PartialLeerlingFragment[] = [];
    @Input() initialSelectedDifferentiatiegroepen: QueriedWerkdrukDifferentiatiegroep[] = [];
    @Input() toonAlleenLesgroepen = false;

    public sortedGroepen: WerkdrukFilterGroep[] = [];
    public selectedLeerlingen: LeerlingStamgroep[] = [];
    public unselectedIndividueleLeerlingen: LeerlingStamgroep[] = [];

    public onFilterOpslaan: (groepIds: string[], leerlingIds: string[], differentiatiegroep: string[]) => void;
    public filterExists = false;
    public selectedDiffGroepLeerlingIds: string[] = [];

    public formGroup: UntypedFormGroup;
    public formState: Record<string, WerkdrukFilterOptie> = {};

    public onDestroy$ = new Subject<void>();

    ngOnInit(): void {
        this.formGroup = new UntypedFormGroup({});
        const selectedLesgroepIds = this.initialSelectedLesgroepen.map((lesgroep) => lesgroep.lesgroep.id);
        const selectedLeerlingIds = this.initialSelectedLeerlingen.map(toId);
        const selectedDifferentiatiegroepenIds = this.initialSelectedDifferentiatiegroepen?.map(toId) ?? [];
        this.filterExists = selectedLesgroepIds.length > 0 || selectedLeerlingIds.length > 0 || selectedDifferentiatiegroepenIds.length > 0;

        // omdat we zowel lesgroepen als stamgroepen kunnen hebben, mappen we de groepen eerst naar een generiekere WerkdrukFilterGroep
        if (this.mentorLeerlingen) {
            const sortedGroepen: WerkdrukFilterGroep[] = [];
            const selectedLeerlingen: LeerlingStamgroep[] = [];

            this.mentorLeerlingen.stamgroepMentorleerlingen.forEach(({ stamgroep, mentorleerlingen }) => {
                const leerlingenByStatus = this.getLeerlingenBySelectedStatus(mentorleerlingen, selectedLeerlingIds);
                const selectedGroepLeerlingen = sortLocale(leerlingenByStatus.selected as Leerling[], ['achternaam', 'voornaam']).map(
                    (leerling) => ({ leerling, stamgroep })
                );
                selectedLeerlingen.push(...selectedGroepLeerlingen);

                const groep = {
                    id: stamgroep.id,
                    naam: stamgroep.naam,
                    leerlingen: sortLocale(leerlingenByStatus.unselected as Leerling[], ['achternaam', 'voornaam']),
                    differentiatieGroepen: <QueriedWerkdrukDifferentiatiegroep[]>[]
                };
                if (groep.leerlingen.length > 0) {
                    sortedGroepen.push(groep as WerkdrukFilterGroep);
                }
            });

            // zet elke geselecteerde mentorleerling in het formState object
            selectedLeerlingen.forEach((selectedLeerling) => {
                const leerling = selectedLeerling.leerling;
                this.formState[leerling.id] = {
                    type: 'leerling',
                    selected: selectedLeerlingIds.includes(leerling.id),
                    id: leerling.id
                };
            });

            // zet elke individuele mentorleerling in het formState object
            const individueleMentorleerlingen: LeerlingStamgroep[] = [];
            sortLocaleNested(this.mentorLeerlingen.individueleMentorleerlingen, (indMentorLeerling) => indMentorLeerling.leerling, [
                'achternaam',
                'voornaam'
            ]).forEach((individueleMentorLeerling) => {
                const leerling = individueleMentorLeerling.leerling;
                const selected = selectedLeerlingIds.includes(leerling.id);
                this.formState[leerling.id] = {
                    type: 'leerling',
                    selected,
                    id: leerling.id
                };
                const arrayToPush = selected ? selectedLeerlingen : individueleMentorleerlingen;
                arrayToPush.push({ leerling, stamgroep: individueleMentorLeerling.stamgroep! });
            });

            this.sortedGroepen = sortedGroepen;
            this.selectedLeerlingen = selectedLeerlingen;
            this.unselectedIndividueleLeerlingen = individueleMentorleerlingen;
        } else {
            this.sortedGroepen =
                (this.lesgroepen?.map((lesgroep) => ({
                    id: lesgroep.lesgroep.id,
                    naam: lesgroep.lesgroep.naam,
                    leerlingen: sortLocale(lesgroep.leerlingen, ['achternaam', 'voornaam']),
                    differentiatieGroepen: lesgroep.differentiatiegroepen,
                    color: lesgroep.lesgroep.color
                })) as WerkdrukFilterGroep[]) ?? [];
        }

        this.sortedGroepen.forEach((groep) => {
            // zet elke leerling in het formState object
            groep.leerlingen.forEach((leerling) => {
                this.formState[leerling.id] = {
                    type: 'leerling',
                    id: leerling.id,
                    selected: selectedLeerlingIds.includes(leerling.id),
                    parent: groep.id
                };
            });

            // zet elke differentiatiegroep in het formState object
            groep.differentiatieGroepen.forEach((diffGroep) => {
                this.formState[diffGroep.id] = {
                    type: 'differentiatiegroep',
                    id: diffGroep.id,
                    selected: selectedDifferentiatiegroepenIds.includes(diffGroep.id),
                    parent: groep.id
                };
            });

            // zet de lesgroep in het formState object
            this.formState[groep.id] = {
                type: 'lesgroep',
                selected: selectedLesgroepIds.includes(groep.id),
                id: groep.id
            };
        });

        // voor elke optie maken we een formcontrol aan
        Object.values(this.formState).forEach((optie) => this.formGroup.addControl(optie.id, new UntypedFormControl(optie.selected)));
        // verberg alle leerlingen uit geselecteerde differentiatiegroepen
        this.selectedDiffGroepLeerlingIds = this.getLeerlingIdsInSelectedDifferentiatiegroepen();

        // Wanneer er iets wijzigt in het formulier, bouwen we opnieuw de formState op
        this.formGroup.valueChanges.pipe(takeUntil(this.onDestroy$)).subscribe((value: Record<string, boolean>) => {
            // eerst selecteren/deselecteren we dezelfde dingen als in het formulier
            Object.entries(value).forEach(([key, value]) => {
                this.formState[key].selected = value;
            });

            // we houden een array van ids bij van alle leerlingen die in een geselecteerde differentiatiegroep zitten,
            // zodat we weten of we de leerling moeten tonen ofniet.
            this.selectedDiffGroepLeerlingIds = this.getLeerlingIdsInSelectedDifferentiatiegroepen();

            // We setten de property 'allSelected' bij elke lesgroep, zodat we weten of we Selecteren of Deselecteren moeten tonen
            Object.values(this.formState)
                .filter((optie) => optie.type === 'lesgroep')
                .forEach(
                    (lesgroep) =>
                        (lesgroep.allSelected = Object.values(this.formState)
                            .filter((optie) => optie.parent === lesgroep.id)
                            .every((optie) => optie.selected))
                );
        });
    }

    selectAllOrNone(groepId: string, leerlingen: PartialLeerlingFragment[], differentiatiegroepen: QueriedWerkdrukDifferentiatiegroep[]) {
        const newValue = !this.formState[groepId].allSelected;

        // maak een object met het leerling of diffGroep id als key en de nieuwe waarde als value, zodat we patchValue kunnen gebruiken
        // zodat de valueChanges van het form maar 1 keer afgaat ipv voor elke leerling of diffGroep die we (de)selecteren
        const diffGroepFormState = differentiatiegroepen.map(toId).reduce((acc, id) => ({ ...acc, [id]: newValue }), {});
        const leerlingenFormState = leerlingen.map(toId).reduce((acc, id) => ({ ...acc, [id]: newValue }), {});

        this.formGroup.patchValue({
            ...diffGroepFormState,
            ...leerlingenFormState
        });
        this.formGroup.markAsDirty();
    }

    verwijderFilter(event: Event) {
        event.stopPropagation();
        this.deselectedAll();
        this.emitSelection();
    }

    emitSelection() {
        const selectedLesgroepLeerlingIds = this.selectedLesgroepenIds.flatMap(
            (lesgroepId) => this.sortedGroepen?.find(equalsId(lesgroepId))?.leerlingen.map(toId) ?? []
        );

        // leerlingen die geselecteerd zijn, maar ook in een geselecteerde lesgroep zitten nemen we niet mee.
        const leerlingIds = this.selectedLeerlingenIds.filter((leerlingId) => !selectedLesgroepLeerlingIds.includes(leerlingId));
        this.onFilterOpslaan(this.selectedLesgroepenIds, leerlingIds, this.selectedDifferentiatiegroepenIds);
        this.popup.onClose();
    }

    getLeerlingIdsInSelectedDifferentiatiegroepen(): string[] {
        return this.selectedDifferentiatiegroepenIds.flatMap((selectedDifGroepId) =>
            this.sortedGroepen
                .map((lesgroep) => lesgroep.differentiatieGroepen.find((diffGroep) => diffGroep.id === selectedDifGroepId))
                .filter(identity)
                .flatMap((diffGroep) => diffGroep?.leerlingen?.map(toId) ?? [])
        );
    }

    private deselectedAll() {
        Object.values(this.formState).forEach((optie) => (optie.selected = false));
    }

    private get selectedLeerlingenIds(): string[] {
        return Object.values(this.formState)
            .filter((optie) => optie.type === 'leerling' && optie.selected)
            .map(toId);
    }

    private get selectedLesgroepenIds(): string[] {
        return Object.values(this.formState)
            .filter((optie) => optie.type === 'lesgroep' && optie.selected)
            .map(toId);
    }

    private get selectedDifferentiatiegroepenIds(): string[] {
        return Object.values(this.formState)
            .filter((optie) => optie.type === 'differentiatiegroep' && optie.selected)
            .map(toId);
    }

    private getLeerlingenBySelectedStatus(leerlingen: PartialLeerlingFragment[], selectedLeerlingIds: string[]) {
        const selectedLeerlingen: PartialLeerlingFragment[] = [];
        const unselectedLeerlingen: PartialLeerlingFragment[] = [];
        leerlingen.forEach((leerling) => {
            const arrayToPush = selectedLeerlingIds.includes(leerling.id) ? selectedLeerlingen : unselectedLeerlingen;
            arrayToPush.push(leerling);
        });
        return {
            selected: selectedLeerlingen,
            unselected: unselectedLeerlingen
        };
    }

    mayClose(): boolean {
        return true;
    }

    public static get defaultPopupSettings() {
        const popupSettings = new PopupSettings();
        popupSettings.showHeader = false;
        popupSettings.appearance = {
            mobile: Appearance.Rollup,
            tabletportrait: Appearance.Rollup,
            tablet: Appearance.Popout,
            desktop: Appearance.Popout
        };
        popupSettings.preferedDirection = [PopupDirection.Bottom];
        popupSettings.horizontalOffset = HorizontalOffset.Right;
        popupSettings.offsets = { ...popupSettings.offsets, bottom: { left: -10, top: 0 } };
        popupSettings.width = 320;
        popupSettings.height = 400;

        return popupSettings;
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}
