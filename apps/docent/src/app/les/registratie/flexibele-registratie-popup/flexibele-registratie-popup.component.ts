import { AfterViewInit, Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { KeuzelijstWaardeMogelijkheid, LesRegistratieQuery, VrijVeld, VrijVeldWaarde } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconNoCheckbox, IconRadio, IconRadioSelect, provideIcons } from 'harmony-icons';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';

@Component({
    selector: 'dt-flexibele-registratie-popup',
    templateUrl: './flexibele-registratie-popup.component.html',
    styleUrls: ['./flexibele-registratie-popup.component.scss'],
    standalone: true,
    imports: [PopupComponent, OutlineButtonComponent, ButtonComponent, IconDirective],
    providers: [provideIcons(IconNoCheckbox, IconRadioSelect, IconRadio)]
})
export class FlexibeleRegistratiePopupComponent implements OnInit, AfterViewInit, Popup {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;
    @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;

    @Input() vrijveldDefinities: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'];
    @Input() leerlingRegistratie: LesRegistratieQuery['lesRegistratie']['leerlingRegistraties'][number];
    @Input() toonHWenMT: boolean;

    public aankruisvakken: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'];
    public keuzelijsten: LesRegistratieQuery['lesRegistratie']['overigeVrijVeldDefinities'];

    private updatedVrijveldWaardes: VrijVeldWaarde[];
    public updatedHuiswerk: boolean;
    public updatedMateriaal: boolean;

    public hasScrollbar: boolean;
    public saveButtonGtmTag: string;

    save: (vrijveldWaardes: VrijVeldWaarde[]) => void;
    saveHW: (hw: boolean) => void;
    saveMT: (mt: boolean) => void;

    ngOnInit(): void {
        this.aankruisvakken = this.vrijveldDefinities.filter((vd) => vd.keuzelijstWaardeMogelijkheden?.length == 0);
        this.keuzelijsten = this.vrijveldDefinities.filter(
            (vd) => vd.keuzelijstWaardeMogelijkheden && vd.keuzelijstWaardeMogelijkheden.length > 0
        );
        this.updatedVrijveldWaardes = [...this.leerlingRegistratie.overigeVrijVeldWaarden];
        this.updatedHuiswerk = this.leerlingRegistratie.huiswerkNietInOrde;
        this.updatedMateriaal = this.leerlingRegistratie.materiaalVergeten;
        this.popup.renderPopup();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.hasScrollbar = this.container?.element?.nativeElement?.scrollHeight > this.container?.element?.nativeElement?.clientHeight;
        });
    }

    mayClose(): boolean {
        return true;
    }

    public isAankruisvakSelected(aankruisvak: VrijVeld) {
        return this.updatedVrijveldWaardes.find((vw) => vw.vrijveld.id === aankruisvak.id)?.booleanWaarde;
    }

    public isKeuzelijstSelected(keuzelijst: VrijVeld, optie: KeuzelijstWaardeMogelijkheid) {
        return this.updatedVrijveldWaardes.find((vw) => vw.vrijveld.id === keuzelijst.id)?.keuzelijstWaarde?.id === optie.id;
    }

    public updateAankruisvak(aankruisvak: VrijVeld) {
        const vrijveld = this.updatedVrijveldWaardes.find((vw) => vw.vrijveld.id === aankruisvak.id);
        if (vrijveld) {
            const newVrijveld = { ...vrijveld, booleanWaarde: !vrijveld.booleanWaarde };
            this.updatedVrijveldWaardes = this.updatedVrijveldWaardes.filter((vw) => vw.vrijveld.id !== aankruisvak.id);
            this.updatedVrijveldWaardes.push(newVrijveld);
        } else {
            const newVrijveld = {
                __typename: 'VrijVeldWaarde',
                id: this.leerlingRegistratie.leerling.id + '-' + aankruisvak.id,
                booleanWaarde: true,
                vrijveld: aankruisvak,
                keuzelijstWaarde: null
            } as VrijVeldWaarde;
            this.updatedVrijveldWaardes.push(newVrijveld);
        }
    }

    public updateKeuzelijst(keuzelijst: VrijVeld, optie: KeuzelijstWaardeMogelijkheid) {
        const vrijveld = this.updatedVrijveldWaardes.find((vw) => vw.vrijveld.id === keuzelijst.id);
        if (vrijveld) {
            this.updatedVrijveldWaardes = this.updatedVrijveldWaardes.filter((vw) => vw.vrijveld.id !== keuzelijst.id);
            if (vrijveld.keuzelijstWaarde?.id !== optie.id) {
                const newVrijveld = { ...vrijveld, keuzelijstWaarde: optie };
                this.updatedVrijveldWaardes.push(newVrijveld);
            }
        } else {
            const newVrijveld = {
                __typename: 'VrijVeldWaarde',
                id: this.leerlingRegistratie.leerling.id + '-' + keuzelijst.id,
                vrijveld: keuzelijst,
                keuzelijstWaarde: optie,
                booleanWaarde: null
            } as VrijVeldWaarde;
            this.updatedVrijveldWaardes.push(newVrijveld);
        }
    }

    public updateHuiswerk() {
        this.updatedHuiswerk = !this.updatedHuiswerk;
    }

    public updateMateriaal() {
        this.updatedMateriaal = !this.updatedMateriaal;
    }

    public annuleer() {
        return this.popup.onClose();
    }

    public klaar() {
        if (this.toonHWenMT) {
            this.saveHW(this.updatedHuiswerk);
            this.saveMT(this.updatedMateriaal);
        }
        this.save(this.updatedVrijveldWaardes);
        return this.popup.onClose();
    }
}
