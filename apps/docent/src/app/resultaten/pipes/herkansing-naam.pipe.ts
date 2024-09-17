import { Pipe, PipeTransform } from '@angular/core';
import { Herkansing } from '@docent/codegen';

export const convertHerkansingToNaam = (herkansing: Herkansing): string => {
    switch (herkansing) {
        case Herkansing.Geen:
            return 'Geen herkansing';
        case Herkansing.EenKeerHoogste:
            return 'Hoogste, 1 herkansing';
        case Herkansing.EenKeerLaatste:
            return 'Laatste, 1 herkansing';
        case Herkansing.EenkeerGemiddeld:
            return 'Gemiddelde, 1 herkansing';
        case Herkansing.TweeKeerGemiddeld:
            return 'Gemiddelde, 2 herkansingen';
        case Herkansing.TweeKeerHoogste:
            return 'Hoogste, 2 herkansingen';
        case Herkansing.TweeKeerLaatste:
            return 'Laatste, 2 herkansingen';
    }
};

@Pipe({
    name: 'herkansingNaam',
    standalone: true
})
export class HerkansingNaamPipe implements PipeTransform {
    transform(herkansing: Herkansing): string {
        return convertHerkansingToNaam(herkansing);
    }
}
