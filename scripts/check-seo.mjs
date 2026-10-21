import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.env.SEO_ROOT || '.');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || '';
const canonical = head.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
assert.ok(canonical, 'URL canônica ausente');
const site = new URL(canonical);
assert.equal(site.protocol, 'https:');
assert.equal(site.search, '');
assert.equal(site.hash, '');
assert.ok(site.pathname.endsWith('/'));
assert.equal((head.match(/rel="canonical"/g) || []).length, 1);
const ogUrl = head.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
assert.equal(ogUrl, canonical);
const image = new URL(head.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '');
assert.equal(image.origin, site.origin);
assert.ok(image.pathname.startsWith(site.pathname));
assert.ok((await readFile(path.join(root, image.pathname.slice(site.pathname.length)))).length > 0, 'Imagem de compartilhamento ausente');
assert.match(head, /<title>[^<]*Ar-condicionado[^<]*São Paulo[^<]*<\/title>/);
assert.match(head, /<meta name="description" content="[^"]{80,180}">/);
assert.doesNotMatch(head, /(?:noindex|nofollow)/i);
assert.match(html, /<html lang="pt-BR">/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
const structured = JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || 'null');
assert.equal(structured?.['@context'], 'https://schema.org');
const graph = structured['@graph'];
const business = graph.find(node => node['@type'] === 'HVACBusiness');
const webpage = graph.find(node => node['@type'] === 'WebPage');
assert.ok(business && webpage);
assert.equal(business.url, canonical);
assert.equal(webpage.url, canonical);
assert.equal(webpage.about['@id'], business['@id']);
assert.equal(business.areaServed.length, 15);
for (const area of business.areaServed) {
  assert.ok(html.includes(`<li>${area.name}</li>`), `Região sem conteúdo visível: ${area.name}`);
}
for (const contact of business.contactPoint) {
  const phone = contact.telephone.replace(/\D/g, '');
  assert.match(phone, /^55\d{11}$/);
  assert.ok(html.includes(`https://wa.me/${phone}`), 'Telefone dos dados estruturados difere do contato da página');
}
assert.ok(!business.aggregateRating && !business.review && !business.openingHours, 'Não incluir avaliações ou horários não confirmados');
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(urls, [canonical], 'Sitemap deve conter apenas a página canônica publicada');
assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
console.log('PASS: título, descrição, canonical, indexação, idioma, dados locais, 15 regiões, contatos e sitemap');
