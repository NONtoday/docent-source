import { CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { inject } from '@angular/core';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnInit,
    ViewChild,
    ViewContainerRef,
    output
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Sjabloon, SjabloonCategorie, Studiewijzer, StudiewijzerCategorie } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconBewerken, IconDraggable, IconOpties, IconPijlBoven, IconPijlOnder, IconVerwijderen, provideIcons } from 'harmony-icons';
import get from 'lodash-es/get';
import { fromEvent, merge } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { PopupService } from '../../core/popup/popup.service';
import { IconComponent } from '../../rooster-shared/components/icon/icon.component';
import { AutofocusDirective } from '../../rooster-shared/directives/autofocus.directive';
import { SjabloonOverzichtItemComponent } from '../sjabloon-overzicht/sjabloon-overzicht-item/sjabloon-overzicht-item.component';
import { StudiewijzerOverzichtItemComponent } from '../studiewijzer-overzicht/studiewijzer-overzicht-item/studiewijzer-overzicht-item.component';

export type CategorieMove = 1 | -1;
export type AbstractStudiewijzerCategorie = SjabloonCategorie | StudiewijzerCategorie;
export interface CategorieMoreActionsClick {
    viewContainerRef: ViewContainerRef;
    showUp: boolean;
    showDown: boolean;
    focusInputAndListenToEnterEvent: () => void;
}
export interface CategorieDeleteClick {
    element: ViewContainerRef;
    cancelFn: () => void;
    deleteFn: () => void;
}

@Component({
    selector: 'dt-abstract-studiewijzer-categorie',
    templateUrl: './abstract-studiewijzer-categorie.component.html',
    styleUrls: ['./abstract-studiewijzer-categorie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        AutofocusDirective,
        ReactiveFormsModule,
        IconComponent,
        CdkDropList,
        SjabloonOverzichtItemComponent,
        CdkDrag,
        RouterLink,
        CdkDragPlaceholder,
        CdkDragHandle,
        StudiewijzerOverzichtItemComponent,
        IconDirective
    ],
    providers: [provideIcons(IconBewerken, IconVerwijderen, IconPijlBoven, IconPijlOnder, IconOpties, IconDraggable)]
})
export class AbstractStudiewijzerCategorieComponent implements OnInit, OnChanges, AfterViewInit {
    public popupService = inject(PopupService);
    private changeDetector = inject(ChangeDetectorRef);
    @ViewChild('naam', { read: ElementRef, static: true }) inputElementRef: ElementRef;
    @ViewChild('delete', { read: ViewContainerRef, static: true }) deleteElementRef: ViewContainerRef;
    @ViewChild('moreactions', { read: ViewContainerRef, static: true }) moreActionsRef: ViewContainerRef;
    @HostBinding('class.geen-items') geenItems = false;

    @Input() categorie: AbstractStudiewijzerCategorie;
    @Input() showOrderUp: boolean;
    @Input() showOrderDown: boolean;

    public naamInput = new UntypedFormControl('', [Validators.required]);
    public alwaysShowIcons: boolean;

    setEditMode = output<boolean>();
    saveCategorie = output<AbstractStudiewijzerCategorie>();
    deleteCategorie = output<CategorieDeleteClick>();
    moveCategorie = output<CategorieMove>();
    removeEmptyCategories = output<void>();
    moreActionsClick = output<CategorieMoreActionsClick>();
    onItemDrop = output<any>();

    ngOnInit() {
        this.naamInput.patchValue(this.categorie.naam);
    }

    ngOnChanges() {
        this.geenItems =
            !this.categorie || (get(this.categorie, 'sjablonen.length', 0) === 0 && get(this.categorie, 'studiewijzers.length', 0) === 0);
    }

    ngAfterViewInit() {
        if (this.categorie.inEditMode) {
            this.setFocusOnInput();
            this.removeEditModeOnEnterAndBlur();
        }
    }

    enableEditMode() {
        this.setEditMode.emit(true);

        setTimeout(() => {
            this.setFocusOnInput();
            this.removeEditModeOnEnterAndBlur();
        });
    }

    orderUp() {
        this.moveCategorie.emit(-1);
    }

    orderDown() {
        this.moveCategorie.emit(1);
    }

    onDeleteClick() {
        this.alwaysShowIcons = true;
        const hideIcons = () => {
            this.alwaysShowIcons = false;
            this.changeDetector.detectChanges();
        };
        this.deleteCategorie.emit({ element: this.deleteElementRef, cancelFn: hideIcons, deleteFn: hideIcons });
    }

    onMoreActionsClick() {
        this.moreActionsClick.emit({
            viewContainerRef: this.moreActionsRef,
            showUp: this.showOrderUp,
            showDown: this.showOrderDown,
            focusInputAndListenToEnterEvent: () => {
                setTimeout(() => {
                    this.setFocusOnInput();
                    this.removeEditModeOnEnterAndBlur();
                });
            }
        });
    }

    private removeEditModeOnEnterAndBlur() {
        const onEnterPress$ = fromEvent(this.inputElementRef.nativeElement, 'keyup').pipe(filter((e: KeyboardEvent) => e.key === 'Enter'));
        const onBlur$ = fromEvent(this.inputElementRef.nativeElement, 'blur');
        merge(onEnterPress$, onBlur$)
            .pipe(take(1))
            .subscribe(() => {
                if (this.naamInput.valid) {
                    this.saveCategorie.emit({ ...this.categorie, naam: this.naamInput.value });
                } else {
                    this.removeEmptyCategories.emit();
                }
            });
    }

    private setFocusOnInput() {
        this.inputElementRef.nativeElement.focus();
    }

    trackById(index: number, item: Sjabloon | Studiewijzer) {
        return item.id;
    }

    closePopup() {
        if (this.popupService.isPopupOpen()) {
            this.popupService.closePopUp();
        }
    }
}
