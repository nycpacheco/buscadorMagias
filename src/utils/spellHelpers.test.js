import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFilterOptions,
  filterSpells,
  formatDescriptionSummary,
  formatDuration,
  formatRange,
  formatSavingThrow,
  formatSpellLevel,
  getSchoolEmoji,
  getSpellDamageTypes,
  getSpellScaling,
  normalizeDamageEntries,
  translateClass,
  translateSubclass,
} from './spellHelpers.js';

const fireBoltSpell = {
  index: 'fire-bolt',
  name: 'Raio de Fogo',
  desc: [
    'Você arremessa uma partícula de fogo em uma criatura ou objeto dentro do alcance. Faça um ataque à distância com magia contra o alvo.',
    'O dano desta magia aumenta em 1d10 quando você alcança o 5º nível.',
  ],
  range: '36 metros',
  components: ['V', 'S'],
  ritual: false,
  duration: 'Instantânea',
  concentration: false,
  casting_time: '1 ação',
  level: 0,
  attack_type: 'ranged',
  damage: [
    {
      damage_type: { index: 'fire', name: 'Fire' },
      damage_at_character_level: { 1: '1d10', 5: '2d10', 11: '3d10', 17: '4d10' },
    },
  ],
  school: { index: 'evocation', name: 'Evocation' },
  classes: [
    { index: 'sorcerer', name: 'Sorcerer' },
    { index: 'wizard', name: 'Wizard' },
  ],
};

const fireballSpell = {
  index: 'fireball',
  name: 'Bola de Fogo',
  desc: ['Um feixe brilhante lampeja de seu dedo indicador.'],
  higher_level: [
    'Quando você conjurar esta magia usando um espaço de magia de 4º nível ou superior, o dano aumenta em 1d6.',
  ],
  range: '45 metros',
  components: ['V', 'S', 'M'],
  material: 'Uma pequena bola de guano de morcego e enxofre.',
  ritual: false,
  duration: 'Instantânea',
  concentration: false,
  casting_time: '1 action',
  level: 3,
  dc: {
    dc_type: { index: 'dex', name: 'DEX' },
    dc_success: 'half',
  },
  damage: [
    {
      damage_type: { index: 'fire', name: 'Fire' },
      damage_at_slot_level: { 3: '8d6', 4: '9d6', 5: '10d6' },
    },
  ],
  school: { index: 'evocation', name: 'Evocation' },
  subclasses: [{ index: 'fiend', name: 'Fiend' }],
};

const iceStormMultiDamageSpell = {
  index: 'ice-storm',
  name: 'Tempestade de Gelo',
  desc: ['Uma saraivada de gelo duro como rocha cai no chão.'],
  range: '90 metros',
  casting_time: '1 ação',
  level: 4,
  damage: [
    {
      damage_type: { index: 'bludgeoning', name: 'Bludgeoning' },
      damage_at_slot_level: { 4: '2d8', 5: '3d8' },
    },
    {
      damage_type: { index: 'cold', name: 'Cold' },
      damage_at_slot_level: { 4: '4d6', 5: '4d6' },
    },
  ],
  school: { index: 'evocation', name: 'Evocation' },
};

const shieldNoDamageSpell = {
  index: 'shield',
  name: 'Escudo Arcano',
  desc: ['Uma barreira invisível de energia mágica aparece e protege você.'],
  range: 'Self',
  components: ['V', 'S'],
  ritual: false,
  duration: '1 round',
  concentration: false,
  casting_time: '1 reaction',
  level: 1,
  school: { index: 'abjuration', name: 'Abjuration' },
};

const legacyObjectDamageSpell = {
  index: 'acid-splash',
  name: 'Espirro Ácido',
  desc: ['Você arremessa uma bolha de ácido.'],
  casting_time: '1 ação',
  level: 0,
  damage: {
    damage_type: { index: 'acid', name: 'Acid' },
    damage_at_character_level: { 1: '1d6', 5: '2d6' },
  },
  school: { index: 'conjuration', name: 'Conjuration' },
};

test('normalizeDamageEntries handles array, object, multi-damage, and missing damage', () => {
  const fbEntries = normalizeDamageEntries(fireBoltSpell);
  assert.equal(fbEntries.length, 1);
  assert.equal(fbEntries[0].damageTypeLabel, 'Fogo');
  assert.equal(fbEntries[0].baseDice, '1d10');
  assert.equal(fbEntries[0].characterRows.length, 4);

  const iceEntries = normalizeDamageEntries(iceStormMultiDamageSpell);
  assert.equal(iceEntries.length, 2);
  assert.deepEqual(
    iceEntries.map((e) => e.damageTypeLabel),
    ['Concussão', 'Frio']
  );

  const legacyEntries = normalizeDamageEntries(legacyObjectDamageSpell);
  assert.equal(legacyEntries.length, 1);
  assert.equal(legacyEntries[0].damageTypeLabel, 'Ácido');

  const shieldEntries = normalizeDamageEntries(shieldNoDamageSpell);
  assert.deepEqual(shieldEntries, []);
});

test('getSpellScaling returns null when no scaling exists and returns structured tables otherwise', () => {
  assert.equal(getSpellScaling(shieldNoDamageSpell), null);

  const fbScaling = getSpellScaling(fireBoltSpell);
  assert.ok(fbScaling);
  assert.equal(fbScaling.damageTables.length, 1);
  assert.equal(fbScaling.damageTables[0].rows[3].value, '4d10');

  const fireballScaling = getSpellScaling(fireballSpell);
  assert.ok(fireballScaling);
  assert.equal(fireballScaling.higherLevelNotes.length, 1);
  assert.equal(fireballScaling.damageTables[0].rows[0].value, '8d6');
});

test('filterSpells combines search, school, level, castingTime, and damageType across EN/PT-BR casting times', () => {
  const all = [
    fireBoltSpell,
    fireballSpell,
    iceStormMultiDamageSpell,
    shieldNoDamageSpell,
    legacyObjectDamageSpell,
  ];

  assert.equal(filterSpells(all, { search: 'raio' }).length, 1);
  assert.equal(filterSpells(all, { school: 'abjuration' }).length, 1);
  assert.equal(filterSpells(all, { level: '0' }).length, 2);
  assert.equal(filterSpells(all, { castingTime: '1 reacao' }).length, 1);
  assert.equal(filterSpells(all, { castingTime: '1 acao' }).length, 4);
  assert.equal(filterSpells(all, { damageType: 'cold' }).length, 1);
  assert.equal(filterSpells(all, { damageType: '__none__' }).length, 1);

  const combined = filterSpells(all, {
    search: 'bola',
    school: 'evocation',
    level: '3',
    castingTime: '1 acao',
    damageType: 'fire',
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].index, 'fireball');
});

test('PT-BR dictionaries translate fallback English fields and deduplicate casting times', () => {
  const options = extractFilterOptions([fireBoltSpell, fireballSpell, shieldNoDamageSpell]);
  assert.equal(options.castingTimes.length, 2);
  assert.deepEqual(
    options.castingTimes.map((item) => item.label),
    ['1 ação', '1 reação']
  );

  assert.equal(translateClass({ index: 'wizard', name: 'Wizard' }), 'Mago');
  assert.equal(translateSubclass({ index: 'fiend', name: 'Fiend' }), 'Corruptor');
  assert.equal(
    formatSavingThrow(fireballSpell.dc),
    'Teste de resistência: DES (Destreza) (metade do dano)'
  );
  assert.equal(formatRange('Self'), 'Pessoal');
  assert.equal(formatDuration('1 round'), '1 rodada');
  assert.equal(
    formatDuration('Concentration, up to 1 minute'),
    'Concentração, até 1 minuto'
  );
  assert.equal(formatSpellLevel(0), 'Truque (Nível 0)');
  assert.equal(formatSpellLevel(undefined), 'Nível indefinido');
  assert.equal(getSpellDamageTypes(undefined).length, 0);
  assert.ok(formatDescriptionSummary([]).length > 0);
});

test('getSchoolEmoji returns exact emojis for all 8 magic schools and fallback', () => {
  assert.equal(getSchoolEmoji({ school: { index: 'abjuration' } }), '🛡️');
  assert.equal(getSchoolEmoji({ school: { index: 'conjuration' } }), '🌀');
  assert.equal(getSchoolEmoji({ school: { index: 'divination' } }), '👁️');
  assert.equal(getSchoolEmoji({ school: { index: 'enchantment' } }), '💖');
  assert.equal(getSchoolEmoji({ school: { index: 'evocation' } }), '💥');
  assert.equal(getSchoolEmoji({ school: { index: 'illusion' } }), '🎭');
  assert.equal(getSchoolEmoji({ school: { index: 'necromancy' } }), '💀');
  assert.equal(getSchoolEmoji({ school: { index: 'transmutation' } }), '🧪');
  assert.equal(getSchoolEmoji({}), '✨');
});
