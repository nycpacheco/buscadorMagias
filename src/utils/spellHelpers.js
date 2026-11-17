const SCHOOL_LABELS = {
  abjuration: 'Abjuração',
  conjuration: 'Conjuração',
  divination: 'Adivinhação',
  enchantment: 'Encantamento',
  evocation: 'Evocação',
  illusion: 'Ilusão',
  necromancy: 'Necromancia',
  transmutation: 'Transmutação',
};

const DAMAGE_TYPE_LABELS = {
  acid: 'Ácido',
  bludgeoning: 'Concussão',
  cold: 'Frio',
  fire: 'Fogo',
  force: 'Energia',
  lightning: 'Elétrico',
  necrotic: 'Necrótico',
  piercing: 'Perfurante',
  poison: 'Veneno',
  psychic: 'Psíquico',
  radiant: 'Radiante',
  slashing: 'Cortante',
  thunder: 'Trovejante',
};

const CASTING_TIME_LABELS = {
  '1 action': '1 ação',
  '1 ação': '1 ação',
  '1 bonus action': '1 ação bônus',
  '1 ação bônus': '1 ação bônus',
  '1 reaction': '1 reação',
  '1 reação': '1 reação',
  '1 minute': '1 minuto',
  '1 minuto': '1 minuto',
  '10 minutes': '10 minutos',
  '10 minutos': '10 minutos',
  '1 hour': '1 hora',
  '1 hora': '1 hora',
  '8 hours': '8 horas',
  '8 horas': '8 horas',
  '12 hours': '12 horas',
  '12 horas': '12 horas',
  '24 hours': '24 horas',
  '24 horas': '24 horas',
};

const CLASS_LABELS = {
  bard: 'Bardo',
  cleric: 'Clérigo',
  druid: 'Druida',
  paladin: 'Paladino',
  ranger: 'Patrulheiro',
  sorcerer: 'Feiticeiro',
  warlock: 'Bruxo',
  wizard: 'Mago',
};

const SUBCLASS_LABELS = {
  devotion: 'Devoção',
  fiend: 'Corruptor',
  land: 'Terra',
  life: 'Vida',
  lore: 'Conhecimento',
};

const DC_TYPE_LABELS = {
  str: 'FOR (Força)',
  dex: 'DES (Destreza)',
  con: 'CON (Constituição)',
  int: 'INT (Inteligência)',
  wis: 'SAB (Sabedoria)',
  cha: 'CAR (Carisma)',
};

const DC_SUCCESS_LABELS = {
  half: 'metade do dano',
  none: 'sem efeito',
  other: 'efeito especial',
};

const ATTACK_TYPE_LABELS = {
  ranged: 'Ataque à distância com magia',
  melee: 'Ataque corpo a corpo com magia',
};

const AOE_TYPE_LABELS = {
  sphere: 'Esfera',
  cone: 'Cone',
  cube: 'Cubo',
  cylinder: 'Cilindro',
  line: 'Linha',
  square: 'Quadrado',
};

const COMPONENT_LABELS = {
  V: 'V (Verbal)',
  S: 'S (Somático)',
  M: 'M (Material)',
};

const RANGE_LABELS = {
  self: 'Pessoal',
  touch: 'Toque',
  sight: 'Visão',
  unlimited: 'Ilimitado',
  special: 'Especial',
};

const DURATION_LABELS = {
  instantaneous: 'Instantânea',
  special: 'Especial',
  'until dispelled': 'Até ser dissipada',
  'until dispelled or triggered': 'Até ser dissipada ou ativada',
};

const SCHOOL_EMOJIS = {
  abjuration: '🛡️',
  conjuration: '🌀',
  divination: '👁️',
  enchantment: '💖',
  evocation: '💥',
  illusion: '🎭',
  necromancy: '💀',
  transmutation: '🧪',
};

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getSchoolEmoji(spell) {
  if (typeof spell?.emoji === 'string' && spell.emoji.trim().length > 0) {
    return spell.emoji;
  }
  const index = spell?.school?.index?.toLowerCase?.().trim?.() || '';
  return SCHOOL_EMOJIS[index] || '✨';
}

export function translateSchool(school) {
  const index = school?.index?.toLowerCase?.().trim?.();
  if (index && SCHOOL_LABELS[index]) {
    return SCHOOL_LABELS[index];
  }
  const name = school?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return SCHOOL_LABELS[name.toLowerCase().trim()] || name;
  }
  return 'Escola desconhecida';
}

export function translateDamageType(damageType) {
  const index = damageType?.index?.toLowerCase?.().trim?.();
  if (index && DAMAGE_TYPE_LABELS[index]) {
    return DAMAGE_TYPE_LABELS[index];
  }
  const name = damageType?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return DAMAGE_TYPE_LABELS[name.toLowerCase().trim()] || name;
  }
  return null;
}

export function translateClass(cls) {
  const index = cls?.index?.toLowerCase?.().trim?.();
  if (index && CLASS_LABELS[index]) {
    return CLASS_LABELS[index];
  }
  const name = cls?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return CLASS_LABELS[name.toLowerCase().trim()] || name;
  }
  return '';
}

export function translateSubclass(sub) {
  const index = sub?.index?.toLowerCase?.().trim?.();
  if (index && SUBCLASS_LABELS[index]) {
    return SUBCLASS_LABELS[index];
  }
  const name = sub?.name;
  if (typeof name === 'string' && name.trim().length > 0) {
    return SUBCLASS_LABELS[name.toLowerCase().trim()] || name;
  }
  return '';
}

export function formatSavingThrow(dc) {
  const typeIndex = dc?.dc_type?.index?.toLowerCase?.().trim?.();
  const typeName = dc?.dc_type?.name;
  const translatedType =
    (typeIndex && DC_TYPE_LABELS[typeIndex]) ||
    (typeName && DC_TYPE_LABELS[typeName.toLowerCase().trim()]) ||
    typeName;

  if (!translatedType) return null;

  const successKey =
    typeof dc?.dc_success === 'string' ? dc.dc_success.toLowerCase().trim() : '';
  const translatedSuccess = successKey
    ? DC_SUCCESS_LABELS[successKey] || dc.dc_success
    : null;

  return translatedSuccess
    ? `Teste de resistência: ${translatedType} (${translatedSuccess})`
    : `Teste de resistência: ${translatedType}`;
}

export function formatSpellLevel(level) {
  if (typeof level !== 'number' || Number.isNaN(level)) {
    return 'Nível indefinido';
  }
  if (level === 0) {
    return 'Truque (Nível 0)';
  }
  return `${level}º Nível`;
}

export function formatCastingTime(castingTime) {
  if (typeof castingTime !== 'string' || castingTime.trim().length === 0) {
    return 'Não informado';
  }
  const key = castingTime.toLowerCase().trim();
  return CASTING_TIME_LABELS[key] || castingTime.trim();
}

export function formatRange(range) {
  if (typeof range !== 'string' || range.trim().length === 0) {
    return 'Não informado';
  }
  const trimmed = range.trim();
  const lower = trimmed.toLowerCase();
  if (RANGE_LABELS[lower]) {
    return RANGE_LABELS[lower];
  }
  return trimmed
    .replace(/\bfeet\b/gi, 'pés')
    .replace(/\bfoot\b/gi, 'pé')
    .replace(/\bmiles\b/gi, 'milhas')
    .replace(/\bmile\b/gi, 'milha');
}

export function formatDuration(duration) {
  if (typeof duration !== 'string' || duration.trim().length === 0) {
    return 'Não informada';
  }
  const trimmed = duration.trim();
  const lower = trimmed.toLowerCase();
  if (DURATION_LABELS[lower]) {
    return DURATION_LABELS[lower];
  }
  return trimmed
    .replace(/^Concentration,\s*up to\s+/i, 'Concentração, até ')
    .replace(/^Up to\s+/i, 'Até ')
    .replace(/\brounds\b/gi, 'rodadas')
    .replace(/\bround\b/gi, 'rodada')
    .replace(/\bminutes\b/gi, 'minutos')
    .replace(/\bminute\b/gi, 'minuto')
    .replace(/\bhours\b/gi, 'horas')
    .replace(/\bhour\b/gi, 'hora')
    .replace(/\bdays\b/gi, 'dias')
    .replace(/\bday\b/gi, 'dia');
}

export function formatAttackType(attackType) {
  if (typeof attackType !== 'string' || attackType.trim().length === 0) {
    return null;
  }
  const key = attackType.toLowerCase().trim();
  return ATTACK_TYPE_LABELS[key] || attackType.trim();
}

export function formatAreaOfEffect(area) {
  if (!area || typeof area !== 'object') {
    return null;
  }
  const typeKey = typeof area.type === 'string' ? area.type.toLowerCase().trim() : '';
  const typeLabel = AOE_TYPE_LABELS[typeKey] || area.type;
  const size = area.size;
  if (!typeLabel && !size) return null;
  if (typeLabel && size) return `${typeLabel} (${size} pés)`;
  return String(typeLabel || size);
}

export function formatComponents(components) {
  if (!Array.isArray(components) || components.length === 0) {
    return [];
  }
  return components
    .filter((comp) => typeof comp === 'string' && comp.trim().length > 0)
    .map((comp) => {
      const code = comp.trim().toUpperCase();
      return COMPONENT_LABELS[code] || code;
    });
}

export function formatDescriptionSummary(desc, maxLength = 148) {
  if (!Array.isArray(desc) || desc.length === 0) {
    return 'Descrição detalhada disponível ao abrir a magia.';
  }
  const firstParagraph = desc.find(
    (item) => typeof item === 'string' && item.trim().length > 0
  );
  if (!firstParagraph) {
    return 'Descrição detalhada disponível ao abrir a magia.';
  }
  const clean = firstParagraph.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxLength) {
    return clean;
  }
  const clipped = clean.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  return `${clipped.slice(0, cutoff).trim()}...`;
}

function toSortedScaleRows(record, unitPrefix) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return [];
  }
  return Object.entries(record)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([levelKey, formula]) => ({
      levelKey,
      label: `${unitPrefix} ${levelKey}`,
      value: formula.trim(),
    }));
}

export function normalizeDamageEntries(spell) {
  const rawDamage = spell?.damage;
  if (!rawDamage) return [];

  const entries = Array.isArray(rawDamage) ? rawDamage : [rawDamage];

  return entries
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const typeIndex = item?.damage_type?.index?.toLowerCase?.().trim?.() || '';
      const typeName = item?.damage_type?.name || '';
      const typeLabel = translateDamageType(item?.damage_type);
      const characterRows = toSortedScaleRows(
        item?.damage_at_character_level,
        'Personagem nv.'
      );
      const slotRows = toSortedScaleRows(
        item?.damage_at_slot_level,
        'Espaço nv.'
      );
      const baseDice =
        characterRows[0]?.value ||
        slotRows[0]?.value ||
        null;

      return {
        damageTypeIndex: typeIndex,
        damageTypeName: typeName,
        damageTypeLabel: typeLabel,
        characterRows,
        slotRows,
        baseDice,
      };
    })
    .filter(
      (entry) =>
        Boolean(entry.damageTypeLabel) ||
        entry.characterRows.length > 0 ||
        entry.slotRows.length > 0
    );
}

export function getSpellDamageTypes(spell) {
  const entries = normalizeDamageEntries(spell);
  const seen = new Set();
  const list = [];

  for (const entry of entries) {
    if (!entry.damageTypeIndex && !entry.damageTypeLabel) continue;
    const key = entry.damageTypeIndex || normalizeText(entry.damageTypeLabel);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      index: key,
      label: entry.damageTypeLabel || entry.damageTypeName,
    });
  }

  return list;
}

export function getSpellScaling(spell) {
  const damageEntries = normalizeDamageEntries(spell);
  const damageTables = damageEntries
    .map((entry) => {
      if (entry.characterRows.length > 0) {
        return {
          title: entry.damageTypeLabel
            ? `Dano (${entry.damageTypeLabel}) por nível do personagem`
            : 'Dano por nível do personagem',
          rows: entry.characterRows,
        };
      }
      if (entry.slotRows.length > 0) {
        return {
          title: entry.damageTypeLabel
            ? `Dano (${entry.damageTypeLabel}) por espaço de magia`
            : 'Dano por espaço de magia',
          rows: entry.slotRows,
        };
      }
      return null;
    })
    .filter(Boolean);

  const healRows = toSortedScaleRows(spell?.heal_at_slot_level, 'Espaço nv.');
  const higherLevelNotes = Array.isArray(spell?.higher_level)
    ? spell.higher_level.filter(
        (text) => typeof text === 'string' && text.trim().length > 0
      )
    : [];

  if (
    damageTables.length === 0 &&
    healRows.length === 0 &&
    higherLevelNotes.length === 0
  ) {
    return null;
  }

  return {
    damageTables,
    healRows,
    higherLevelNotes,
  };
}

export function extractFilterOptions(spells) {
  const safeSpells = Array.isArray(spells) ? spells : [];

  const schoolsMap = new Map();
  const levelsSet = new Set();
  const castingTimesMap = new Map();
  const damageTypesMap = new Map();

  for (const spell of safeSpells) {
    if (spell?.school?.index) {
      const idx = spell.school.index.toLowerCase().trim();
      if (!schoolsMap.has(idx)) {
        schoolsMap.set(idx, {
          value: idx,
          label: translateSchool(spell.school),
        });
      }
    }

    if (typeof spell?.level === 'number' && !Number.isNaN(spell.level)) {
      levelsSet.add(spell.level);
    }

    if (typeof spell?.casting_time === 'string' && spell.casting_time.trim()) {
      const canonicalLabel = formatCastingTime(spell.casting_time);
      const canonicalKey = normalizeText(canonicalLabel);
      if (!castingTimesMap.has(canonicalKey)) {
        castingTimesMap.set(canonicalKey, {
          value: canonicalKey,
          label: canonicalLabel,
        });
      }
    }

    for (const dmgType of getSpellDamageTypes(spell)) {
      if (!damageTypesMap.has(dmgType.index)) {
        damageTypesMap.set(dmgType.index, {
          value: dmgType.index,
          label: dmgType.label,
        });
      }
    }
  }

  const schools = Array.from(schoolsMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR')
  );
  const levels = Array.from(levelsSet)
    .sort((a, b) => a - b)
    .map((lvl) => ({
      value: String(lvl),
      label: formatSpellLevel(lvl),
    }));
  const castingTimes = Array.from(castingTimesMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR')
  );
  const damageTypes = Array.from(damageTypesMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR')
  );

  return {
    schools,
    levels,
    castingTimes,
    damageTypes,
  };
}

export function filterSpells(spells, filters = {}) {
  const safeSpells = Array.isArray(spells) ? spells : [];
  const query = normalizeText(filters.search);
  const school = filters.school ? String(filters.school).toLowerCase().trim() : '';
  const level =
    filters.level !== undefined && filters.level !== null && filters.level !== ''
      ? Number(filters.level)
      : null;
  const castingTime = filters.castingTime
    ? normalizeText(formatCastingTime(filters.castingTime))
    : '';
  const damageType = filters.damageType
    ? String(filters.damageType).toLowerCase().trim()
    : '';

  return safeSpells.filter((spell) => {
    if (query) {
      const nameNorm = normalizeText(spell?.name);
      if (!nameNorm.includes(query)) {
        return false;
      }
    }

    if (school) {
      const spellSchool = spell?.school?.index?.toLowerCase?.().trim?.() || '';
      if (spellSchool !== school) {
        return false;
      }
    }

    if (level !== null && !Number.isNaN(level)) {
      if (spell?.level !== level) {
        return false;
      }
    }

    if (castingTime) {
      const spellCastTime =
        typeof spell?.casting_time === 'string' && spell.casting_time.trim()
          ? normalizeText(formatCastingTime(spell.casting_time))
          : '';
      if (spellCastTime !== castingTime) {
        return false;
      }
    }

    if (damageType) {
      if (damageType === '__none__') {
        if (getSpellDamageTypes(spell).length > 0) {
          return false;
        }
      } else {
        const types = getSpellDamageTypes(spell);
        if (!types.some((item) => item.index === damageType)) {
          return false;
        }
      }
    }

    return true;
  });
}
