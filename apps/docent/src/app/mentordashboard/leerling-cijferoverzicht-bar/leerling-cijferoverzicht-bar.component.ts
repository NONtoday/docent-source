import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, computed, inject, signal } from '@angular/core';
import { MentordashboardResultatenInstellingen } from '@docent/codegen';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { Optional } from '../../rooster-shared/utils/utils';
import { commaResult } from '../../shared/pipes/comma-result.pipe';

@Component({
    selector: 'dt-leerling-cijferoverzicht-bar',
    standalone: true,
    imports: [TooltipDirective],
    templateUrl: './leerling-cijferoverzicht-bar.component.html',
    styleUrls: ['./leerling-cijferoverzicht-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeerlingCijferoverzichtBarComponent {
    @HostBinding('class.met-label') @Input() label: Optional<string>;

    private _cijferOverzicht = signal<number[]>([]);
    @Input()
    set cijferOverzicht(cijferOverzicht: number[]) {
        this._cijferOverzicht.set(cijferOverzicht);
    }

    @Input({ required: true }) instellingen: MentordashboardResultatenInstellingen;

    private elementRef = inject(ElementRef);

    public vm = computed(() => {
        const { grenswaardeOnvoldoende, grenswaardeZwaarOnvoldoende } = this.instellingen;

        const zwaarOnvoldoendes = this._cijferOverzicht().filter((cijfer) => cijfer < grenswaardeZwaarOnvoldoende);
        const onvoldoendes = this._cijferOverzicht().filter(
            (cijfer) => cijfer >= grenswaardeZwaarOnvoldoende && cijfer < grenswaardeOnvoldoende
        );
        const voldoendes = this._cijferOverzicht().filter((cijfer) => cijfer >= grenswaardeOnvoldoende);

        const totaalAantalCijfers = this._cijferOverzicht().length;
        const aantalZwaarOnvoldoendes = zwaarOnvoldoendes.length;
        const aantalOnvoldoendes = onvoldoendes.length;
        const aantalVoldoendes = voldoendes.length;

        const percentZwaarOnvoldoendes = (aantalZwaarOnvoldoendes / totaalAantalCijfers) * 100;
        const percentOnvoldoendes = (aantalOnvoldoendes / totaalAantalCijfers) * 100;
        const percentVoldoendes = (aantalVoldoendes / totaalAantalCijfers) * 100;

        const BarMinWidth = '30px';

        let templateColumns = '';
        if (aantalZwaarOnvoldoendes > 0) {
            templateColumns += `minmax(${BarMinWidth}, ${percentZwaarOnvoldoendes}%) `;
        }
        if (aantalOnvoldoendes > 0) {
            templateColumns += `minmax(${BarMinWidth}, ${percentOnvoldoendes}%) `;
        }
        if (aantalVoldoendes > 0) {
            templateColumns += `minmax(${BarMinWidth}, ${percentVoldoendes}%)`;
        }

        this.elementRef.nativeElement.style.setProperty('--template-columns', templateColumns);

        return {
            heeftResultaten: totaalAantalCijfers > 0,
            zwaarOnvoldoendes: {
                cijfers: zwaarOnvoldoendes,
                leftRadius: aantalZwaarOnvoldoendes > 0,
                rightRadius: aantalZwaarOnvoldoendes > 0 && aantalOnvoldoendes === 0 && aantalVoldoendes === 0,
                visible: aantalZwaarOnvoldoendes > 0,
                tooltip: `<b>Zwaar onvoldoende</b><br>${aantalZwaarOnvoldoendes} ${
                    aantalZwaarOnvoldoendes === 1 ? 'vak' : 'vakken'
                } < ${commaResult(grenswaardeZwaarOnvoldoende)}`
            },
            onvoldoendes: {
                cijfers: onvoldoendes,
                leftRadius: aantalOnvoldoendes > 0 && aantalZwaarOnvoldoendes === 0,
                rightRadius: aantalOnvoldoendes > 0 && aantalVoldoendes === 0,
                visible: aantalOnvoldoendes > 0,
                tooltip: `<b>Onvoldoende</b><br>${aantalOnvoldoendes} ${aantalOnvoldoendes === 1 ? 'vak' : 'vakken'} < ${commaResult(
                    grenswaardeOnvoldoende
                )}`
            },
            voldoendes: {
                cijfers: voldoendes,
                leftRadius: aantalVoldoendes > 0 && aantalOnvoldoendes === 0 && aantalZwaarOnvoldoendes === 0,
                rightRadius: aantalVoldoendes > 0,
                visible: aantalVoldoendes > 0,
                tooltip: `<b>Voldoende</b><br>${aantalVoldoendes} ${aantalVoldoendes === 1 ? 'vak' : 'vakken'} >= ${commaResult(
                    grenswaardeOnvoldoende
                )}`
            }
        };
    });
}
