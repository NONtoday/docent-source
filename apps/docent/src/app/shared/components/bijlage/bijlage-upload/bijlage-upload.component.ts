import { Component, Input, output } from '@angular/core';

import { IconDirective } from 'harmony';
import { IconSluiten, IconVerversen, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { BytesToHumanReadablePipe } from '../../../pipes/bytes-to-human-readable.pipe';
import { ProgressbarComponent } from '../../progressbar/progressbar.component';
import { UploadFile } from '../bijlage-upload-lijst/bijlage-upload-lijst.component';

@Component({
    selector: 'dt-bijlage-upload',
    templateUrl: './bijlage-upload.component.html',
    styleUrls: ['./bijlage-upload.component.scss'],
    standalone: true,
    imports: [ProgressbarComponent, BytesToHumanReadablePipe, IconDirective],
    providers: [provideIcons(IconWaarschuwing, IconVerversen, IconSluiten)]
})
export class BijlageUploadComponent {
    @Input() file: UploadFile;
    protected haltBijlageUpload = output<UploadFile>();
    protected retryBijlageUpload = output<UploadFile>();

    public haltUpload() {
        this.haltBijlageUpload.emit(this.file);
    }

    public retryUpload() {
        this.retryBijlageUpload.emit(this.file);
    }
}
