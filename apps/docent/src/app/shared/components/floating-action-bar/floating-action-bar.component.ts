import { ChangeDetectionStrategy, Component, HostBinding, Input, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { ColorToken } from 'harmony';
import { IconBewerken, IconGesynchroniseerd, IconName, IconPijlBoven, IconSynchroniseren, IconWerkdruk, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { Optional } from '../../../rooster-shared/utils/utils';
import { FloatingActionComponent } from './floating-action/floating-action.component';

export interface FloatingAction {
    icon: IconName;
    action: (buttonRef: ViewContainerRef) => void;
    color?: Optional<ColorToken>;
    hoverColor?: Optional<ColorToken>;
    tooltip?: Optional<string>;
    checked?: Optional<boolean>;
    disabled?: Optional<boolean>;
    notificatie?: Optional<boolean> | Optional<Observable<boolean>>;
    name?: Optional<string>;
    gtmTag?: Optional<string>;
    cyTag?: Optional<string>;
}

export const bewerkButton = (bewerkFn: () => void): FloatingAction => ({
    icon: 'bewerken',
    tooltip: 'Bewerken',
    action: bewerkFn
});

export const backToTopButton = (): FloatingAction => ({
    icon: 'pijlBoven',
    tooltip: 'Terug naar boven',
    action: () =>
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
});

export const studiewijzerSynchroniserenButton = (bewerkFn: () => void, heeftSynchronisaties: boolean): FloatingAction => ({
    icon: heeftSynchronisaties ? 'gesynchroniseerd' : 'synchroniseren',
    tooltip: 'Synchroniseren',
    action: bewerkFn,
    gtmTag: 'synchronisaties-bekijken',
    color: heeftSynchronisaties ? 'action-positive-normal' : 'action-primary-normal',
    hoverColor: heeftSynchronisaties ? 'action-positive-strong' : 'action-primary-strong'
});

export const sjabloonSynchroniserenButton = (
    onClick: (buttonRef: ViewContainerRef) => void,
    heeftSynchronisaties: boolean,
    disabled: boolean
): FloatingAction => ({
    icon: heeftSynchronisaties ? 'gesynchroniseerd' : 'synchroniseren',
    tooltip: disabled ? 'Je bent niet gekoppeld aan een vaksectie en kan daardoor niet synchroniseren met een sjabloon' : 'Synchroniseren',
    action: onClick,
    disabled,
    gtmTag: 'synchronisaties-bekijken',
    color: heeftSynchronisaties ? 'action-positive-normal' : 'action-primary-normal',
    hoverColor: heeftSynchronisaties ? 'action-positive-strong' : 'action-primary-strong'
});

export const werkdrukButton = (onClickFn: (buttonRef: ViewContainerRef) => void): FloatingAction => ({
    icon: 'werkdruk',
    action: onClickFn,
    tooltip: 'Werkdruk inzien',
    gtmTag: 'werkdruk'
});

@Component({
    selector: 'dt-floating-action-bar',
    templateUrl: './floating-action-bar.component.html',
    styleUrls: ['./floating-action-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [FloatingActionComponent],
    providers: [provideIcons(IconBewerken, IconPijlBoven, IconGesynchroniseerd, IconSynchroniseren, IconWerkdruk)]
})
export class FloatingActionBarComponent {
    @ViewChildren(FloatingActionComponent, { read: ViewContainerRef }) buttons: QueryList<ViewContainerRef>;

    @Input() actions: Optional<FloatingAction[]> = [];
    @Input() @HostBinding('style.bottom.px') bottom = '16';

    @HostBinding('class.hide')
    public get hide(): boolean {
        return !this.actions || this.actions.length === 0;
    }
}
