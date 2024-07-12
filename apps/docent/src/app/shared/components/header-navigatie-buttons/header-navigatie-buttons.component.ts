import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewContainerRef, output } from '@angular/core';
import { BrowseComponent, IconDirective } from 'harmony';
import { IconChevronLinks, IconChevronRechts, IconOpties, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { TooltipDirective } from '../../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../../rooster-shared/utils/utils';

@Component({
    selector: 'dt-header-navigatie-buttons',
    standalone: true,
    imports: [BackgroundIconComponent, TooltipDirective, IconDirective, BrowseComponent],
    templateUrl: './header-navigatie-buttons.component.html',
    styleUrls: ['./header-navigatie-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconChevronLinks, IconChevronRechts, IconOpties)]
})
export class HeaderNavigatieButtonsComponent {
    @ViewChild('moreOptionsIcon', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;

    @Input() heeftVorige: boolean;
    @Input() heeftVolgende: boolean;
    @Input() vorigeTooltip: Optional<string>;
    @Input() volgendeTooltip: Optional<string>;
    @Input() showMoreOptions = true;
    @Input() gtmVorigeButton: string;
    @Input() gtmVolgendeButton: string;

    vorigeClick = output<void>();
    volgendeClick = output<void>();
    meerOptiesClick = output<ViewContainerRef>();

    onMeerOptiesClick = () => this.meerOptiesClick.emit(this.moreOptionsRef);

    onVorigeClick = () => {
        if (this.heeftVorige) {
            this.vorigeClick.emit();
        }
    };

    onVolgendeClick = () => {
        if (this.heeftVolgende) {
            this.volgendeClick.emit();
        }
    };
}
