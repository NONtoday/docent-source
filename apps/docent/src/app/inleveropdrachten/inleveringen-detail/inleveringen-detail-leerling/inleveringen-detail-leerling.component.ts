import { Component, Input } from '@angular/core';
import { Leerling } from '../../../../generated/_types';
import { AvatarComponent } from '../../../rooster-shared/components/avatar/avatar.component';

@Component({
    selector: 'dt-inleveringen-detail-leerling',
    templateUrl: './inleveringen-detail-leerling.component.html',
    styleUrls: ['./inleveringen-detail-leerling.component.scss'],
    standalone: true,
    imports: [AvatarComponent]
})
export class InleveringenDetailLeerlingComponent {
    @Input() leerling: Leerling;
}
