import { ChangeDetectionStrategy, Component, Input, ViewChild, ViewContainerRef, output } from '@angular/core';
import { PartialLeerlingFragment } from '@docent/codegen';
import { IconDirective } from 'harmony';
import { IconChevronOnder, IconOpties, IconPijlLinks, provideIcons } from 'harmony-icons';
import { AvatarComponent } from '../../rooster-shared/components/avatar/avatar.component';

@Component({
    selector: 'dt-vak-navigatie-header',
    standalone: true,
    imports: [AvatarComponent, IconDirective],
    templateUrl: './vak-navigatie-header.component.html',
    styleUrls: ['./vak-navigatie-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconPijlLinks, IconChevronOnder, IconOpties)]
})
export class VakNavigatieHeaderComponent {
    @ViewChild('moreOptionsIcon', { read: ViewContainerRef }) moreOptionsRef: ViewContainerRef;
    @ViewChild('avatar', { read: ViewContainerRef }) avatarRef: ViewContainerRef;

    @Input() vaknaam: string;
    @Input() leerling: PartialLeerlingFragment;

    terugClick = output<void>();
    vakClick = output<ViewContainerRef>();
    meerOptiesClick = output<ViewContainerRef>();

    onMeerOptiesClick = () => this.meerOptiesClick.emit(this.moreOptionsRef);
    onVakClick = () => this.vakClick.emit(this.avatarRef);
}
