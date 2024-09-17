import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { HuiswerkType, Methode, MethodeInhoud, MethodenQuery, RecenteMethode, Toekenning } from '@docent/codegen';
import { SpinnerComponent } from 'harmony';
import { IconMethode, IconPijlLinks, provideIcons } from 'harmony-icons';
import { partial } from 'lodash-es';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { methodeInhoudToBijlage } from '../../core/converters/bijlage.converters';
import { SaveToekenningContainer } from '../../core/models';
import {
    CreateToekenningFn,
    MethodeSelectie,
    MethodenTab,
    ToSaveMethode,
    ToSaveMethodeToekenning
} from '../../core/models/studiewijzers/methode.model';
import { SidebarPage } from '../../core/models/studiewijzers/studiewijzer.model';
import { PopupService } from '../../core/popup/popup.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { SidebarComponent } from '../../rooster-shared/components/sidebar/sidebar.component';
import { BaseSidebar } from '../../rooster-shared/directives/base-sidebar.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { MethodeInhoudSelectieComponent } from '../../shared/components/methode-inhoud-selectie/methode-inhoud-selectie.component';
import { MethodeSelectieComponent } from '../../shared/components/methode-selectie/methode-selectie.component';
import { mapLeerdoelenNaarBulletList } from '../../shared/utils/toekenning.utils';
import { MethodeControlePopupComponent } from '../methode-controle-popup/methode-controle-popup.component';
import { MethodeDataService } from '../methode-data.service';
import { MethodeDragAndDropComponent } from './methode-drag-and-drop/methode-drag-and-drop.component';

export type SaveToekenningenCallback = (createToekenningFn: (type: HuiswerkType) => Toekenning) => void;

const methodenSidebarPage: SidebarPage = {
    titel: 'Uit methode',
    icon: 'methode',
    iconClickable: false,
    pagenumber: 0
};

const methodeInhoudSidebarPage: SidebarPage = {
    titel: '',
    icon: 'pijlLinks',
    iconClickable: true,
    pagenumber: 1
};

@Component({
    selector: 'dt-methode-sidebar',
    templateUrl: './methode-sidebar.component.html',
    styleUrls: ['./methode-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        SidebarComponent,
        MethodeSelectieComponent,
        MethodeInhoudSelectieComponent,
        MethodeDragAndDropComponent,
        SpinnerComponent,
        AsyncPipe
    ],
    providers: [provideIcons(IconMethode, IconPijlLinks)]
})
export class MethodeSidebarComponent extends BaseSidebar implements OnInit {
    public sidebarService = inject(SidebarService);
    private methodeService = inject(MethodeDataService);
    private popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('sidebar', { read: ViewContainerRef }) sidebarViewContainerRef: ViewContainerRef;

    @Input() createToekenningFn: Optional<(type: HuiswerkType) => Toekenning>;
    public activeTab$ = new BehaviorSubject<MethodenTab>('recent');

    onSaveToekenning = output<SaveToekenningContainer>();

    public selectedMethode$ = new BehaviorSubject<Optional<MethodenQuery['methoden'][number] | RecenteMethode>>(undefined);
    public hideSidebar = false;
    public methodeInhoud$: Observable<Methode>;

    constructor() {
        super();
        this.sidebarService.changePage(methodenSidebarPage);
    }

    ngOnInit() {
        this.methodeInhoud$ = this.selectedMethode$.pipe(
            mergeMap((methode) => combineLatest([of(methode), this.methodeService.getHoofdstukken(methode!.publisher, methode!.id)])),
            map(
                ([methode, hoofdstukken]) =>
                    ({
                        ...methode,
                        hoofdstukken
                    }) as Methode
            )
        );
    }

    closeSidebar = () => this.sidebarService.closeSidebar();

    selectMethode(methode: MethodenQuery['methoden'][number] | RecenteMethode) {
        this.sidebarService.changePage({
            ...methodeInhoudSidebarPage,
            titel: methode.naam,
            onIconClick: () => this.sidebarService.previousPage()
        });
        this.selectedMethode$.next(methode);
    }

    openMethodeControlePopup = (selecties: MethodeSelectie[], createToekenningFn: CreateToekenningFn) => {
        const popupSettings = MethodeControlePopupComponent.defaultPopupSettings;
        popupSettings.onCloseFunction = this.onMethodeControlePopupAnnuleren;

        this.hideSidebar = true;
        const popup = this.popupService.popup(this.sidebarViewContainerRef, popupSettings, MethodeControlePopupComponent);
        popup.methodeSelectie = selecties[0];
        popup.saveToekenningenFn = partial(this.saveToekenningen, createToekenningFn);
        popup.onAnnulerenFn = this.onMethodeControlePopupAnnuleren;
    };

    private onMethodeControlePopupAnnuleren = () => {
        this.hideSidebar = false;
        this.changeDetector.detectChanges();
    };

    saveToekenningen = (createToekenningFn: CreateToekenningFn, toSaveSelecties: ToSaveMethode[]) => {
        const nieuweToekenningen = toSaveSelecties
            .map((toSave: ToSaveMethodeToekenning) => {
                const theorieInhoud = toSave.selectie.subHoofdstuk.inhoud.filter((inhoud) => inhoud.huiswerkType === HuiswerkType.LESSTOF);
                const opdrachtInhoud = toSave.selectie.subHoofdstuk.inhoud.filter(
                    (inhoud) => inhoud.huiswerkType === HuiswerkType.HUISWERK
                );
                const toekenningen: Toekenning[] = [];

                if (theorieInhoud.length > 0) {
                    toekenningen.push(
                        this.combineInhoud(
                            theorieInhoud,
                            HuiswerkType.LESSTOF,
                            toSave.theorieNaam,
                            toSave.theorieZichtbaarheid,
                            toSave.selectie.subHoofdstuk.leerdoelen,
                            createToekenningFn
                        )
                    );
                }
                if (opdrachtInhoud.length > 0) {
                    toekenningen.push(
                        this.combineInhoud(
                            opdrachtInhoud,
                            HuiswerkType.HUISWERK,
                            toSave.huiswerkNaam,
                            toSave.huiswerkZichtbaarheid,
                            toSave.selectie.subHoofdstuk.leerdoelen,
                            createToekenningFn
                        )
                    );
                }
                return toekenningen;
            })
            .flat();

        this.onSaveToekenning.emit({ toekenningen: nieuweToekenningen, copyOnSave: false });
        this.hideSidebar = false;
    };

    private combineInhoud(
        methodenInhouden: MethodeInhoud[],
        type: HuiswerkType,
        naam: string,
        zichtbaar: boolean,
        paragraafLeerdoelen: string[],
        createToekenningFn: (type: HuiswerkType) => Toekenning
    ): Toekenning {
        const nieuweToekenning = createToekenningFn(type);
        const bijlagen = methodenInhouden.map(methodeInhoudToBijlage);

        const leerdoelen = [...paragraafLeerdoelen, ...methodenInhouden.map((inhoud) => inhoud.leerdoelen).flat()];

        return {
            ...nieuweToekenning,
            studiewijzeritem: {
                ...nieuweToekenning.studiewijzeritem,
                zichtbaarVoorLeerling: zichtbaar,
                onderwerp: naam,
                huiswerkType: type,
                leerdoelen: leerdoelen.length > 0 ? mapLeerdoelenNaarBulletList(leerdoelen) : '<p></p>',
                bijlagen
            }
        };
    }

    public showSidebarAfterDrag() {
        setTimeout(() => {
            this.hideSidebar = this.popupService.isPopupOpen();
            this.changeDetector.detectChanges();
        });
    }
}
