import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject, output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { collapseAnimation } from 'angular-animations';
import { IconDirective } from 'harmony';
import { IconBijlage, IconChevronOnder, IconInformatie, IconMap, provideIcons } from 'harmony-icons';
import flatMap from 'lodash-es/flatMap';
import zip from 'lodash-es/zip';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { Bijlage, BijlageFieldsFragment, BijlageMap, BijlageMapFieldsFragment, BijlageType, Maybe } from '../../../generated/_types';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { FormCheckboxComponent } from '../../rooster-shared/components/form-checkbox/form-checkbox.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { mapDifferentiatieToKleurenStackElements } from '../../rooster-shared/utils/color-token-utils';
import { BijlageExtensieComponent } from '../../shared/components/bijlage-extensie/bijlage-extensie.component';
import { KleurenStackComponent, KleurenStackElement } from '../../shared/components/kleuren-stack/kleuren-stack.component';

interface BijlageMapGroup {
    map?: Maybe<boolean>;
    mapbijlagen?: Maybe<boolean>[];
}

interface BijlagenForm {
    mappen: FormArray<
        FormGroup<{
            map: FormControl<Maybe<boolean>>;
            mapbijlagen: FormArray<FormControl<Maybe<boolean>>>;
        }>
    >;
    bijlagen: FormArray<FormControl<Maybe<boolean>>>;
}

@Component({
    selector: 'dt-bijlagen-selectie',
    templateUrl: './bijlagen-selectie.component.html',
    styleUrls: ['./bijlagen-selectie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [collapseAnimation()],
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        TooltipDirective,
        FormCheckboxComponent,
        KleurenStackComponent,
        BijlageExtensieComponent,
        OutlineButtonComponent,
        ButtonComponent,
        AsyncPipe,
        IconDirective
    ],
    providers: [provideIcons(IconInformatie, IconMap, IconChevronOnder, IconBijlage)]
})
export class BijlagenSelectieComponent implements OnInit, OnChanges {
    private formbuilder = inject(FormBuilder);
    @Input() bijlageMappen: BijlageMap[];
    @Input() bijlagen: Bijlage[];
    @Input() disableMappenSelectie: boolean;

    bijlagenAdded = output<any>();

    public aantalGeselecteerd$: Observable<number>;

    public bijlagenForm: FormGroup<BijlagenForm>;
    public bijlageType = BijlageType;
    public aantalGeselecteerd = 0;
    public expandedmappen: boolean[];

    public bijlageMapKleuren = new Map<BijlageMap, KleurenStackElement[]>();
    public bijlageKleuren = new Map<Bijlage, KleurenStackElement[]>();

    ngOnInit() {
        this.expandedmappen = this.bijlageMappen.map(() => false);
        const mapFormControls = this.bijlageMappen.map(
            (_map) =>
                new FormGroup({
                    map: new FormControl(false),
                    mapbijlagen: new FormArray(_map.bijlagen.map(() => new FormControl(false)))
                })
        );

        const bijlageFormControls = this.bijlagen.map(() => new FormControl(false));
        this.bijlagenForm = this.formbuilder.group({
            mappen: new FormArray(mapFormControls),
            bijlagen: new FormArray(bijlageFormControls)
        });

        const bijlagenSelecties$ = this.formBijlagen.valueChanges.pipe(startWith([]));
        const mappenSelecties$ = this.formMappen.valueChanges.pipe(startWith<BijlageMapGroup[]>([]));
        this.aantalGeselecteerd$ = combineLatest([bijlagenSelecties$, mappenSelecties$]).pipe(
            debounceTime(50),
            map(([bijlagen, mappen]) => {
                const geselecteerdeRootBijlagen: number = bijlagen.filter(Boolean).length;
                const geselecteerdeMappen: number = mappen.filter((mapcontrol) => mapcontrol.map).length;
                const geselecteerdeMapBijlagen = flatMap(mappen, (mapcontrol) => mapcontrol.mapbijlagen).filter(Boolean).length;
                return geselecteerdeRootBijlagen + geselecteerdeMappen + geselecteerdeMapBijlagen;
            }),
            startWith(0)
        );
    }

    ngOnChanges() {
        this.bijlageMappen.forEach((bijlageMap) =>
            this.bijlageMapKleuren.set(
                bijlageMap as BijlageMapFieldsFragment,
                this.createKleurenStack(bijlageMap as BijlageMapFieldsFragment)
            )
        );
        this.bijlagen.forEach((bijlage) =>
            this.bijlageKleuren.set(bijlage as BijlageFieldsFragment, this.createKleurenStack(bijlage as BijlageFieldsFragment))
        );
    }

    createKleurenStack(differentiatieObject: BijlageMapFieldsFragment | BijlageFieldsFragment): KleurenStackElement[] {
        return mapDifferentiatieToKleurenStackElements(
            differentiatieObject.differentiatiegroepen,
            differentiatieObject.differentiatieleerlingen
        );
    }

    toggleMapBijlageSelectie(bijlagemapIndex: number) {
        const formMapbijlagen = <FormArray>this.formMappen.controls[bijlagemapIndex].get('mapbijlagen');
        formMapbijlagen.controls.forEach((control) => {
            const mapSelectieValue = this.formMappen.controls[bijlagemapIndex].get('map')!.value;
            control.setValue(!mapSelectieValue);
        });
    }

    getMapbijlagen(bijlagemapIndex: number) {
        return <FormArray>this.formMappen.controls[bijlagemapIndex].get('mapbijlagen');
    }

    public submit() {
        // we mergen de checkbox waardes met de echte mappen, filteren dan op alle geselecteerde mappen
        // daarna mappen we het naar de echte map waarde, maar mappen de property bijlagen naar een
        // lijst van alle geselecteerde bijlagen
        const geselecteerdeMappen = zip<BijlageMapGroup, BijlageMap>(this.formMappen.value, this.bijlageMappen)
            .filter((groupAndMap) => groupAndMap[0]!.map)
            .map((groupAndMap) => ({
                ...groupAndMap[1],
                bijlagen: zip<Maybe<boolean>, Bijlage>(groupAndMap[0]!.mapbijlagen!, groupAndMap[1]!.bijlagen)
                    .filter((checkedAndBijlage) => checkedAndBijlage[0])
                    .map((checkedAndBijlage) => checkedAndBijlage[1])
            }));

        // We mergen de checkbox waardes met de echte waardes, filteren dan op alle niet geselecteerde mappen
        // Daarna mappen we elke niet geselecteerde map naar een lijstje van al zijn geselecteerde bijlagen
        // Deze checkox waarde zetten we uiteindelijk om in de echte waarde
        const bijlagenZonderMapSelectie = zip<BijlageMapGroup, BijlageMap>(this.formMappen.value, this.bijlageMappen)
            .filter((groupAndMap) => !groupAndMap[0]!.map)
            .map((groupAndMap) =>
                zip<Maybe<boolean>, Bijlage>(groupAndMap[0]!.mapbijlagen!, groupAndMap[1]!.bijlagen)
                    .filter((checkedAndBijlage) => checkedAndBijlage[0])
                    .map((checkedAndBijlage) => checkedAndBijlage[1])
            )
            .flatMap((x) => x);

        // We mergen de checkbox waardes met de echte waardes, filteren op alle geselecteerde bijlagen
        // en zetten deze dan om naar de echte bijlage waarde
        const losseBijlagen = zip<Maybe<boolean>, Bijlage>(this.formBijlagen.value, this.bijlagen)
            .filter((checkedAndBijlage) => checkedAndBijlage[0])
            .map((checkedAndBijlage) => checkedAndBijlage[1]);

        this.bijlagenAdded.emit({
            mappen: geselecteerdeMappen,
            bijlagen: [...losseBijlagen, ...bijlagenZonderMapSelectie]
        });
    }

    public openBijlage(bijlage: Bijlage) {
        if (bijlage && bijlage.url) {
            window.open(bijlage.url, '_blank');
        }
    }

    deselectAll() {
        this.bijlagenForm.reset();
    }

    toggleAllMappen(value: boolean) {
        this.formMappen.controls.forEach((mapgroup: FormGroup) => {
            if (!this.disableMappenSelectie) {
                mapgroup.get('map')!.setValue(value);
            }

            (<FormArray>mapgroup.get('mapbijlagen')).controls.forEach((c) => c.setValue(value));
        });
    }

    toggleBijlageSelectie(value: boolean) {
        this.formBijlagen.controls.map((checkbox: AbstractControl) => checkbox.setValue(value));
    }

    get formMappen() {
        return this.bijlagenForm.controls.mappen;
    }

    get formBijlagen() {
        return this.bijlagenForm.controls.bijlagen;
    }

    get selectedAllFormMappen(): boolean {
        const bijlagenInMappenGeselecteerd = this.formMappen.controls.every((mapgroup: FormGroup) =>
            (<FormArray>mapgroup.get('mapbijlagen')).controls.every((c: AbstractControl) => c.value)
        );

        return this.disableMappenSelectie
            ? bijlagenInMappenGeselecteerd
            : bijlagenInMappenGeselecteerd && this.formMappen.controls.every((mapgroup: FormGroup) => mapgroup.value);
    }

    get selectedAllFormBijlagen(): boolean {
        return this.formBijlagen.controls.every((checkbox: AbstractControl) => checkbox.value);
    }
}
