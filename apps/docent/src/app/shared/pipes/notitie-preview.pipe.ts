import { Pipe, PipeTransform } from '@angular/core';
import { stripHtmlTags, translateHtmlEntities } from '../utils/html.utils';

@Pipe({
    name: 'notitiePreview',
    standalone: true
})
export class NotitiePreviewPipe implements PipeTransform {
    transform(inhoud: string): string {
        return translateHtmlEntities(stripHtmlTags(inhoud)) || '';
    }
}
