import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeHtmlEntities, htmlToText } from '../../../worker/src/html_to_text.ts';

test('htmlToText converts an HTML-only mail body to readable text', () => {
  const html = [
    '<html><body>',
    '<h1>Confirm your email</h1>',
    '<p>Hi there,</p>',
    '<p>Please confirm your email address by clicking the link below.</p>',
    '<a href="https://account.meta.com/confirm?token=abc123">Confirm your email</a>',
    '</body></html>',
  ].join('');

  const text = htmlToText(html);

  assert.match(text, /Confirm your email/);
  assert.match(text, /confirm your email address/i);
  // Anchor text and href are both preserved so verification links stay usable.
  assert.match(text, /https:\/\/account\.meta\.com\/confirm\?token=abc123/);
  assert.doesNotMatch(text, /<[a-z]+/);
});

test('htmlToText strips script, style and comments', () => {
  const html = [
    '<style>.secret { color: red; }</style>',
    '<script>alert("no")</script>',
    '<!-- hidden note -->',
    '<p>Visible content</p>',
  ].join('');

  const text = htmlToText(html);

  assert.match(text, /Visible content/);
  assert.doesNotMatch(text, /alert|secret|hidden note/i);
});

test('htmlToText decodes HTML entities and normalizes whitespace', () => {
  const html = '<p>Your&nbsp;code&nbsp;is&nbsp;123456 &amp; more</p>';
  assert.equal(htmlToText(html), 'Your code is 123456 & more');
});

test('htmlToText turns br and block closes into line breaks', () => {
  const html = '<p>line one</p><p>line two<br>continued</p>';
  const text = htmlToText(html);
  assert.match(text, /line one\nline two/);
  assert.match(text, /line two\ncontinued/);
});

test('decodeHtmlEntities handles numeric and hex references', () => {
  assert.equal(decodeHtmlEntities('&#65;&#x42;&amp;&lt;&gt;'), 'AB&<>');
  assert.equal(decodeHtmlEntities('&#x1F600;'), '\u{1F600}');
});

test('htmlToText returns empty string for empty or tag-only input', () => {
  assert.equal(htmlToText(''), '');
  assert.equal(htmlToText('<div><span></span></div>'), '');
});
