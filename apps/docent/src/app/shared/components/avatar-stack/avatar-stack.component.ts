import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, OnChanges, inject } from '@angular/core';
import { LesgroepFieldsFragment, Maybe, PartialLeerlingFragment, StamgroepFieldsFragment } from '@docent/codegen';
import { IconGroep, provideIcons } from 'harmony-icons';
import { orderBy } from 'lodash-es';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';
import { BackgroundIconComponent } from '../../../rooster-shared/components/background-icon/background-icon.component';
import { BackgroundIconColor } from '../../../rooster-shared/utils/color-token-utils';

interface AvatarStackItem {
    pasfoto?: Maybe<string>;
    initialen?: string;
    color?: Maybe<BackgroundIconColor>;
    prio: boolean;
}
type AvatarStackNarrowSpacing = 2;
type AvatarStackWideSpacing = 4;
type AvatarStackSpacing = AvatarStackNarrowSpacing | AvatarStackWideSpacing;

@Component({
    selector: 'dt-avatar-stack',
    standalone: true,
    imports: [AvatarComponent, BackgroundIconComponent],
    templateUrl: './avatar-stack.component.html',
    styleUrls: ['./avatar-stack.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [provideIcons(IconGroep)]
})
export class AvatarStackComponent implements OnChanges {
    private elementRef = inject(ElementRef);
    @HostBinding('style.width.px') public width: number;
    @Input() altijdTonen: string[] = [];
    @Input() leerlingen: PartialLeerlingFragment[] = [];
    @Input() lesgroepen: LesgroepFieldsFragment[] = [];
    @Input() stamgroepen: StamgroepFieldsFragment[] = [];
    @Input() maxshown = 3;
    @Input() spacing: AvatarStackSpacing = 2;

    @Input() set size(stackSize: AvatarStackSize) {
        this.stackSize = stackSize;
        this.fontSize = AvatarStackFontSize[this.stackSize];
    }

    public stack: Array<AvatarStackItem> = [];
    public counter = 0;
    public stackSize: AvatarStackSize = 24;
    public fontSize = AvatarStackFontSize[this.stackSize];

    ngOnChanges(): void {
        this.stack = orderBy(
            [
                ...this.leerlingen.map(this.leerlingToStackItem),
                ...this.lesgroepen.map(this.groepToStackItem),
                ...this.stamgroepen.map(this.groepToStackItem)
            ],
            ['prio'],
            'desc'
        );
        const aantalPrio = this.stack.filter((item) => item.prio).length;
        const totaalAantal = this.stack.length;
        const aantalAvatars = Math.min(Math.max(this.maxshown, aantalPrio), totaalAantal);
        this.counter = totaalAantal - aantalAvatars;
        this.elementRef.nativeElement.style.setProperty('--margin-right', `-${this.stackSize / this.spacing}px`);
    }

    leerlingToStackItem = (leerling: PartialLeerlingFragment): AvatarStackItem => ({
        pasfoto: leerling.pasfoto,
        initialen: leerling.initialen,
        prio: this.altijdTonen.includes(leerling.id)
    });

    groepToStackItem = (groep: LesgroepFieldsFragment | StamgroepFieldsFragment): AvatarStackItem => ({
        color: groep.color as BackgroundIconColor,
        prio: this.altijdTonen.includes(groep.id)
    });
}

type AvatarStackSize = 20 | 24 | 32;
const AvatarStackFontSize: Record<AvatarStackSize, number> = { 20: 8, 24: 9, 32: 10 };
