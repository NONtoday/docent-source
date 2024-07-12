/* eslint-disable @typescript-eslint/restrict-plus-operands */
export function parseErrorMessage(msgString: string): string {
    if (msgString.indexOf('Http failure response') > -1) {
        return 'Kan geen verbinding maken met de server';
    }
    if (msgString.indexOf('connect ECONNREFUSED') > -1) {
        return 'Kan geen gegevens opvragen van de server';
    }
    if (msgString.indexOf('Subject does not have permission') > -1) {
        return 'Sorry, je bent hiertoe niet bevoegd.';
    }

    const msgObjectIx = msgString.indexOf('{');
    if (msgObjectIx > -1) {
        const m = msgString.substring(msgObjectIx);
        const msgObject = JSON.parse(m);

        if (!msgObject.message) {
            return 'Onbekende fout opgetreden';
        }

        const isJavaMessage = msgObject.message.indexOf('java.lang.') > -1;
        const msgIx = isJavaMessage ? msgObject.message.indexOf(':') + 1 : 0;
        return msgObject.message.substring(msgIx).trim();
    }
    const quoteRegExp = /"/g;
    return msgString.replace('400 - ', '').replace(quoteRegExp, '').trim();
}
