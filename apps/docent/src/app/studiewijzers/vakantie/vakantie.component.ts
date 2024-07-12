import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'dt-vakantie',
    template: `<span class="naam text-content-small-semi">{{ vakantieNaam }}</span>`,
    styleUrls: ['./vakantie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class VakantieComponent {
    @Input() vakantieNaam: string;
}
