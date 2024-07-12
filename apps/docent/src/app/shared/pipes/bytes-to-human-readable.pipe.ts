import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'bytesToHumanReadable',
    standalone: true
})
export class BytesToHumanReadablePipe implements PipeTransform {
    transform(fileSize: number): string {
        let unitCounter = 0;
        const byteUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        while (fileSize >= 1000) {
            fileSize /= 1000;
            unitCounter += 1;
        }

        if (unitCounter === 0 || fileSize % 1 === 0) {
            return String(Math.max(fileSize, 0.1)) + byteUnits[unitCounter];
        }
        return Math.max(fileSize, 0.1).toFixed(1) + byteUnits[unitCounter];
    }
}
