import { action, armor, armorBonus, armorTierBonus, effect, feature, featureValuesFromText, hope, icons, primaryAttackBonus, primaryDamageBonus, stress, uses } from './feature-builders.mjs';

export const tnuWeaponFeatures = {
  dhsAdrenalineD10: feature(
    'Adrenaline',
    'When all Stress is marked, use a d10 damage die with this weapon.',
    { actions: [action('Adrenaline', 'When all Stress is marked, use a d10 damage die with this weapon.')] }
  ),
  dhsAdrenalineD12: feature(
    'Adrenaline',
    'When all Stress is marked, use a d12 damage die with this weapon.',
    { actions: [action('Adrenaline', 'When all Stress is marked, use a d12 damage die with this weapon.')] }
  ),
  dhsAmplified: feature('Amplified', 'Roll one extra damage die and discard the lowest.', {
    actions: [action('Amplified', 'On a successful attack, roll one extra damage die and discard the lowest.')]
  }),
  dhsBarrierEvasion: feature('Barrier', '+1 Evasion.', {
    effects: [effect('Barrier', '+1 Evasion.', [{ key: 'system.evasion', mode: 2, value: '1' }], icons.shield)]
  }),
  dhsBastion: feature('Bastion', '+2 Armor Score; -1 Evasion.', {
    effects: [
      effect('Bastion', '+2 Armor Score; -1 Evasion.', [armorBonus(2), { key: 'system.evasion', mode: 2, value: '-1' }], icons.shield)
    ]
  }),
  dhsBlock: feature('Block', '+1 Armor Score.', {
    effects: [effect('Block', '+1 Armor Score.', [armorBonus(1)], icons.shield)]
  }),
  dhsBulky: feature('Bulky', '-1 to Evasion.', {
    effects: [effect('Bulky', '-1 to Evasion.', [{ key: 'system.evasion', mode: 2, value: '-1' }])]
  }),
  dhsConstrict: feature('Constrict', 'Spend Hope to temporarily Restrain the target.', {
    actions: [action('Constrict', 'Spend Hope to temporarily Restrain the target.', { cost: hope(1), img: icons.restraint })]
  }),
  dhsDeadZone: feature('Dead Zone', 'Disadvantage at Melee and Very Close range.', {
    actions: [action('Dead Zone', 'This weapon has disadvantage at Melee and Very Close range.')]
  }),
  dhsDeflectingDice: feature('Deflecting', 'Matching damage dice are discarded from attacker damage.', {
    actions: [action('Deflecting', 'Matching damage dice are discarded from attacker damage.', { img: icons.shield })]
  }),
  dhsDrag: feature('Drag', 'Pull target into Melee range on hit.', {
    actions: [action('Drag', 'On a hit, pull the target into Melee range.', { img: icons.movement })]
  }),
  dhsFlexibleWeapon: feature('Flexible', 'Mark Stress to target another creature in range.', {
    actions: [action('Flexible', 'Mark Stress to target another creature in range.', { cost: stress(1) })]
  }),
  dhsHybridFinesse: feature('Hybrid', 'May also use Finesse, Melee range, d10 damage.', {
    actions: [action('Hybrid', 'May also use Finesse, Melee range, d10 damage.')]
  }),
  dhsHybridInstinct: feature('Hybrid', 'May also use Instinct, Melee range, d10 damage.', {
    actions: [action('Hybrid', 'May also use Instinct, Melee range, d10 damage.')]
  }),
  dhsImpactZone: feature('Impact Zone', 'Target and nearby creatures make Reaction Roll 13 or take damage; success halves damage.', {
    actions: [action('Impact Zone', 'Target and nearby creatures make Reaction Roll 13 or take damage; success halves damage.', { img: icons.blast })]
  }),
  dhsLethal: feature('Lethal', 'Severe damage marks one additional HP.', {
    actions: [action('Lethal', 'When you deal Severe damage, the target marks one additional HP.')]
  }),
  dhsLocked: feature('Locked', 'Spend Hope for advantage.', {
    actions: [action('Locked', 'Spend Hope for advantage.', { cost: hope(1), img: icons.precision })]
  }),
  dhsOffHand: feature('Off-Hand', '+2 primary weapon damage to Melee targets.', {
    effects: [effect('Off-Hand', '+2 primary weapon damage to Melee targets.', [primaryDamageBonus(2)])]
  }),
  dhsOneOnOne: feature('One-on-One', 'Advantage if no other creatures are Close to the target.', {
    actions: [action('One-on-One', 'Gain advantage if no other creatures are Close to the target.')]
  }),
  dhsPointBlank: feature('Point-Blank', 'Within Close range, use a d8 damage die.', {
    actions: [action('Point-Blank', 'Within Close range, use a d8 damage die.')]
  }),
  dhsPowerStrike: feature('Power Strike', 'Add Strength to damage rolls.', {
    effects: [
      effect('Power Strike', 'Add Strength to damage rolls.', [
        { key: 'system.bonuses.damage.primaryWeapon.bonus', mode: 2, value: '@system.traits.strength.value', priority: 21 }
      ])
    ]
  }),
  dhsPrecise: feature('Precise', '+1 to attack rolls.', {
    effects: [effect('Precise', '+1 to attack rolls.', [primaryAttackBonus(1)], icons.precision)]
  }),
  dhsPull: feature('Pull', 'Pull yourself into Melee range of the target on hit.', {
    actions: [action('Pull', 'On a hit, pull yourself into Melee range of the target.', { img: icons.movement })]
  }),
  dhsRupture: feature('Rupture', 'When a damage die rolls its maximum, roll another die.', {
    actions: [action('Rupture', 'When a damage die rolls its maximum, roll another die.')]
  }),
  dhsShieldedKnowledge: feature('Shielded', '+2 Armor Score; -1 Knowledge.', {
    effects: [
      effect('Shielded', '+2 Armor Score; -1 Knowledge.', [armorBonus(2), { key: 'system.traits.knowledge.value', mode: 2, value: '-1' }], icons.shield)
    ]
  }),
  dhsShieldedStress: feature('Shielded', '+2 Armor Score; -1 Stress.', {
    effects: [
      effect('Shielded', '+2 Armor Score; -1 Stress.', [armorBonus(2), { key: 'system.resources.stress.max', mode: 2, value: '-1' }], icons.shield)
    ]
  }),
  dhsShockwave: feature('Shockwave', 'All adversaries within Very Close range mark Stress.', {
    actions: [action('Shockwave', 'All adversaries within Very Close range mark Stress.', { img: icons.blast })]
  }),
  dhsSpreadfire: feature('Spreadfire', 'Target all creatures in front within range.', {
    actions: [action('Spreadfire', 'Target all creatures in front within range.', { img: icons.blast })]
  }),
  dhsStraining: feature('Straining', 'On a hit, the target marks Stress.', {
    actions: [action('Straining', 'On a hit, the target marks Stress.', { img: icons.stress })]
  }),
  dhsSynced: feature('Synced', 'Spend Hope for +2 primary weapon damage.', {
    actions: [action('Synced', 'Spend Hope for +2 primary weapon damage.', { cost: hope(1) })]
  }),
  dhsTether: feature('Tether', 'Spend Hope to Restrain or pull the target to Melee.', {
    actions: [action('Tether', 'Spend Hope to Restrain or pull the target to Melee.', { cost: hope(1), img: icons.restraint })]
  }),
  dhsUnleash: feature('Unleash', 'Mark Stress to force Melee adversaries back to Close range.', {
    actions: [action('Unleash', 'Mark Stress to force Melee adversaries back to Close range.', { cost: stress(1), img: icons.stress })]
  }),
  dhsUnwieldyFinesse: feature('Unwieldy', '-1 to Finesse.', {
    effects: [effect('Unwieldy', '-1 to Finesse.', [{ key: 'system.traits.finesse.value', mode: 2, value: '-1' }])]
  }),
  dhsWardedWeapon: feature('Warded', '+1 Armor Score.', {
    effects: [effect('Warded', '+1 Armor Score.', [armorBonus(1)], icons.shield)]
  }),
  dhsOpportunistD10: feature('Opportunist', 'With advantage, use d10 damage die.', {
    actions: [action('Opportunist', 'When you attack with advantage, use a d10 damage die.')]
  }),
  dhsOpportunistD12: feature('Opportunist', 'With advantage, use d12 damage die.', {
    actions: [action('Opportunist', 'When you attack with advantage, use a d12 damage die.')]
  })
};

export const tnuArmorFeatures = {
  dhsAdaptive: feature('Adaptive', '+1 to Evasion.', {
    effects: [effect('Adaptive', '+1 to Evasion.', [{ key: 'system.evasion', mode: 2, value: '1' }])]
  }),
  dhsBiocharged: feature('Biocharged', 'Mark Stress for +1 Proficiency on a primary weapon attack.', {
    actions: [action('Biocharged', 'Mark Stress for +1 Proficiency on a primary weapon attack.', { cost: stress(1), img: icons.energy })]
  }),
  dhsBulkyArmor: feature('Bulky', '-1 to Evasion.', {
    effects: [effect('Bulky', '-1 to Evasion.', [{ key: 'system.evasion', mode: 2, value: '-1' }])]
  }),
  dhsCornered: feature('Cornered', 'When all Stress is marked, gain advantage on attack rolls.', {
    actions: [action('Cornered', 'When all Stress is marked, gain advantage on attack rolls.')]
  }),
  dhsDeflectArmor: feature('Deflect', 'After a hit, mark an Armor Slot to reduce the attack roll by unmarked Armor Slots.', {
    actions: [action('Deflect', 'After a hit, mark an Armor Slot to reduce the attack roll by unmarked Armor Slots.', { cost: armor(1), img: icons.shield })]
  }),
  dhsMassiveArmor: feature('Massive', '-2 to Evasion; -1 to Agility.', {
    effects: [
      effect('Massive', '-2 to Evasion; -1 to Agility.', [
        { key: 'system.evasion', mode: 2, value: '-2' },
        { key: 'system.traits.agility.value', mode: 2, value: '-1' }
      ])
    ]
  }),
  dhsPhantom: feature('Phantom', 'Mark an Armor Slot to give attacks disadvantage until damaged or scene ends.', {
    actions: [action('Phantom', 'Mark an Armor Slot to give attacks disadvantage until damaged or scene ends.', { cost: armor(1), img: icons.shield })]
  }),
  dhsRegrowth: feature('Regrowth', 'During downtime, automatically clear an Armor Slot.', {
    actions: [action('Regrowth', 'During downtime, automatically clear an Armor Slot.', { img: icons.armor })]
  }),
  dhsStims: feature('Stims', 'During downtime, automatically clear a Stress.', {
    actions: [action('Stims', 'During downtime, automatically clear a Stress.', { img: icons.energy })]
  }),
  dhsTransfer: feature('Transfer', 'Mark an Armor Slot instead of Stress.', {
    actions: [action('Transfer', 'Mark an Armor Slot instead of Stress.', { cost: armor(1), img: icons.shield })]
  })
};

const weaponMatchers = [
  [/^Adrenaline: when all Stress marked, use d10 damage die$/i, ['dhsAdrenalineD10']],
  [/^Adrenaline: when all Stress marked, use d12 damage die$/i, ['dhsAdrenalineD12']],
  [/^Amplified:/i, ['dhsAmplified']],
  [/^Barrier: \+1 Evasion$/i, ['dhsBarrierEvasion']],
  [/^Bastion:/i, ['dhsBastion']],
  [/^Block:/i, ['dhsBlock']],
  [/^Bulky:/i, ['dhsBulky']],
  [/^Constrict:/i, ['dhsConstrict']],
  [/^Dead Zone:/i, ['dhsDeadZone']],
  [/^Deflecting:/i, ['dhsDeflectingDice']],
  [/^Drag:/i, ['dhsDrag']],
  [/^Flexible:/i, ['dhsFlexibleWeapon']],
  [/^Hybrid: may use Finesse/i, ['dhsHybridFinesse']],
  [/^Hybrid: may use Instinct/i, ['dhsHybridInstinct']],
  [/^Impact Zone:/i, ['dhsImpactZone']],
  [/^Lethal:/i, ['dhsLethal']],
  [/^Locked:/i, ['dhsLocked']],
  [/^Off-Hand:/i, ['dhsOffHand']],
  [/^One-on-One:/i, ['dhsOneOnOne']],
  [/^Opportunist: with advantage, use d10 damage die$/i, ['dhsOpportunistD10']],
  [/^Opportunist: with advantage, use d12 damage die$/i, ['dhsOpportunistD12']],
  [/^Point-Blank:/i, ['dhsPointBlank']],
  [/^Power Strike:/i, ['dhsPowerStrike']],
  [/^Precise:/i, ['dhsPrecise']],
  [/^Pull:/i, ['dhsPull']],
  [/^Rupture:/i, ['dhsRupture']],
  [/^Shielded: \+2 Armor Score; -1 Knowledge$/i, ['dhsShieldedKnowledge']],
  [/^Shielded: \+2 Armor Score; -1 Stress$/i, ['dhsShieldedStress']],
  [/^Shockwave:/i, ['dhsShockwave']],
  [/^Spreadfire:/i, ['dhsSpreadfire']],
  [/^Straining:/i, ['dhsStraining']],
  [/^Synced:/i, ['dhsSynced']],
  [/^Tether:/i, ['dhsTether']],
  [/^Unleash:/i, ['dhsUnleash']],
  [/^Unwieldy:/i, ['dhsUnwieldyFinesse']],
  [/^Warded:/i, ['dhsWardedWeapon']]
];

const armorMatchers = [
  [/^Adaptive:/i, ['dhsAdaptive']],
  [/^Biocharged:/i, ['dhsBiocharged']],
  [/^Bulky:/i, ['dhsBulkyArmor']],
  [/^Cornered:/i, ['dhsCornered']],
  [/^Deflect:/i, ['dhsDeflectArmor']],
  [/^Massive:/i, ['dhsMassiveArmor']],
  [/^Phantom:/i, ['dhsPhantom']],
  [/^Regrowth:/i, ['dhsRegrowth']],
  [/^Stims:/i, ['dhsStims']],
  [/^Transfer:/i, ['dhsTransfer']]
];

export function tnuWeaponFeatureValuesFromText(text) {
  return featureValuesFromText(text, weaponMatchers, tnuWeaponFeatures);
}

export function tnuArmorFeatureValuesFromText(text) {
  return featureValuesFromText(text, armorMatchers, tnuArmorFeatures);
}
