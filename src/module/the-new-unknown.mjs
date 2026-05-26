import { registerRuntimeLocalization } from './localization.mjs';
import { tnuArmorFeatures, tnuWeaponFeatures } from './tnu-features.mjs';
import { registerWeaponFeatureHooks } from './weapon-feature-hooks.mjs';

const MODULE_ID = 'daggerheart-the-new-unknown';
const MODULE_NAME = 'The New Unknown for Daggerheart';
const I18N_PREFIX = 'DHTNU';
const PACK_NAMES = [
  'tnu-character-options',
  'tnu-domain-cards',
  'tnu-weapons',
  'tnu-armors',
  'tnu-gear',
  'tnu-consumables',
  'tnu-journals'
];

const tnuDomains = {
  mercury: {
    id: 'mercury',
    label: `${I18N_PREFIX}.Domain.Mercury.Label`,
    src: 'icons/magic/movement/acceleration-speed-tech-blue.webp',
    description: `${I18N_PREFIX}.Domain.Mercury.Description`
  },
  saturn: {
    id: 'saturn',
    label: `${I18N_PREFIX}.Domain.Saturn.Label`,
    src: 'icons/magic/perception/silhouette-stealth-shadow.webp',
    description: `${I18N_PREFIX}.Domain.Saturn.Description`
  },
  uranus: {
    id: 'uranus',
    label: `${I18N_PREFIX}.Domain.Uranus.Label`,
    src: 'icons/commodities/tech/tube-chamber-lightning.webp',
    description: `${I18N_PREFIX}.Domain.Uranus.Description`
  },
  pluto: {
    id: 'pluto',
    label: `${I18N_PREFIX}.Domain.Pluto.Label`,
    src: 'icons/commodities/treasure/token-runed-circles-purple.webp',
    description: `${I18N_PREFIX}.Domain.Pluto.Description`
  },
  venus: {
    id: 'venus',
    label: `${I18N_PREFIX}.Domain.Venus.Label`,
    src: 'icons/magic/control/control-influence-crown-gold.webp',
    description: `${I18N_PREFIX}.Domain.Venus.Description`
  },
  terra: {
    id: 'terra',
    label: `${I18N_PREFIX}.Domain.Terra.Label`,
    src: 'icons/magic/nature/leaf-glow-maple-green.webp',
    description: `${I18N_PREFIX}.Domain.Terra.Description`
  },
  neptune: {
    id: 'neptune',
    label: `${I18N_PREFIX}.Domain.Neptune.Label`,
    src: 'icons/magic/perception/orb-crystal-ball-scrying-blue.webp',
    description: `${I18N_PREFIX}.Domain.Neptune.Description`
  },
  jupiter: {
    id: 'jupiter',
    label: `${I18N_PREFIX}.Domain.Jupiter.Label`,
    src: 'icons/magic/defensive/shield-barrier-blue.webp',
    description: `${I18N_PREFIX}.Domain.Jupiter.Description`
  },
  mars: {
    id: 'mars',
    label: `${I18N_PREFIX}.Domain.Mars.Label`,
    src: 'icons/weapons/swords/sword-runed-glowing.webp',
    description: `${I18N_PREFIX}.Domain.Mars.Description`
  }
};

const tnuCardTypes = {
  skill: {
    id: 'skill',
    label: `${I18N_PREFIX}.DomainCardType.Skill`,
    img: ''
  },
  tech: {
    id: 'tech',
    label: `${I18N_PREFIX}.DomainCardType.Tech`,
    img: ''
  },
  sigil: {
    id: 'sigil',
    label: `${I18N_PREFIX}.DomainCardType.Sigil`,
    img: ''
  }
};

Hooks.once('init', () => {
  if (
    !CONFIG.DH?.ITEM?.weaponFeatures ||
    !CONFIG.DH?.ITEM?.armorFeatures ||
    !CONFIG.DH?.DOMAIN?.domains ||
    !CONFIG.DH?.DOMAIN?.cardTypes
  ) {
    console.warn(`${MODULE_NAME} | Daggerheart registries were not available during init.`);
    return;
  }

  Object.assign(CONFIG.DH.DOMAIN.domains, foundry.utils.deepClone(tnuDomains));
  Object.assign(CONFIG.DH.DOMAIN.cardTypes, foundry.utils.deepClone(tnuCardTypes));
  Object.assign(CONFIG.DH.ITEM.weaponFeatures, localizedFeatureRegistry(tnuWeaponFeatures, 'Weapon'));
  Object.assign(CONFIG.DH.ITEM.armorFeatures, localizedFeatureRegistry(tnuArmorFeatures, 'Armor'));
  console.info(`${MODULE_NAME} | Initialized successfully.`);
});

registerRuntimeLocalization({
  moduleId: MODULE_ID,
  i18nPrefix: I18N_PREFIX,
  moduleName: MODULE_NAME,
  packNames: PACK_NAMES
});
registerWeaponFeatureHooks({ moduleId: MODULE_ID, i18nPrefix: I18N_PREFIX });

function localizedFeatureRegistry(registry, type) {
  const localized = foundry.utils.deepClone(registry);

  for (const [featureId, feature] of Object.entries(localized)) {
    localizeField(feature, 'label', `${I18N_PREFIX}.Feature.${type}.${featureId}.Label`);
    localizeField(feature, 'description', `${I18N_PREFIX}.Feature.${type}.${featureId}.Description`);

    for (const [index, effect] of (feature.effects ?? []).entries()) {
      localizeField(effect, 'name', `${I18N_PREFIX}.Feature.${type}.${featureId}.Effect.${index}.Name`);
      localizeField(effect, 'description', `${I18N_PREFIX}.Feature.${type}.${featureId}.Effect.${index}.Description`);
    }

    for (const [index, action] of (feature.actions ?? []).entries()) {
      localizeField(action, 'name', `${I18N_PREFIX}.Feature.${type}.${featureId}.Action.${index}.Name`);
      localizeField(action, 'description', `${I18N_PREFIX}.Feature.${type}.${featureId}.Action.${index}.Description`);

      for (const [effectIndex, effect] of (action.effects ?? []).entries()) {
        localizeField(effect, 'name', `${I18N_PREFIX}.Feature.${type}.${featureId}.Action.${index}.Effect.${effectIndex}.Name`);
        localizeField(
          effect,
          'description',
          `${I18N_PREFIX}.Feature.${type}.${featureId}.Action.${index}.Effect.${effectIndex}.Description`
        );
      }
    }
  }

  return localized;
}

function localizeField(object, field, key) {
  object[field] = key;
}
