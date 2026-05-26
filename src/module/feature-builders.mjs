export const icons = {
  action: 'icons/magic/control/silhouette-aura-energy.webp',
  armor: 'icons/magic/defensive/armor-shield-barrier-steel.webp',
  blast: 'icons/magic/fire/explosion-embers-orange.webp',
  energy: 'icons/magic/lightning/bolt-strike-blue.webp',
  movement: 'icons/magic/movement/trail-streak-impact-blue.webp',
  precision: 'icons/skills/targeting/crosshair-arrowhead-blue.webp',
  reload: 'icons/weapons/ammunition/shot-round-blue.webp',
  restraint: 'icons/magic/control/debuff-chains-ropes-net-purple-blue.webp',
  shield: 'icons/skills/melee/shield-block-bash-blue.webp',
  stress: 'icons/magic/control/fear-fright-mask-orange.webp',
  time: 'icons/magic/time/hourglass-brown-orange.webp'
};

export const stress = value => [{ key: 'stress', value }];
export const hope = value => [{ key: 'hope', value }];
export const armor = value => [{ key: 'resource', itemId: 'armorSlot', value }];

export const feature = (label, description, config = {}) => ({
  label,
  description,
  effects: config.effects ?? [],
  actions: config.actions ?? []
});

export const effect = (name, description, changes, img = icons.action, extra = {}) => ({
  name,
  description,
  img,
  changes,
  ...extra
});

export const action = (name, description, config = {}) => ({
  type: config.type ?? 'effect',
  chatDisplay: true,
  name,
  description,
  img: config.img ?? icons.action,
  cost: config.cost ?? [],
  uses: config.uses,
  target: config.target,
  effects: config.effects
});

export const armorBonus = value => ({
  key: 'Armor',
  type: 'armor',
  value: 0,
  typeData: {
    type: 'armor',
    max: String(value)
  }
});

export const armorTierBonus = () => ({
  key: 'Armor',
  type: 'armor',
  value: 0,
  typeData: {
    type: 'armor',
    max: 'ITEM.@system.tier'
  }
});

export const primaryDamageBonus = value => ({
  key: 'system.bonuses.damage.primaryWeapon.bonus',
  mode: 2,
  value: String(value)
});

export const primaryAttackBonus = value => ({
  key: 'system.bonuses.roll.primaryWeapon.bonus',
  mode: 2,
  value: String(value)
});

export const uses = (max, recovery = null, value = 0) => ({
  value,
  max,
  recovery,
  consumeOnSuccess: false
});

export function featureValuesFromText(text, matchers, registry) {
  const normalized = normalizeFeatureText(text);
  if (!normalized) return [];

  for (const [matcher, values] of matchers) {
    if (!matcher.test(normalized)) continue;
    const missing = values.filter(value => !registry[value]);
    if (missing.length > 0) throw new Error(`Missing feature definitions for ${missing.join(', ')}`);
    return values;
  }

  throw new Error(`Unmapped feature text: ${normalized}`);
}

function normalizeFeatureText(text) {
  if (text == null) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/в€’/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
