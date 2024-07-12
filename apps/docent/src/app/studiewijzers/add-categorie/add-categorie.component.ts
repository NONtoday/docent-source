import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IconToevoegen, provideIcons } from 'harmony-icons';
import { BackgroundIconComponent } from '../../rooster-shared/components/background-icon/background-icon.component';

@Component({
    selector: 'dt-add-categorie',
    templateUrl: './add-categorie.component.html',
    styleUrls: ['./add-categorie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BackgroundIconComponent],
    providers: [provideIcons(IconToevoegen)]
})
export class AddCategorieComponent {
    addCategorie = output<void>();
}
