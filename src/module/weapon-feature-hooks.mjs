const FEATURE_FLAG = 'impactZone';
const FEATURE_ID = 'dhsImpactZone';
const DC = 13;

export function registerWeaponFeatureHooks({ moduleId, i18nPrefix }) {
  Hooks.on(`${CONFIG.DH?.id ?? 'daggerheart'}.postUseAction`, (action, config) => {
    handlePostUseAction(action, config, { moduleId, i18nPrefix });
  });

  Hooks.on('renderChatMessageHTML', (message, element) => {
    activateImpactZoneMessage(message, element, { moduleId, i18nPrefix });
  });
}

async function handlePostUseAction(action, config, { moduleId, i18nPrefix }) {
  const item = action?.item;
  if (!item || item.type !== 'weapon') return;
  if (action.id !== item.system.attack?.id) return;
  if (!item.system.weaponFeatures?.some(feature => feature.value === FEATURE_ID)) return;
  if (!config.roll?.success && !config.targets?.some(target => target.hit)) return;

  const hitTargets = (config.targets ?? []).filter(target => target.hit);
  if (!hitTargets.length) return;

  const targets = collectImpactTargets(hitTargets, action.actor);
  if (!targets.length) return;

  const data = {
    feature: FEATURE_FLAG,
    sourceActorUuid: action.actor.uuid,
    itemUuid: item.uuid,
    sourceActionId: action.id,
    dc: DC,
    damage: simplifyDamage(config.damage),
    targets,
    results: {},
    applied: false
  };

  await ChatMessage.create({
    type: 'systemMessage',
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor: action.actor }),
    title: localize(`${i18nPrefix}.Hook.ImpactZone.Title`),
    content: renderImpactZoneContent(data, { i18nPrefix }),
    flags: {
      [moduleId]: {
        [FEATURE_FLAG]: data
      }
    }
  });
}

function collectImpactTargets(hitTargets, sourceActor) {
  const results = new Map();
  const scene = canvas.scene;
  const maxDistance = scene?.rangeSettings?.veryClose ?? 15;
  const sourceTokenIds = new Set(sourceActor?.getActiveTokens?.().map(token => token.id) ?? []);

  for (const target of hitTargets) {
    const targetToken = target.id ? canvas.tokens.get(target.id) : null;
    if (!targetToken) {
      results.set(target.actorId, {
        tokenId: target.id,
        actorUuid: target.actorId,
        name: target.name,
        img: target.img
      });
      continue;
    }

    for (const token of canvas.tokens.placeables) {
      if (!token.actor || sourceTokenIds.has(token.id)) continue;
      if (targetToken.distanceTo(token) > maxDistance) continue;

      results.set(token.document.id, {
        tokenId: token.document.id,
        actorUuid: token.actor.uuid,
        name: token.name,
        img: token.actor.img
      });
    }
  }

  return Array.from(results.values());
}

function activateImpactZoneMessage(message, element, { moduleId, i18nPrefix }) {
  const data = message.getFlag(moduleId, FEATURE_FLAG);
  if (!data) return;

  for (const button of element.querySelectorAll('[data-dhtnu-action="reaction"]')) {
    button.addEventListener('click', event => rollReaction(event, message, { moduleId, i18nPrefix }));
  }

  const damageButton = element.querySelector('[data-dhtnu-action="damage"]');
  damageButton?.addEventListener('click', event => dealDamage(event, message, { moduleId, i18nPrefix }));
}

async function rollReaction(event, message, { moduleId, i18nPrefix }) {
  event.preventDefault();
  event.stopPropagation();

  const tokenId = event.currentTarget.dataset.tokenId;
  const data = foundry.utils.deepClone(message.getFlag(moduleId, FEATURE_FLAG));
  const target = data.targets.find(candidate => candidate.tokenId === tokenId);
  const actor = target ? await foundry.utils.fromUuid(target.actorUuid) : null;
  if (!actor) return ui.notifications.warn(localize(`${i18nPrefix}.Hook.ImpactZone.MissingTarget`));

  const result = await actor.diceRoll({
    event,
    title: game.i18n.format(`${i18nPrefix}.Hook.ImpactZone.ReactionTitle`, { name: actor.name, dc: data.dc }),
    roll: {
      trait: null,
      difficulty: data.dc,
      type: 'trait',
      advantage: 0,
      baseModifiers: []
    },
    actionType: 'reaction',
    hasRoll: true,
    dialog: { configure: false },
    skips: { triggers: true }
  });

  if (!result?.roll) return;
  data.results[tokenId] = {
    total: result.roll.total,
    success: Boolean(result.roll.success)
  };

  await updateImpactMessage(message, data, { moduleId, i18nPrefix });
}

async function dealDamage(event, message, { moduleId, i18nPrefix }) {
  event.preventDefault();
  event.stopPropagation();

  if (!game.user.isGM) {
    return ui.notifications.warn(localize(`${i18nPrefix}.Hook.ImpactZone.GmOnly`));
  }

  const data = foundry.utils.deepClone(message.getFlag(moduleId, FEATURE_FLAG));
  if (data.applied) return;

  const sourceActor = await foundry.utils.fromUuid(data.sourceActorUuid);
  const item = await foundry.utils.fromUuid(data.itemUuid);
  const baseDamage = data.damage ?? (await rollSourceDamage(sourceActor, item, data.sourceActionId));
  if (!baseDamage) return ui.notifications.warn(localize(`${i18nPrefix}.Hook.ImpactZone.NoDamage`));

  const applied = [];
  for (const target of data.targets) {
    const actor = await foundry.utils.fromUuid(target.actorUuid);
    if (!actor) continue;

    const reaction = data.results[target.tokenId];
    const damage = scaleDamage(baseDamage, reaction?.success ? 0.5 : 1);
    const updates = await actor.takeDamage(damage, false);
    applied.push({ tokenId: target.tokenId, updates: updates ?? [] });
  }

  data.damage = baseDamage;
  data.applied = true;
  data.appliedTargets = applied;
  await updateImpactMessage(message, data, { moduleId, i18nPrefix });
}

async function rollSourceDamage(actor, item, actionId) {
  if (!actor || !item) return null;

  const action = item.system.actionsList?.find(candidate => candidate.id === actionId) ?? item.system.attack;
  const parts = action?.damage?.parts ?? item.system.attack?.damage?.parts;
  const formulas = Array.from(parts ?? []).map(part => ({
    formula: part.value.getFormula(),
    damageTypes: part.applyTo === 'hitPoints' && !part.type?.size ? new Set(['physical']) : part.type,
    applyTo: part.applyTo
  }));
  if (!formulas.length) return null;

  const config = {
    dialog: { configure: false },
    evaluate: true,
    hasDamage: true,
    hasHealing: false,
    source: {
      actor: actor.uuid,
      item: item.id,
      action: action?.id
    },
    data: actor.getRollData(),
    roll: formulas,
    damageOptions: { groupAttack: null },
    effects: await game.system.api.data.actions.actionsTypes.base.getEffects(actor, item),
    skips: { createMessage: true },
    modifiers: {}
  };

  await CONFIG.Dice.daggerheart.DamageRoll.build(config);
  return simplifyDamage(config.damage);
}

function simplifyDamage(damage) {
  if (!damage) return null;

  return Object.fromEntries(
    Object.entries(damage).map(([key, value]) => [
      key,
      {
        formula: value.formula,
        total: value.total,
        parts: value.parts.map(part => ({
          applyTo: part.applyTo,
          damageTypes: Array.from(part.damageTypes ?? part.type ?? []),
          formula: part.formula,
          total: part.total,
          modifierTotal: part.modifierTotal ?? 0
        }))
      }
    ])
  );
}

function scaleDamage(damage, multiplier) {
  const clone = foundry.utils.deepClone(damage);
  for (const value of Object.values(clone)) {
    value.total = 0;
    for (const part of value.parts) {
      part.total = Math.ceil(part.total * multiplier);
      value.total += part.total;
    }
  }
  return clone;
}

async function updateImpactMessage(message, data, { moduleId, i18nPrefix }) {
  await message.update({
    content: renderImpactZoneContent(data, { i18nPrefix }),
    flags: {
      [moduleId]: {
        [FEATURE_FLAG]: data
      }
    }
  });
}

function renderImpactZoneContent(data, { i18nPrefix }) {
  const rows = data.targets
    .map(target => {
      const result = data.results[target.tokenId];
      const status = result
        ? result.success
          ? game.i18n.format(`${i18nPrefix}.Hook.ImpactZone.Success`, { total: result.total })
          : game.i18n.format(`${i18nPrefix}.Hook.ImpactZone.Failure`, { total: result.total })
        : localize(`${i18nPrefix}.Hook.ImpactZone.Pending`);

      const button = data.applied
        ? ''
        : `<button type="button" data-dhtnu-action="reaction" data-token-id="${escapeHtml(target.tokenId)}">${localize(`${i18nPrefix}.Hook.ImpactZone.RollReaction`)}</button>`;

      return `<li style="display:flex;align-items:center;gap:8px;margin:4px 0;">
        <img src="${escapeHtml(target.img ?? '')}" width="24" height="24" style="border:0;" />
        <strong style="flex:1;">${escapeHtml(target.name)}</strong>
        <span>${escapeHtml(status)}</span>
        ${button}
      </li>`;
    })
    .join('');

  const damageButton = data.applied
    ? `<p><strong>${localize(`${i18nPrefix}.Hook.ImpactZone.Applied`)}</strong></p>`
    : `<div class="roll-buttons"><button type="button" data-dhtnu-action="damage">${localize(`${i18nPrefix}.Hook.ImpactZone.DealDamage`)}</button></div>`;

  return `<section class="dhtnu-impact-zone">
    <h3>${localize(`${i18nPrefix}.Hook.ImpactZone.Title`)}</h3>
    <p>${game.i18n.format(`${i18nPrefix}.Hook.ImpactZone.Body`, { dc: data.dc })}</p>
    <ul style="list-style:none;margin:0;padding:0;">${rows}</ul>
    ${damageButton}
  </section>`;
}

function localize(key) {
  return game.i18n.has(key) ? game.i18n.localize(key) : key;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}
