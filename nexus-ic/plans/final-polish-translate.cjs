const fs = require('node:fs');
const vm = require('node:vm');
const bundles = { en: {}, hi: {} };
// Move the new bilingual copy into the existing automatically loaded i18n bundles.
for (const name of ['InstitutionPicker', 'InstitutionTrend', 'CaseExplanation', 'PresentStory']) {
  const file = `client/src/components/${name}.jsx`;
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace(/hi \? '([^']*)' : '([^']*)'/g, (_, hi, en) => {
    if (hi === 'hi' && en === 'en') return "hi ? 'hi' : 'en'";
    const key = `polish.${en}`; bundles.en[key] = en; bundles.hi[key] = hi;
    return `t(${JSON.stringify(key)})`;
  });
  source = source.replace(/const \{ lang \} = useI18n\(\)/g, 'const { lang, t } = useI18n()');
  if (name === 'PresentStory') {
    const match = source.match(/const captions = (\{[\s\S]*?\n\});/);
    if (match) {
      const captions = vm.runInNewContext(`(${match[1]})`);
      bundles.en['polish.storySlides'] = captions.en; bundles.hi['polish.storySlides'] = captions.hi;
      source = source.replace(match[0], '').replace("slides = captions[hi ? 'hi' : 'en']", "slides = t('polish.storySlides')");
    }
  }
  fs.writeFileSync(file, source);
}
for (const lang of ['en', 'hi']) {
  const file = `client/src/i18n/final-polish.${lang}.json`;
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  fs.writeFileSync(file, JSON.stringify({ ...existing, ...bundles[lang] }, null, 2) + '\n');
}
