import { Pipe, PipeTransform } from '@angular/core';

export const toCyTag = (value: string): string => value.replace(new RegExp(' ', 'g'), '-').toLowerCase();

@Pipe({
    name: 'toCyTag',
    standalone: true
})
export class ToCyTagPipe implements PipeTransform {
    transform(value: string): string {
        return toCyTag(value);
    }
}
