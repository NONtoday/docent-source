import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewContainerRef, inject, output } from '@angular/core';
import { SpinnerComponent } from 'harmony';
import { IconDifferentiatie, IconToevoegen, IconVerversen, provideIcons } from 'harmony-icons';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    Differentiatiegroep,
    Leerling,
    LesgroepFieldsFragment,
    Maybe,
    Toekenning,
    ToekenningFieldsFragment
} from '../../../../generated/_types';
import { Differentiatie } from '../../../core/models/studiewijzers/shared.model';
import { PopupService } from '../../../core/popup/popup.service';
import { DifferentiatiegroepenDataService } from '../../../core/services/differentiatiegroepen-data.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { SidebarComponent } from '../../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../../rooster-shared/directives/base-sidebar.directive';
import { differentiatiegroepenBevatLeerling, equalsId } from '../../../rooster-shared/utils/utils';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DifferentiatieSelectieComponent } from '../differentiatie/differentiatie-selectie/differentiatie-selectie.component';

@Component({
    selector: 'dt-differentiatie-toekennen-sidebar',
    templateUrl: './differentiatie-toekennen-sidebar.component.html',
    styleUrls: ['./differentiatie-toekennen-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [SidebarComponent, DifferentiatieSelectieComponent, SpinnerComponent, AsyncPipe],
    providers: [provideIcons(IconDifferentiatie, IconToevoegen, IconVerversen)]
})
export class DifferentiatieToekennenSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private popupService = inject(PopupService);
    private differentiatieDataService = inject(DifferentiatiegroepenDataService);
    private viewContainerRef = inject(ViewContainerRef);
    @Input() lesgroep: Maybe<LesgroepFieldsFragment>;
    @Input() toekenning: Toekenning | ToekenningFieldsFragment | undefined;
    @Input() showVervangenGuard = true;
    @Input() disableSidebarAnimation = false;
    @Input() bevatGedifferentieerdeItems = false;

    onDifferentieren = output<{
        differentiatie: Differentiatie;
        vervangen: boolean;
        toekenning: Toekenning;
    }>();
    onAnnuleren = output<void>();

    differentiatie$: Observable<Differentiatie>;

    private differentiatiegroepen$: Observable<Differentiatiegroep[]>;
    private leerlingen$: Observable<Leerling[]>;

    ngOnInit() {
        if (!this.lesgroep) {
            return;
        }
        this.differentiatiegroepen$ = this.differentiatieDataService
            .getDifferentiatiegroepen(this.lesgroep.id)
            .pipe(
                map((groepen) =>
                    groepen.filter((groep) => !this.toekenning || !this.toekenning.differentiatiegroepen.some(equalsId(groep.id)))
                )
            );
        this.leerlingen$ = this.differentiatieDataService.getLeerlingenMetDifferentiatiegroepenVanLesgroep(this.lesgroep.id).pipe(
            map((leerlingen) =>
                leerlingen.filter((leerling) => {
                    return (
                        !this.toekenning ||
                        (!this.toekenning.differentiatieleerlingen.some(equalsId(leerling.id)) &&
                            !differentiatiegroepenBevatLeerling(this.toekenning.differentiatiegroepen, leerling.id))
                    );
                })
            )
        );

        this.differentiatie$ = combineLatest([this.differentiatiegroepen$, this.leerlingen$]).pipe(
            map(([differentiatiegroepen, differentiatieleerlingen]) => ({ differentiatiegroepen, differentiatieleerlingen }))
        );
    }

    closeSidebar() {
        this.onAnnuleren.emit();
        this.sidebarService.closeSidebar();
    }

    onToevoegenClick(differentiatieEvent: { leerlingen: Leerling[]; groepen: Differentiatiegroep[] }) {
        const differentiatie: Differentiatie = {
            differentiatiegroepen: differentiatieEvent.groepen,
            differentiatieleerlingen: differentiatieEvent.leerlingen
        };

        if (this.showVervangenGuard && this.bevatGedifferentieerdeItems) {
            const popup = this.popupService.popup(
                this.viewContainerRef,
                ConfirmationDialogComponent.defaultPopupSettings,
                ConfirmationDialogComponent
            );

            popup.title = 'Differentiatie vervangen of aanvullen?';
            popup.message = 'Er zijn lesitems met differentiaties. Wil je deze vervangen of aanvullen?';
            popup.outlineConfirmKnop = true;
            popup.actionLabel = 'Aanvullen';
            popup.icon = 'toevoegen';
            popup.iconColor = 'accent_positive_1';
            popup.buttonColor = 'accent_positive_1';
            popup.cancelLabel = 'Vervangen';
            popup.cancelIcon = 'verversen';
            popup.cancelIconColor = 'primary_1';
            popup.cancelButtonColor = 'primary_1';

            popup.onConfirmFn = () => {
                this.differentieer(differentiatie, false);
                return true;
            };
            popup.onCancelFn = () => this.differentieer(differentiatie, true);
        } else {
            this.differentieer(differentiatie, false);
        }
    }

    private differentieer(differentiatie: Differentiatie, vervangen: boolean) {
        this.onDifferentieren.emit({
            differentiatie,
            vervangen,
            toekenning: this.toekenning as Toekenning
        });
        this.sidebarService.closeSidebar();
    }
}
