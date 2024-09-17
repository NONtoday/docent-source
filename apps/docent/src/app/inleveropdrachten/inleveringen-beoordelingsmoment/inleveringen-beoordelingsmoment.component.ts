import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { Inlevering, InleveringStatus } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconChevronBoven, IconDownloaden, IconSlot, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { shareReplayLastValue } from '../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../core/popup/popup.service';
import { MedewerkerDataService } from '../../core/services/medewerker-data.service';
import { ToastService } from '../../core/toast/toast.service';
import {
    ActionsPopupComponent,
    accorderenButton,
    afwijzenButton
} from '../../rooster-shared/components/actions-popup/actions-popup.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { Optional } from '../../rooster-shared/utils/utils';
import { InleverStatusPillComponent } from '../inlever-status-pill/inlever-status-pill.component';
import { InleveringComponent } from '../inlevering/inlevering.component';
import { InleveringenOverzichtService } from '../inleveringen-overzicht/inleveringen-overzicht.service';

@Component({
    selector: 'dt-inleveringen-beoordelingsmoment',
    templateUrl: './inleveringen-beoordelingsmoment.component.html',
    styleUrls: ['./inleveringen-beoordelingsmoment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        InleverStatusPillComponent,
        TooltipDirective,
        SpinnerComponent,
        InleveringComponent,
        OutlineButtonComponent,
        AsyncPipe,
        DtDatePipe,
        IconDirective
    ],
    providers: [provideIcons(IconSlot, IconDownloaden, IconChevronBoven)]
})
export class InleveringenBeoordelingsmomentComponent implements OnInit, OnChanges {
    private medewerkerService = inject(MedewerkerDataService);
    private popupService = inject(PopupService);
    private service = inject(InleveringenOverzichtService);
    private changeDetection = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    @ViewChild('beoordelenButton', { read: ViewContainerRef }) beoordelenButton: ViewContainerRef;

    @Input() beoordelingsMoment: Optional<Date>;
    @Input() eindeInleverperiode: Date;
    @Input() inleveringen: Inlevering[];

    onInleveringPlagiaatControleren = output<Inlevering>();

    public isOpen = false;
    public loadingZip = false;

    public isPlagiaatControleerbaar$: Observable<boolean>;

    ngOnInit(): void {
        this.isPlagiaatControleerbaar$ = this.medewerkerService.isPlagiaatControleerbaar().pipe(shareReplayLastValue());
    }

    ngOnChanges(): void {
        this.isOpen = this.status === InleveringStatus.AKKOORD || !this.canOpen();
    }

    canOpen = () => this.status !== InleveringStatus.IN_BEOORDELING && this.status !== InleveringStatus.TE_BEOORDELEN;
    toggleOpen() {
        if (this.canOpen()) {
            this.isOpen = !this.isOpen;
        }
    }

    onBeoordelenClick() {
        const popupSettings = ActionsPopupComponent.defaultPopupsettings;
        popupSettings.width = 156;

        const popup = this.popupService.popup(this.beoordelenButton, popupSettings, ActionsPopupComponent);

        popup.customButtons = [
            accorderenButton(() => this.service.beoordeel(InleveringStatus.AKKOORD), 'accordeer-inlevering'),
            afwijzenButton(() => this.service.beoordeel(InleveringStatus.AFGEWEZEN), 'wijs-inlevering-af')
        ];
        popup.onActionClicked = () => {
            this.isOpen = false;
            this.popupService.closePopUp();
        };
    }

    download = (inlevering: Inlevering) => this.service.download(inlevering);
    downloadAlles(inleveringen: Inlevering[], event: Event) {
        event.stopPropagation();

        this.loadingZip = true;

        this.service.downloadAlles(inleveringen);
        this.service.whenZipReady$(inleveringen).subscribe({
            next: () => {
                this.loadingZip = false;
                this.changeDetection.markForCheck();
            },
            error: () => {
                this.toastService.error('Er is een fout opgetreden, probeer het nogmaals.');
                this.loadingZip = false;
                this.changeDetection.markForCheck();
            }
        });
    }

    public get status() {
        return this.inleveringen[0]?.status;
    }
}
