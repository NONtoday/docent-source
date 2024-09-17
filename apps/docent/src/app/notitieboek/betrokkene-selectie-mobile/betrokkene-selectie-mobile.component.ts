import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    output
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Maybe, ZoekBetrokkenenQuery } from '@docent/codegen';
import { AvatarTagComponent, IconDirective, IconTagComponent, PillComponent } from 'harmony';
import { IconGroep, IconPijlLinks, IconToevoegen, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ButtonComponent } from '../../rooster-shared/components/button/button.component';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { VolledigeNaamPipe } from '../../rooster-shared/pipes/volledige-naam.pipe';
import { notEqualsId, toId } from '../../rooster-shared/utils/utils';
import { Betrokkene, BetrokkeneTag } from '../betrokkene-selectie/betrokkene-selectie.component';
import { betrokkeneToTag } from '../notitieboek.util';

@Component({
    selector: 'dt-betrokkene-selectie-mobile',
    standalone: true,
    imports: [
        BackgroundIconComponent,
        AvatarTagComponent,
        IconTagComponent,
        AvatarComponent,
        ReactiveFormsModule,
        OutlineButtonComponent,
        ButtonComponent,
        VolledigeNaamPipe,
        IconDirective,
        PillComponent
    ],
    templateUrl: './betrokkene-selectie-mobile.component.html',
    styleUrls: ['./betrokkene-selectie-mobile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconPijlLinks, IconToevoegen, IconGroep)]
})
export class BetrokkeneSelectieMobileComponent implements OnChanges, AfterViewInit {
    @ViewChild('search') searchInput: ElementRef;
    @Input() searchResults: Maybe<ZoekBetrokkenenQuery['zoekBetrokkenen']>;

    @Input() searchControl: FormControl;
    @Input() geenResultaten: boolean;
    @Input() contextId: string;

    closeToevoegen = output<void>();
    onToevoegen = output<Betrokkene[]>();

    betrokkenenSelectie: Betrokkene[] = [];
    betrokkenenTags: BetrokkeneTag[] = [];
    filteredSearchResults: ZoekBetrokkenenQuery['zoekBetrokkenen'];

    ngOnChanges(changes: SimpleChanges) {
        if (this.searchResults && changes.searchResults.currentValue !== changes.searchResults.previousValue) {
            this.filteredSearchResults = this.filterSearchResults(this.searchResults);
        }
    }

    ngAfterViewInit() {
        this.searchInput.nativeElement.focus();
    }

    addBetrokkene(event: Event, betrokkene: Betrokkene) {
        this.betrokkenenSelectie = [...this.betrokkenenSelectie, betrokkene];
        this.betrokkenenTags = this.betrokkenenSelectie.map(betrokkeneToTag);
        this.filteredSearchResults = this.filterSearchResults(this.filteredSearchResults);
        this.searchControl.setValue('');
        this.focusInput();
        event.stopPropagation();
    }

    removeBetrokkene(id: string) {
        this.betrokkenenSelectie = this.betrokkenenSelectie.filter(notEqualsId(id));
        this.betrokkenenTags = this.betrokkenenSelectie.map(betrokkeneToTag);
        this.filteredSearchResults = this.filterSearchResults(this.filteredSearchResults);
        this.focusInput();
    }

    focusInput() {
        this.searchInput.nativeElement.focus();
    }

    filterSearchResults = (results: ZoekBetrokkenenQuery['zoekBetrokkenen']): ZoekBetrokkenenQuery['zoekBetrokkenen'] => ({
        leerlingen: results.leerlingen.filter((l) => !this.betrokkenenSelectie.map(toId).includes(l.leerling.id)),
        lesgroepen: results.lesgroepen.filter((l) => !this.betrokkenenSelectie.map(toId).includes(l.id)),
        stamgroepen: results.stamgroepen.filter((s) => !this.betrokkenenSelectie.map(toId).includes(s.id))
    });

    close() {
        this.betrokkenenSelectie = [];
        this.betrokkenenTags = [];
        this.closeToevoegen.emit();
    }

    toevoegen() {
        this.onToevoegen.emit(this.betrokkenenSelectie);
        this.close();
    }

    trackById = (index: number, item: BetrokkeneTag) => item.id;
}
