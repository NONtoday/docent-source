import { Pipe, PipeTransform } from '@angular/core';
import { stripHtmlTags } from '../utils/studiewijzer.utils';

@Pipe({
    name: 'notitiePreview',
    standalone: true
})
export class NotitiePreviewPipe implements PipeTransform {
    transform(inhoud: string): string {
        return stripHtmlTags(inhoud) || '';
    }
}
