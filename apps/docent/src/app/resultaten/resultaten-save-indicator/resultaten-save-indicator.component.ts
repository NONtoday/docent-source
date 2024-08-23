import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, inject } from '@angular/core';
import { IconDirective, IconPillComponent, SpinnerComponent, TooltipDirective } from 'harmony';
import { IconNoRadio, IconVerversen, IconYesRadio, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';
import { ResultaatService } from '../resultaat.service';

@Component({
    selector: 'dt-resultaten-save-indicator',
    templateUrl: './resultaten-save-indicator.component.html',
    styleUrls: ['./resultaten-save-indicator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, BackgroundIconComponent, SpinnerComponent, AsyncPipe, IconDirective, IconPillComponent],
    providers: [provideIcons(IconVerversen, IconNoRadio, IconYesRadio)]
})
export class ResultatenSaveIndicatorComponent {
    public resultaatService = inject(ResultaatService);
    @Input() @HostBinding('class.with-background') withBackground = false;
}
