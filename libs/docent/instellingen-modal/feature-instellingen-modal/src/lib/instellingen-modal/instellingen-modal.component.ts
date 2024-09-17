import { CommonModule } from '@angular/common';
import { ApplicationRef, ChangeDetectionStrategy, Component, computed, inject, input, output, Renderer2, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IngelogdeMedewerkerQuery } from '@docent/codegen';
import { DocentInstellingenDataServiceService } from '@docent/instellingen-modal/data-access';
import {
    DocentAccountComponent,
    RoosterInstellingenComponent,
    VerouderdeVersieWarningComponent,
    WeergaveInstellingenComponent
} from '@docent/instellingen-modal/ui';
import { startViewTransition } from '@shared/utils/view-transition';
import { ButtonComponent, DeviceService, IconDirective, ModalService, TooltipDirective } from 'harmony';
import { IconChevronRechts, IconKalenderDag, IconPersoon, IconUitloggen, IconWeergave, provideIcons } from 'harmony-icons';
import { explicitEffect } from 'ngxtension/explicit-effect';

type Tab = 'Account' | 'Weergave' | 'Rooster';

@Component({
    selector: 'dt-instellingen-modal',
    standalone: true,
    imports: [
        CommonModule,
        IconDirective,
        DocentAccountComponent,
        VerouderdeVersieWarningComponent,
        WeergaveInstellingenComponent,
        RoosterInstellingenComponent,
        ButtonComponent,
        TooltipDirective
    ],
    templateUrl: './instellingen-modal.component.html',
    styleUrl: './instellingen-modal.component.scss',
    host: {
        '[class.in-detail]': 'currentTab() !== undefined'
    },
    providers: [
        provideIcons(IconPersoon, IconChevronRechts, IconWeergave, IconKalenderDag, IconUitloggen),
        DocentInstellingenDataServiceService
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstellingenModalComponent {
    private readonly deviceService = inject(DeviceService);
    private readonly modalService = inject(ModalService);
    private readonly renderer2 = inject(Renderer2);
    private readonly instellingenDataService = inject(DocentInstellingenDataServiceService);
    private readonly appRef = inject(ApplicationRef);

    currentTab = signal<Tab | undefined>(undefined);
    heeftUpdate = input.required<boolean>();
    versie = input.required<string>();
    docent = input.required<IngelogdeMedewerkerQuery['ingelogdeMedewerker']>();

    uitloggen = output<void>();

    constructor() {
        this.currentTab.set(this.deviceService.isPhoneOrTabletPortrait() ? undefined : 'Account');
        const isPhoneOrTabletPortrait = toSignal(this.deviceService.isPhoneOrTabletPortrait$);
        // op mobiel willen we wel een modal titel. Op desktop hebben we een eigen titel in de detailview
        const title = computed(() => (isPhoneOrTabletPortrait() ? (this.currentTab() ?? 'Instellingen') : undefined));
        const showBackButton = computed(() => this.currentTab() !== undefined && isPhoneOrTabletPortrait());
        const closePosition = computed(() => (isPhoneOrTabletPortrait() ? { top: 28, right: 16 } : { top: 24, right: 24 }));

        explicitEffect([title, showBackButton, closePosition], ([title, showBackButton, closePosition]) => {
            this.modalService.updateSettings({
                title,
                showBackButton,
                closePosition,
                showClose: true,
                onBackButton: () => this.setDetail(undefined)
            });
        });
    }

    setDetail(tab: Tab | undefined) {
        this.deviceService.isPhoneOrTabletPortrait()
            ? startViewTransition(this.appRef, () => {
                  this.currentTab.set(tab);
                  this.modalService.updateCanScroll();
              })
            : this.currentTab.set(tab);
    }

    updateTheme(themeSettings: IngelogdeMedewerkerQuery['ingelogdeMedewerker']['settings']['themeSettings']) {
        // het daadwerkelijk setten van het theme gebeurt in dash.component wanneer de medewerker
        // settings worden geupdate in de cache
        this.instellingenDataService.updateThemeSettings(this.docent().uuid, themeSettings);
    }

    saveDagBeginTijd(dagBegintijd: string) {
        this.instellingenDataService.setDagBegintijd(this.docent().uuid, dagBegintijd);
    }
}
