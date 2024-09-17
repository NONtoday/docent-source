import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Methode } from '@docent/codegen';
import { collapseAnimation } from 'angular-animations';
import { flatMap } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

import { AsyncPipe } from '@angular/common';
import { CheckboxComponent, IconDirective } from 'harmony';
import { IconChevronBoven, IconPijlLinks, provideIcons } from 'harmony-icons';
import { MethodeSelectie, ToSaveMethode } from '../../../core/models/studiewijzers/methode.model';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ButtonComponent } from '../../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../../rooster-shared/components/outline-button/outline-button.component';
import { Optional } from '../../../rooster-shared/utils/utils';
import { MethodeControleComponent } from '../../../studiewijzers/methode-controle/methode-controle.component';

interface SelectieControleData {
    selecties: MethodeSelectie[];
    forms: UntypedFormGroup[];
}

@Component({
    selector: 'dt-methode-inhoud-selectie',
    templateUrl: './methode-inhoud-selectie.component.html',
    styleUrls: ['./methode-inhoud-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        MethodeControleComponent,
        OutlineButtonComponent,
        ButtonComponent,
        FormsModule,
        ReactiveFormsModule,
        CheckboxComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconChevronBoven, IconPijlLinks)]
})
export class MethodeInhoudSelectieComponent implements OnChanges {
    @Input() methode: Methode;
    @Input() keepSidebarOnSave: boolean;
    @Input() controle = true;

    onToevoegen = output<ToSaveMethode[]>();

    public selectieControle$ = new BehaviorSubject<Optional<SelectieControleData>>(null);

    public geslotenHoofdstukken: { [key: string]: boolean } = {};
    public geselecteerdeSubHoofdstukkenForm: UntypedFormGroup;

    toggleHoofdstukOpen = (hoofdstukId: string) => (this.geslotenHoofdstukken[hoofdstukId] = !this.geslotenHoofdstukken[hoofdstukId]);
    isHoofdstukGesloten = (hoofdstukId: string) => this.geslotenHoofdstukken[hoofdstukId];
    formBuilder = inject(UntypedFormBuilder);
    sidebarService = inject(SidebarService);

    ngOnChanges() {
        const subHoofdstukken = flatMap(this.methode.hoofdstukken.map((hoofdstuk) => hoofdstuk.subHoofdstukken));
        const formGroupValues = subHoofdstukken.reduce((recurring, value) => {
            recurring[value.id] = false;
            return recurring;
        }, {} as any);
        this.geselecteerdeSubHoofdstukkenForm = this.formBuilder.group(formGroupValues);
    }

    onKiezenClick() {
        if (this.controle) {
            const forms = this.geselecteerdeSubHoofdstukken.map(
                () =>
                    new UntypedFormGroup({
                        theorie: new UntypedFormControl('', Validators.required),
                        theorieZichtbaarheid: new UntypedFormControl(true),
                        huiswerk: new UntypedFormControl('', Validators.required),
                        huiswerkZichtbaarheid: new UntypedFormControl(true)
                    })
            );
            this.selectieControle$.next({
                selecties: this.geselecteerdeSubHoofdstukken,
                forms
            });
            this.sidebarService.changePage({
                icon: 'pijlLinks',
                titel: 'Controleren en inplannen',
                iconClickable: true,
                onIconClick: () => this.onAnnulerenClick(),
                pagenumber: 1
            });
        } else {
            const selecties = this.geselecteerdeSubHoofdstukken.map((selectie) => ({ selectie }));
            this.onToevoegen.emit(selecties);
        }
    }

    onInplannenClick() {
        const toSaveToekenningen = this.selectieControle$.value!.selecties.map((selectie, index) => {
            const form = this.selectieControle$.value!.forms[index];
            return {
                selectie,
                huiswerkNaam: form.value.huiswerk,
                theorieNaam: form.value.theorie,
                huiswerkZichtbaarheid: form.value.huiswerkZichtbaarheid,
                theorieZichtbaarheid: form.value.theorieZichtbaarheid
            };
        });

        this.onToevoegen.emit(toSaveToekenningen);

        if (!this.keepSidebarOnSave) {
            this.sidebarService.closeSidebar();
        }
    }

    onAnnulerenClick() {
        this.selectieControle$.next(null);
        this.sidebarService.previousPage();
    }

    onDeselecterenClick() {
        this.geselecteerdeSubHoofdstukkenForm.reset();
    }

    get geselecteerdeSubHoofdstukken(): MethodeSelectie[] {
        return Object.keys(this.geselecteerdeSubHoofdstukkenForm.controls)
            .map((key) => {
                if (this.geselecteerdeSubHoofdstukkenForm.controls[key].value) {
                    const nummer = this.methode.hoofdstukken.findIndex((h) => h.subHoofdstukken.some((s) => s.id === key));
                    const hoofdstuk = this.methode.hoofdstukken[nummer];
                    const subHoofdstuk = hoofdstuk.subHoofdstukken.find((s) => s.id === key);
                    return { subHoofdstuk, hoofdstukNaam: hoofdstuk.naam, hoofdstukNummer: nummer };
                }
            })
            .filter(Boolean) as MethodeSelectie[];
    }
}
