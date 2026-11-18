/**
 * HTML → plain text conversion shared by the Telegram mail renderer and the
 * AI/local extraction pipeline.
 *
 * Many transactional emails (e.g. account confirmation mails from Meta/Google)
 * are HTML-only: they carry no text/plain part at all. PostalMime therefore
 * yields an empty `text` field while `html` still holds the real content.
 * Rendering only `text` makes those mails look empty in Telegram. Converting
 * the HTML to readable text here provides a consistent fallback.
 */

export function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: ' ',
    };

    const decodeCodePoint = (value: number, fallback: string) => {
        if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) {
            return fallback;
        }
        return String.fromCodePoint(value);
    };

    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
        const normalized = entity.toLowerCase();
        if (normalized.startsWith('#x')) {
            const value = Number.parseInt(normalized.slice(2), 16);
            return decodeCodePoint(value, match);
        }
        if (normalized.startsWith('#')) {
            const value = Number.parseInt(normalized.slice(1), 10);
            return decodeCodePoint(value, match);
        }
        return entities[normalized] ?? match;
    });
}

export function htmlToText(html: string): string {
    return decodeHtmlEntities(
        html
            .replace(/<\s*(script|style|head|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, ' $3 $2 ')
            .replace(/<\s*br\s*\/?>/gi, '\n')
            .replace(/<\/\s*(p|div|tr|td|th|li|table|section|article|header|footer|h[1-6])\s*>/gi, '\n')
            .replace(/<[^>]+>/g, ' ')
    )
        .replace(/[ \t\r\f\v]+/g, ' ')
        .replace(/\n\s+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
