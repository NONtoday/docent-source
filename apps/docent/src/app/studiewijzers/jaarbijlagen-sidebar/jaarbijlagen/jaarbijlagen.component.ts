import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewContainerRef,
    inject,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
    Bijlage,
    BijlageMap,
    BijlageType,
    Differentiatiegroep,
    Leerling,
    Sjabloon,
    SjabloonQuery,
    Studiewijzer,
    StudiewijzerJaarbijlagen,
    StudiewijzerQuery
} from '@docent/codegen';
import { slideInUpOnEnterAnimation, slideOutDownOnLeaveAnimation } from 'angular-animations';
import { ButtonComponent, IconDirective } from 'harmony';
import {
    IconBewerken,
    IconBijlage,
    IconBijlageToevoegen,
    IconDraggable,
    IconMapToevoegen,
    IconPijlLinks,
    IconSjabloon,
    IconStudiewijzer,
    IconSynchroniseren,
    provideIcons
} from 'harmony-icons';
import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BulkDifferentiatieContainer } from '../../../core/models/studiewijzers/shared.model';
import { shareReplayLastValue } from '../../../core/operators/shareReplayLastValue.operator';
import { PopupService } from '../../../core/popup/popup.service';
import { DeviceService, desktopQuery } from '../../../core/services/device.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { accent_negative_1, accent_positive_1 } from '../../../rooster-shared/colors';
import { MessageComponent } from '../../../rooster-shared/components/message/message.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Optional, notEqualsId, toId } from '../../../rooster-shared/utils/utils';
import { BijlageUploadLijstComponent } from '../../../shared/components/bijlage/bijlage-upload-lijst/bijlage-upload-lijst.component';
import { SynchroniseerItemMetSjabloonComponent } from '../../../shared/components/synchroniseer-item-met-sjabloon/synchroniseer-item-met-sjabloon.component';
import { BulkactiesComponent } from '../../bulkacties/bulkacties.component';
import { JaarbijlageDataService } from '../../jaarbijlage-data.service';
import { JaarbijlageComponent } from '../../jaarbijlage/jaarbijlage.component';
import { SjabloonSelectieComponent } from '../../sjabloon-selectie/sjabloon-selectie.component';
import { StudiewijzerMultiselectComponent } from '../../studiewijzer-multiselect/studiewijzer-multiselect.component';
import { JaarbijlageMapComponent } from '../jaarbijlage-map/jaarbijlage-map.component';
import { JaarbijlageToevoegenPopupComponent } from '../jaarbijlage-toevoegen-popup/jaarbijlage-toevoegen-popup.component';
import { editBijlageURLSidebarPage } from '../jaarbijlagen-sidebar.pages';
import { UrlToevoegenFormulierComponent } from '../url-toevoegen-formulier/url-toevoegen-formulier.component';

type BijlagePage = 'BIJLAGEN' | 'MAP' | 'URL' | 'MAPSELECTIE' | 'SWSELECTIE' | 'SJABLOONSELECTIE';
/**
 * Dit component toont alle jaarbijlagen inclusief de mappen structuur
 */
@Component({
    selector: 'dt-jaarbijlagen',
    templateUrl: './jaarbijlagen.component.html',
    styleUrls: ['./jaarbijlagen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [slideInUpOnEnterAnimation({ duration: 400 }), slideOutDownOnLeaveAnimation({ duration: 200 })],
    standalone: true,
    imports: [
        UrlToevoegenFormulierComponent,
        SynchroniseerItemMetSjabloonComponent,
        CdkDropList,
        JaarbijlageComponent,
        CdkDrag,
        CdkDragPlaceholder,
        CdkDragHandle,
        BijlageUploadLijstComponent,
        MessageComponent,
        OutlineButtonComponent,
        JaarbijlageMapComponent,
        StudiewijzerMultiselectComponent,
        ButtonComponent,
        SjabloonSelectieComponent,
        FormsModule,
        ReactiveFormsModule,
        BulkactiesComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [
        provideIcons(
            IconSynchroniseren,
            IconDraggable,
            IconBewerken,
            IconBijlageToevoegen,
            IconBijlage,
            IconMapToevoegen,
            IconStudiewijzer,
            IconSjabloon,
            IconPijlLinks
        )
    ]
})
export class JaarbijlagenComponent implements OnInit, OnChanges, OnDestroy {
    private jaarbijlageDataService = inject(JaarbijlageDataService);
    private sidebarService = inject(SidebarService);
    private deviceService = inject(DeviceService);
    private popupService = inject(PopupService);
    private changeDetectorRef = inject(ChangeDetectorRef);
    @ViewChild('bijlageToevoegen', { read: ViewContainerRef }) bijlageToevoegen: ViewContainerRef;
    @ViewChild('fileInput', { read: ElementRef }) fileInput: ElementRef;
    @ViewChild(BijlageUploadLijstComponent) uploadLijst: BijlageUploadLijstComponent;

    @HostBinding('class.heeft-bijlagen') heeftBijlagen: boolean;

    @Input() abstractStudiewijzer: StudiewijzerQuery['studiewijzer'] | SjabloonQuery['sjabloon'];
    @Input() jaarbijlagen: StudiewijzerJaarbijlagen;
    @Input() isEditable: boolean;
    @Input() isSjabloon: boolean;
    @Input() geselecteerdeMap: Optional<BijlageMap>;
    @Input() heeftVaksecties: boolean;
    @Input() heeftToegangTotDifferentiatie: boolean;

    selectStudiewijzer = output<void>();
    selectSjabloon = output<void>();
    selectMap = output<BijlageMap | undefined>();
    openDifferentiatie = output<BijlageMap | Bijlage>();
    openBulkDifferentiatie = output<BulkDifferentiatieContainer>();

    // interne selectedMap observable voor reactive showPage$
    private _selectedMap$ = new BehaviorSubject<Optional<BijlageMap>>(undefined);
    public urlEditBijlage$ = new BehaviorSubject<Optional<Bijlage>>(undefined);
    public verplaatsBijlagen$ = new BehaviorSubject<Optional<Bijlage[]>>(undefined);
    public kopieerBijlagen$ = new BehaviorSubject<Optional<{ bijlagen: Bijlage[]; mappen: BijlageMap[] }>>(undefined);
    public showPage$: Observable<BijlagePage>;
    public showMessage = false;
    public messageText: string;
    public geselecteerdeAbstractSWs: (Sjabloon | Studiewijzer)[] = [];

    uploadFormGroup: UntypedFormGroup;
    uploadingFiles = new Subject<FileList>();
    aantalItemsGeselecteerd = 0;
    inBulkMode = false;
    bulkMapGeselecteerd = false;
    gesynchroniseerdSjabloon: Optional<Sjabloon>;

    synchroniseerbaar: boolean;
    accent_positive_1 = accent_positive_1;
    accent_negative_1 = accent_negative_1;

    isNotDesktop$: Observable<boolean>;
    onDestroy$ = new Subject<boolean>();

    ngOnInit() {
        this.uploadFormGroup = new UntypedFormGroup({
            files: new UntypedFormControl()
        });

        this.showPage$ = combineLatest([this._selectedMap$, this.urlEditBijlage$, this.verplaatsBijlagen$, this.kopieerBijlagen$]).pipe(
            map(([selectedMap, editUrl, verplaatsBijlagen, kopieerBijlagen]) => {
                if (editUrl) {
                    return 'URL' as BijlagePage;
                } else if (verplaatsBijlagen) {
                    return 'MAPSELECTIE' as BijlagePage;
                } else if (kopieerBijlagen) {
                    return this.isSjabloon ? ('SJABLOONSELECTIE' as BijlagePage) : ('SWSELECTIE' as BijlagePage);
                }
                return selectedMap ? 'MAP' : ('BIJLAGEN' as BijlagePage);
            }),
            shareReplayLastValue()
        );

        this.isNotDesktop$ = this.deviceService.onDeviceChange$.pipe(
            map((state) => !state.breakpoints[desktopQuery]),
            takeUntil(this.onDestroy$)
        );
    }

    ngOnChanges(): void {
        if (this.geselecteerdeMap !== this._selectedMap$.value) {
            this._selectedMap$.next(this.geselecteerdeMap);
        }
        this.heeftBijlagen = this.jaarbijlagen.bijlagen.length > 0 || this.jaarbijlagen.mappen.length > 0;

        if (this.geselecteerdeMap) {
            this.aantalItemsGeselecteerd = this.geselecteerdeMap.bijlagen.filter((bijlage) => bijlage.isSelected).length;
        } else {
            // aantal geselecteerde bijlagen + aantal geselecteerde mappen
            const aantalGeselecteerdeMappen = this.jaarbijlagen.mappen.filter((bijlagemap) => bijlagemap.isSelected).length;
            this.aantalItemsGeselecteerd =
                this.jaarbijlagen.bijlagen.filter((bijlage) => bijlage.isSelected).length + aantalGeselecteerdeMappen;
            this.bulkMapGeselecteerd = aantalGeselecteerdeMappen > 0;
        }

        this.synchroniseerbaar = !this.isSjabloon && this.heeftSynchronisaties();
    }

    ngOnDestroy(): void {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    public get inBulkModus() {
        return this.aantalItemsGeselecteerd > 0 || this.inBulkMode;
    }

    public get schooljaar() {
        return (this.abstractStudiewijzer as Studiewijzer).schooljaar;
    }

    isUploading(): boolean {
        return this.uploadLijst && get(this.uploadLijst, 'files', []).length > 0;
    }

    updateZichtbaarheid(bijlage: Bijlage) {
        this.saveBijlage({ ...bijlage, zichtbaarVoorLeerling: !bijlage.zichtbaarVoorLeerling });
    }

    saveJaarbijlageMap(bijlagemap: BijlageMap) {
        this.jaarbijlageDataService.saveJaarbijlageMap(bijlagemap, this.abstractStudiewijzer.id);
    }

    saveBijlage(bijlage: Bijlage) {
        const selectedMap = this.geselecteerdeMap;
        const newBijlage = { ...bijlage };
        if (!bijlage.id) {
            const addTo = selectedMap ? selectedMap : this.jaarbijlagen;
            newBijlage.sortering = get(addTo, 'bijlagen', []).length > 0 ? Math.max(...addTo.bijlagen.map((b) => b.sortering)) + 1 : 0;
        }

        this.jaarbijlageDataService.saveJaarbijlage(
            newBijlage,
            this.abstractStudiewijzer.id,
            this.isSjabloon,
            selectedMap,
            this.gesynchroniseerdSjabloon
        );
        this.gesynchroniseerdSjabloon = undefined;
        if (this.urlEditBijlage$.getValue()) {
            this.sidebarService.previousPage();
            this.messageText = 'Link toegevoegd';
            this.showMessage = true;
            this.urlEditBijlage$.next(null);
        }
    }

    verwijderBijlage(bijlage: Bijlage) {
        this.jaarbijlageDataService.verwijderBijlage(bijlage, this.abstractStudiewijzer.id, this.isSjabloon, this.geselecteerdeMap);
    }

    selectFiles(files: Event) {
        this.uploadingFiles.next((files.target as HTMLInputElement).files!);
        this.heeftBijlagen = true;
    }

    editUrl(bijlage: Bijlage) {
        this.sidebarService.changePage({
            ...editBijlageURLSidebarPage,
            onIconClick: () => {
                this.sidebarService.previousPage();
                this.urlEditBijlage$.next(undefined);
            }
        });
        this.urlEditBijlage$.next(bijlage);
    }

    openBijlageMapSelectie(bijlagen: Bijlage[]) {
        this.verplaatsBijlagen$.next(bijlagen);
        this.sidebarService.changePage({
            titel: 'Verplaatsen naar',
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 3,
            onIconClick: () => {
                this.sidebarService.previousPage();
                this.verplaatsBijlagen$.next(undefined);
            }
        });
    }

    verplaatsBijlagenNaarMap(bijlageMap?: BijlageMap) {
        this.messageText = `Verplaatst naar <b>${bijlageMap ? bijlageMap.naam : 'Jaarbijlagenoverzicht'}</b>`;
        this.showMessage = true;
        const bijlagen = this.verplaatsBijlagen$.getValue();
        const oudeMap = this.geselecteerdeMap;
        const bijlageMapId = bijlageMap ? bijlageMap.id : undefined;
        const oudeMapId = oudeMap ? oudeMap.id : undefined;
        if (bijlageMapId !== oudeMapId) {
            this.jaarbijlageDataService.verplaatsBijlagenNaarMap(bijlagen!, this.abstractStudiewijzer.id, bijlageMapId, oudeMapId);
        }

        this.sidebarService.previousPage();
        this.verplaatsBijlagen$.next(undefined);
        this.inBulkMode = false;
    }

    selecteerMap(bijlageMap: BijlageMap) {
        if (!bijlageMap.id) {
            return;
        }

        this.showMessage = false;
        this.bulkMapGeselecteerd = false;

        this.jaarbijlageDataService.deselectBijlagenAndMappenFromAbstractStudiewijzer(this.abstractStudiewijzer.id);
        this.sidebarService.changePage({
            titel: bijlageMap.naam,
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 3,
            onIconClick: () => {
                this.deselecteerMap();
            }
        });
        this.selectMap.emit(bijlageMap);
        this.inBulkMode = false;
    }

    deselecteerMap() {
        this.showMessage = false;

        this.jaarbijlageDataService.deselectAllBijlagesFromBijlageMap(this.geselecteerdeMap!.id);
        this.sidebarService.previousPage();
        this.inBulkMode = false;
        this.selectMap.emit(undefined);
    }

    sorteerBijlage(event: CdkDragDrop<string[]>) {
        const selectedMap = this.geselecteerdeMap;
        const bijlagen = selectedMap ? selectedMap.bijlagen : this.jaarbijlagen.bijlagen;

        this.jaarbijlageDataService.sorteerJaarbijlagen(
            bijlagen,
            event.previousIndex,
            event.currentIndex,
            this.abstractStudiewijzer.id,
            selectedMap ? selectedMap.id : undefined
        );
    }

    sorteerMap(event: CdkDragDrop<string[]>) {
        this.jaarbijlageDataService.sorteerJaarbijlageMap(
            this.jaarbijlagen.mappen,
            event.previousIndex,
            event.currentIndex,
            this.abstractStudiewijzer.id
        );
    }

    onEditButtonClick() {
        this.inBulkMode = true;
    }

    fileUploaded(uploadContextId: string, file: File) {
        if (file) {
            const selectedMap = this.geselecteerdeMap;
            const addTo = selectedMap ? selectedMap : this.jaarbijlagen;

            const bijlage = {
                uploadContextId,
                type: BijlageType.BESTAND,
                titel: file.name,
                url: null,
                zichtbaarVoorLeerling: true,
                sortering: addTo.bijlagen.length > 0 ? Math.max(...addTo.bijlagen.map((b) => b.sortering)) + 1 : 0
            } as Bijlage;

            this.jaarbijlageDataService.saveJaarbijlage(bijlage, this.abstractStudiewijzer.id, this.isSjabloon, this.geselecteerdeMap);
        }
    }

    getSelectedBijlagen(): Bijlage[] {
        if (this.geselecteerdeMap) {
            return this.geselecteerdeMap.bijlagen.filter((bijlage) => bijlage.isSelected);
        }
        return this.jaarbijlagen.bijlagen.filter((bijlage) => bijlage.isSelected);
    }

    getSelectedBijlageMappen() {
        return this.jaarbijlagen.mappen.filter((bijlageMap) => bijlageMap.isSelected);
    }

    bulkVerplaats() {
        this.openBijlageMapSelectie(this.getSelectedBijlagen());
    }

    bulkEditZichtbaarheid(zichtbaarheid: boolean) {
        const selectedBijlages = this.getSelectedBijlagen();
        const selectedMapIds = this.getSelectedBijlageMappen().map(toId);
        this.jaarbijlageDataService.bulkZichtbaarheidJaarbijlagen(
            selectedBijlages,
            selectedMapIds,
            zichtbaarheid,
            this.abstractStudiewijzer.id,
            this.geselecteerdeMap
        );
    }

    bulkVerwijderen() {
        const selectedBijlages = this.getSelectedBijlagen();
        this.jaarbijlageDataService.bulkVerwijderJaarbijlagen(
            selectedBijlages,
            this.abstractStudiewijzer.id,
            this.isSjabloon,
            this.geselecteerdeMap
        );
    }

    onBulkDifferentiatieToekennen(iedereen: boolean) {
        const bulkDifferentiatie = {
            selectedBijlagen: this.getSelectedBijlagen(),
            selectedMappen: this.getSelectedBijlageMappen(),
            iedereen
        };
        this.openBulkDifferentiatie.emit(bulkDifferentiatie);
    }

    closeBulkacties() {
        if (this.geselecteerdeMap) {
            this.jaarbijlageDataService.deselectAllBijlagesFromBijlageMap(this.geselecteerdeMap.id);
        } else {
            this.jaarbijlageDataService.deselectBijlagenAndMappenFromAbstractStudiewijzer(this.abstractStudiewijzer.id);
        }
        this.inBulkMode = false;
    }

    toggleBijlageSelection(bijlage: Bijlage) {
        this.jaarbijlageDataService.toggleBijlageSelection(bijlage.id);
    }

    toggleBijlageMapSelection(bijlagemap: BijlageMap) {
        this.jaarbijlageDataService.toggleBijlageMapSelection(bijlagemap.id);
    }

    voegMapToe() {
        const bestaatAlNieuweMap = this.jaarbijlagen.mappen.some((bijlageMap: BijlageMap) => isNil(bijlageMap.id));
        if (!bestaatAlNieuweMap) {
            const sortering: number =
                this.jaarbijlagen.mappen.length > 0 ? Math.max(...this.jaarbijlagen.mappen.map((m) => m.sortering)) + 1 : 0;

            this.jaarbijlagen = {
                ...this.jaarbijlagen,
                mappen: [
                    ...this.jaarbijlagen.mappen,
                    {
                        id: null,
                        sortering,
                        zichtbaarVoorLeerling: true,
                        naam: '',
                        bijlagen: [],
                        differentiatiegroepen: [],
                        differentiatieleerlingen: [],
                        synchroniseertMet: null,
                        synchroniseertMetId: null,
                        isNew: true
                    } as unknown as BijlageMap
                ]
            };

            this.heeftBijlagen = true;
            this.changeDetectorRef.markForCheck();
        }
    }

    verwijderBijlageMap(data: { bijlageMap: BijlageMap; inclBijlagen: boolean }) {
        this.jaarbijlageDataService.verwijderJaarbijlageMap(
            data.bijlageMap.id,
            data.inclBijlagen,
            this.abstractStudiewijzer.id,
            this.isSjabloon
        );
    }

    cancelMapToevoegen() {
        this.jaarbijlagen.mappen = this.jaarbijlagen.mappen.filter((bijlageMap: BijlageMap) => !isNil(bijlageMap.id));
    }

    cancelBijlageToevoegen() {
        this.urlEditBijlage$.next(null);
        this.gesynchroniseerdSjabloon = undefined;
        this.sidebarService.previousPage();
    }

    openJaarbijlageToevoegenPopup($event: Event) {
        if (this.popupService.isPopupOpenFor(this.bijlageToevoegen)) {
            this.popupService.closePopUp();
        } else {
            const popup = this.popupService.popup(
                this.bijlageToevoegen,
                JaarbijlageToevoegenPopupComponent.defaultPopupSettings,
                JaarbijlageToevoegenPopupComponent
            );
            popup.inSjabloon = this.isSjabloon;
            popup.onStudiewijzerClick = () => {
                this.selectStudiewijzer.emit();
                this.popupService.closePopUp();
            };
            popup.onSjabloonClick = null;
            popup.onUrlClick = () => {
                this.sidebarService.changePage({
                    ...editBijlageURLSidebarPage,
                    titel: 'Link toevoegen',
                    onIconClick: () => {
                        this.sidebarService.previousPage();
                        this.urlEditBijlage$.next(undefined);
                    }
                });
                this.urlEditBijlage$.next({
                    type: BijlageType.URL
                } as Bijlage);
                this.popupService.closePopUp();
            };
            popup.onApparaatClick = () => {
                setTimeout(() => {
                    this.fileInput.nativeElement.click();
                });
                this.popupService.closePopUp();
            };
            if (this.heeftVaksecties) {
                popup.onSjabloonClick = () => {
                    this.selectSjabloon.emit();
                    this.popupService.closePopUp();
                };
            }
        }
        $event.stopPropagation();
    }

    kopieerBijlage($event?: Bijlage | BijlageMap) {
        let selectedBijlage: Bijlage;
        let selectedMap: BijlageMap;
        if ($event && $event.__typename === 'BijlageMap') {
            selectedMap = $event;
        } else if ($event && $event.__typename === 'Bijlage') {
            selectedBijlage = $event;
        }
        this.kopieerBijlagen$.next({
            bijlagen: selectedBijlage! ? [selectedBijlage] : this.getSelectedBijlagen(),
            mappen: selectedMap! ? [selectedMap] : this.getSelectedBijlageMappen()
        });
        this.sidebarService.changePage({
            titel: `Kopiëren naar ${this.isSjabloon ? 'sjabloon' : 'studiewijzer'}`,
            icon: 'pijlLinks',
            iconClickable: true,
            pagenumber: 3,
            onIconClick: () => {
                this.sluitAbstractSWSelectie();
            }
        });
    }

    sluitAbstractSWSelectie() {
        this.sidebarService.previousPage();
        this.kopieerBijlagen$.next(undefined);
        this.geselecteerdeAbstractSWs = [];
    }

    kopieerNaarAbstractSW() {
        const geselecteerdeItems = this.kopieerBijlagen$.getValue();
        this.jaarbijlageDataService.exporteerBijlagen(
            this.isSjabloon,
            geselecteerdeItems!.bijlagen,
            geselecteerdeItems!.mappen,
            this.geselecteerdeAbstractSWs.map((s) => s.id)
        );
        const lesgroepenOfNamen = this.geselecteerdeAbstractSWs.map(
            (abstractSw) => (<Studiewijzer>abstractSw).lesgroep?.naam ?? abstractSw.naam
        );
        this.messageText = `Gekopieerd naar <b>${lesgroepenOfNamen.join(', ')}</b>`;
        this.showMessage = true;
        this.sluitAbstractSWSelectie();
        this.closeBulkacties();
    }

    selecteerSjabloon(sjabloon: Sjabloon) {
        if (this.geselecteerdeAbstractSWs.some((sj) => sj.id === sjabloon.id)) {
            this.geselecteerdeAbstractSWs = this.geselecteerdeAbstractSWs.filter((sj) => sj.id !== sjabloon.id);
        } else {
            this.geselecteerdeAbstractSWs.push(sjabloon);
        }
    }

    trackById(index: number, item: Bijlage | BijlageMap) {
        return item.id;
    }

    onSjabloonSynchroniserenClick(sjabloon: Sjabloon) {
        this.popupService.closePopUp();
        this.gesynchroniseerdSjabloon = sjabloon;
        this.changeDetectorRef.detectChanges();
    }

    unlinkSjabloon() {
        this.gesynchroniseerdSjabloon = undefined;
        this.changeDetectorRef.detectChanges();
    }

    heeftSynchronisaties(): boolean {
        const synchronisaties = (<Studiewijzer>this.abstractStudiewijzer).gesynchroniseerdeSjablonen;
        return synchronisaties && synchronisaties.length > 0;
    }

    synchroniseerBijlage(synchroniseerMetSjabloon: Sjabloon, bijlage: Bijlage, bijlageMapId?: string) {
        this.jaarbijlageDataService.synchroniseerMetSjabloon(this.abstractStudiewijzer.id, synchroniseerMetSjabloon, bijlage, bijlageMapId);
    }

    synchroniseerBijlageMap(synchroniseerMetSjabloon: Sjabloon, bijlageMap: BijlageMap) {
        this.jaarbijlageDataService.synchroniseerMapMetSjabloon(this.abstractStudiewijzer.id, synchroniseerMetSjabloon, bijlageMap);
    }

    get heeftMappen(): boolean {
        return this.jaarbijlagen.mappen.length > 0;
    }

    get heeftBijlageMetDifferentiatie(): boolean {
        return this.jaarbijlagen.bijlagen.some(
            (bijlage) => bijlage.isSelected && (bijlage.differentiatiegroepen.length > 0 || bijlage.differentiatieleerlingen.length > 0)
        );
    }

    get geselecteerdeMapHeeftSynchronisatie(): boolean {
        return !!this.geselecteerdeMap?.synchroniseertMet;
    }

    get heeftGesynchroniseerdeBijlagenGeselecteerd(): boolean {
        const heeftGeselecteerdeBijlagenInSyncMap = this.jaarbijlagen.mappen.some(
            (bijlageMap) => !!bijlageMap.synchroniseertMet && bijlageMap.bijlagen.some((bijlage) => bijlage.isSelected)
        );
        const heeftSyncGeselecteerdeBijlagen = this.jaarbijlagen.bijlagen.some(
            (bijlage) => bijlage.isSelected && !!bijlage.synchroniseertMet
        );

        return heeftGeselecteerdeBijlagenInSyncMap || heeftSyncGeselecteerdeBijlagen;
    }

    get toonJaarbijlagenoverzicht() {
        const teVerplaatsenBijlageIds = this.verplaatsBijlagen$.getValue()?.map((bijlage) => bijlage.id) ?? [];
        return !this.jaarbijlagen.bijlagen.some((bijlage) => teVerplaatsenBijlageIds.includes(bijlage.id));
    }

    get gesynchroniseerdeSjablonen(): Sjabloon[] {
        const sjablonen = (<Studiewijzer>this.abstractStudiewijzer).gesynchroniseerdeSjablonen;

        if (this.geselecteerdeMapHeeftSynchronisatie) {
            return [sjablonen.find((syncSjabloon) => syncSjabloon.id === this.geselecteerdeMap!.synchroniseertMetId)!];
        }

        return sjablonen;
    }

    removeDifferentiatiegroep(object: Bijlage | BijlageMap, groep: Differentiatiegroep) {
        if ('bijlagen' in object) {
            this.saveJaarbijlageMap({
                ...object,
                differentiatiegroepen: object.differentiatiegroepen.filter(notEqualsId(groep.id))
            } as BijlageMap);
        } else {
            this.saveBijlage({
                ...object,
                differentiatiegroepen: object.differentiatiegroepen.filter(notEqualsId(groep.id))
            } as Bijlage);
        }
    }

    removeDifferentiatieleerling(object: Bijlage | BijlageMap, leerling: Leerling) {
        if ('bijlagen' in object) {
            this.saveJaarbijlageMap({
                ...object,
                differentiatieleerlingen: object.differentiatieleerlingen.filter(notEqualsId(leerling.id))
            } as BijlageMap);
        } else {
            this.saveBijlage({
                ...object,
                differentiatieleerlingen: object.differentiatieleerlingen.filter(notEqualsId(leerling.id))
            } as Bijlage);
        }
    }

    verwijderDifferentiaties(object: Bijlage | BijlageMap) {
        if ('type' in object) {
            this.jaarbijlageDataService.verwijderBijlageDifferentiaties(object.id, object.type === BijlageType.BESTAND);
        } else {
            this.jaarbijlageDataService.verwijderMapDifferentiaties(object.id);
        }
    }
}
