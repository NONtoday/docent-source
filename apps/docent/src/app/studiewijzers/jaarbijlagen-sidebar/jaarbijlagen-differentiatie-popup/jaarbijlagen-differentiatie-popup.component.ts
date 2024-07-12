import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CounterTagComponent, TagComponent } from 'harmony';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Differentiatiegroep, Leerling } from '../../../../generated/_types';
import { background_3, typography_3 } from '../../../rooster-shared/colors';
import { Popup, PopupComponent } from '../../../rooster-shared/components/popup/popup.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { VolledigeNaamPipe } from '../../../rooster-shared/pipes/volledige-naam.pipe';
import { PopupButtonComponent } from '../../../shared/components/popup-button/popup-button.component';
import { KleurToTagColorPipe } from '../../../shared/pipes/color-to-text-color.pipe';
import { groepTooltip } from '../../../shared/utils/tooltips.utils';

@Component({
    selector: 'dt-jaarbijlagen-differentiatie-popup',
    templateUrl: './jaarbijlagen-differentiatie-popup.component.html',
    styleUrls: ['./jaarbijlagen-differentiatie-popup.component.scss'],
    standalone: true,
    imports: [
        PopupComponent,
        PopupButtonComponent,
        CounterTagComponent,
        TagComponent,
        TooltipDirective,
        AsyncPipe,
        VolledigeNaamPipe,
        KleurToTagColorPipe
    ],
    providers: [provideIcons(IconToevoegen)]
})
export class JaarbijlagenDifferentiatiePopupComponent implements Popup, OnInit {
    @ViewChild(PopupComponent, { static: true }) popup: PopupComponent;

    differentiatiegroepen: Subject<Differentiatiegroep[]>;
    differentiatieleerlingen: Subject<Leerling[]>;
    showIedereen$: Observable<boolean>;
    differentierenGtmTag: string;
    editAllowed: boolean;

    groepTooltip = groepTooltip;

    public background_3 = background_3;
    public typography_3 = typography_3;

    ngOnInit(): void {
        this.showIedereen$ = combineLatest([this.differentiatiegroepen, this.differentiatieleerlingen]).pipe(
            map(([groepen, leerlingen]) => groepen.length === 0 && leerlingen.length === 0)
        );
    }

    onToevoegenFunction: () => void;
    removeGroepFunction: (groep: Differentiatiegroep) => void;
    removeLeerlingFunction: (leerling: Leerling) => void;

    onToevoegen() {
        this.onToevoegenFunction?.();
    }

    removeGroep(groep: Differentiatiegroep) {
        this.removeGroepFunction?.(groep);
    }

    removeLeerling(leerling: Leerling) {
        this.removeLeerlingFunction?.(leerling);
    }

    mayClose(): boolean {
        return true;
    }
}
