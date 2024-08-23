import { isNull, isUndefined } from 'lodash-es';
import { Optional } from '../../rooster-shared/utils/utils';

/**
 *
 *
 * Verwijdert html-tags uit de gegeven string.
 *
 * Dit is geen volwaardige plaintext conversie, doet nl. bijv. niets met html-entities, whitespace, etc.
 *
 *
 *
 * @param content de te filteren string
 * @returns content zonder html-tags
 */
export function stripHtmlTags(content: Optional<string>): Optional<string> {
    if (isNull(content) || isUndefined(content)) return null;
    return content.replace(/<[^>]*>?/gm, '');
}

/**
 *
 *
 * Verwijdert &nbsp;-tags uit de gegeven string.
 *
 *
 *
 * @param content de te filteren string
 * @returns content zonder &nbsp;-tags
 */
export function stripWhitespace(content: Optional<string>): Optional<string> {
    if (isNull(content) || isUndefined(content)) return null;
    return content.replace(/&nbsp;/g, '');
}

/**
 *
 *
 * Vertaalt HTML character entities.
 *
 * Vertaalt alleen &, ', ", < en >.
 *
 * LET OP: niet gebruiken voor innerHTML als de invoer niet vertrouwd is!
 *
 *
 *
 * @param content de te vertalen string
 * @returns content met vertaalde HTML entities.
 */
export function translateHtmlEntities(content: Optional<string>): Optional<string> {
    if (isNull(content) || isUndefined(content)) return null;
    return content
        .replace(/&(quot|#34);/g, '"')
        .replace(/&(apos|#39);/g, "'")
        .replace(/&(lt|#60);/g, '<')
        .replace(/&(gt|#62);/g, '>')
        .replace(/&(amp|#38);/g, '&');
}
