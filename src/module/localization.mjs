const LOCALIZED_DOCUMENT_TYPES = new Set(['Item', 'Actor', 'JournalEntry']);

export function registerRuntimeLocalization({ moduleId, i18nPrefix, moduleName, packNames }) {
  Hooks.once('ready', async () => {
    localizePackLabels({ moduleId, i18nPrefix, packNames });
    patchCompendiumPacks({ moduleId, i18nPrefix, packNames });
    registerSafeTriggerDiagnostics(moduleName);

    if (game.user?.isGM) {
      await localizeWorldDocuments({ moduleId, i18nPrefix });
    }
  });

  for (const type of LOCALIZED_DOCUMENT_TYPES) {
    Hooks.on(`preCreate${type}`, document => {
      localizeDocumentSource(document, { moduleId, i18nPrefix });
    });
  }
}

function localizePackLabels({ moduleId, i18nPrefix, packNames }) {
  for (const packName of packNames) {
    const pack = game.packs.get(`${moduleId}.${packName}`);
    const labelKey = `${i18nPrefix}.Pack.${packName}`;
    if (pack && game.i18n.has(labelKey)) pack.metadata.label = game.i18n.localize(labelKey);
  }

  ui.compendium?.render?.();
}

function patchCompendiumPacks({ moduleId, i18nPrefix, packNames }) {
  for (const packName of packNames) {
    const pack = game.packs.get(`${moduleId}.${packName}`);
    if (!pack || pack._dhsLocalized) continue;

    const originalGetIndex = pack.getIndex.bind(pack);
    const originalGetDocument = pack.getDocument.bind(pack);
    const originalGetDocuments = pack.getDocuments.bind(pack);

    pack.getIndex = async options => {
      const index = await originalGetIndex(options);
      localizePackIndex(pack, { i18nPrefix });
      return index;
    };

    pack.getDocument = async id => {
      const document = await originalGetDocument(id);
      localizeDocumentSource(document, { moduleId, i18nPrefix });
      localizePackIndex(pack, { i18nPrefix });
      return document;
    };

    pack.getDocuments = async query => {
      const documents = await originalGetDocuments(query);
      for (const document of documents) localizeDocumentSource(document, { moduleId, i18nPrefix });
      localizePackIndex(pack, { i18nPrefix });
      return documents;
    };

    pack._dhsLocalized = true;
    localizePackIndex(pack, { i18nPrefix });
  }
}

function localizePackIndex(pack, { i18nPrefix }) {
  const packName = pack.metadata.name;
  for (const entry of pack.index ?? []) {
    const key = `${i18nPrefix}.Compendium.${packName}.${entry._id}.Name`;
    if (game.i18n.has(key)) entry.name = game.i18n.localize(key);
  }
}

async function localizeWorldDocuments({ moduleId, i18nPrefix }) {
  const worldItems = game.items?.contents ?? [];
  for (const item of worldItems) await localizeWorldDocument(item, { moduleId, i18nPrefix });

  for (const actor of game.actors?.contents ?? []) {
    await localizeWorldDocument(actor, { moduleId, i18nPrefix });

    const itemUpdates = [];
    for (const item of actor.items ?? []) {
      const update = getLocalizationUpdate(item, { moduleId, i18nPrefix });
      if (!foundry.utils.isEmpty(update)) itemUpdates.push({ _id: item.id, ...update });
    }
    if (itemUpdates.length) await actor.updateEmbeddedDocuments('Item', itemUpdates);
  }

  for (const journal of game.journal?.contents ?? []) {
    await localizeWorldJournal(journal, { moduleId, i18nPrefix });
  }
}

async function localizeWorldDocument(document, options) {
  const update = getLocalizationUpdate(document, options);
  if (!foundry.utils.isEmpty(update)) await document.update(update);
}

function localizeDocumentSource(document, options) {
  if (!document?.updateSource) return;

  if (document.documentName === 'JournalEntry') {
    localizeJournalSource(document, options);
    return;
  }

  const update = getLocalizationUpdate(document, options);
  if (!foundry.utils.isEmpty(update)) document.updateSource(update);
}

function getLocalizationUpdate(document, { moduleId, i18nPrefix }) {
  const packRef = getPackReference(document, moduleId);
  if (!packRef) return {};

  const update = {};
  const base = `${i18nPrefix}.Compendium.${packRef.packName}.${packRef.documentId}`;
  setLocalized(update, 'name', `${base}.Name`);

  if (document.documentName === 'Item' || document.documentName === 'Actor') {
    setLocalized(update, 'system.description', `${base}.Description`, { html: true });
    addFeatureActionLocalization(update, document);
  }

  return removeUnchanged(document, update);
}

function getPackReference(document, moduleId) {
  if (document.pack?.startsWith(`${moduleId}.`)) {
    return {
      packName: document.pack.split('.')[1],
      documentId: document.id
    };
  }

  const source = document._stats?.compendiumSource ?? document._source?._stats?.compendiumSource;
  const match = source?.match(new RegExp(`^Compendium\\.${escapeRegExp(moduleId)}\\.([^.]+)\\.[^.]+\\.([^.]+)$`));
  if (!match) return null;

  return {
    packName: match[1],
    documentId: match[2]
  };
}

function addFeatureActionLocalization(update, document) {
  const system = document.system;
  const featureGroups = [
    { refs: system?.weaponFeatures ?? [], all: CONFIG.DH?.ITEM?.allWeaponFeatures?.() ?? {} },
    { refs: system?.armorFeatures ?? [], all: CONFIG.DH?.ITEM?.allArmorFeatures?.() ?? {} }
  ];

  for (const { refs, all } of featureGroups) {
    for (const featureRef of refs) {
      const featureData = all[featureRef.value];
      if (!featureData) continue;

      for (const [index, actionId] of (featureRef.actionIds ?? []).entries()) {
        const action = featureData.actions?.[index];
        if (!action) continue;
        setLocalized(update, `system.actions.${actionId}.name`, action.name);
        setLocalized(update, `system.actions.${actionId}.description`, action.description);
      }
    }
  }
}

async function localizeWorldJournal(journal, { moduleId, i18nPrefix }) {
  const packRef = getPackReference(journal, moduleId);
  if (!packRef) return;

  const base = `${i18nPrefix}.Compendium.${packRef.packName}.${packRef.documentId}`;
  const update = {};
  setLocalized(update, 'name', `${base}.Name`);
  const filtered = removeUnchanged(journal, update);
  if (!foundry.utils.isEmpty(filtered)) await journal.update(filtered);

  const pageUpdates = getJournalPageUpdates(journal, base).map(page => ({ _id: page.page.id, ...page.update }));
  if (pageUpdates.length) await journal.updateEmbeddedDocuments('JournalEntryPage', pageUpdates);
}

function localizeJournalSource(journal, { moduleId, i18nPrefix }) {
  const update = getLocalizationUpdate(journal, { moduleId, i18nPrefix });
  if (!foundry.utils.isEmpty(update)) journal.updateSource(update);

  const packRef = getPackReference(journal, moduleId);
  if (!packRef) return;

  const base = `${i18nPrefix}.Compendium.${packRef.packName}.${packRef.documentId}`;
  for (const { page, update: pageUpdate } of getJournalPageUpdates(journal, base)) {
    page.updateSource(pageUpdate);
  }
}

function getJournalPageUpdates(journal, base) {
  return Array.from(journal.pages ?? []).flatMap((page, index) => {
    const update = {};
    setLocalized(update, 'name', `${base}.Page.${index}.Name`);
    setLocalized(update, 'text.content', `${base}.Page.${index}.Content`, { html: true });
    const filtered = removeUnchanged(page, update);
    return foundry.utils.isEmpty(filtered) ? [] : [{ page, update: filtered }];
  });
}

function setLocalized(update, path, key, { html = false } = {}) {
  if (!key || !game.i18n.has(key)) return;
  const value = game.i18n.localize(key);
  foundry.utils.setProperty(update, path, html ? toHtml(value) : value);
}

function removeUnchanged(document, update) {
  const filtered = {};
  for (const [path, value] of Object.entries(foundry.utils.flattenObject(update))) {
    if (foundry.utils.getProperty(document, path) !== value) foundry.utils.setProperty(filtered, path, value);
  }
  return filtered;
}

function toHtml(value) {
  if (!value) return value;
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;

  return String(value)
    .split(/\n{2,}/)
    .map(block => `<p>${foundry.utils.escapeHTML(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function registerSafeTriggerDiagnostics(moduleName) {
  const registry = game.system?.registeredTriggers;
  if (!registry || registry._dhsSafeTriggerDiagnostics) return;

  registry.runTrigger = async function runTriggerWithDiagnostics(trigger, currentActor, ...args) {
    const updates = [];
    const triggerSettings = game.settings.get(CONFIG.DH.id, CONFIG.DH.SETTINGS.gameSettings.Automation).triggers;
    if (!triggerSettings.enabled) return updates;

    const registered = this.get(trigger);
    if (!registered?.size) return updates;

    const triggerActors = ['character', 'adversary', 'environment'];
    for (const [itemUuid, { actor: actorUuid, triggeringActorType, commands }] of registered.entries()) {
      const actor = await foundry.utils.fromUuid(actorUuid);
      if (!actor || !triggerActors.includes(actor.type)) continue;

      const triggerData = CONFIG.DH.TRIGGER.triggers[trigger];
      if (!triggerData) continue;
      if (triggerData.usesActor && triggeringActorType !== 'any') {
        if (triggeringActorType === 'self' && currentActor?.uuid !== actorUuid) continue;
        if (triggeringActorType === 'other' && currentActor?.uuid === actorUuid) continue;
      }

      for (const command of commands) {
        try {
          const result = await command(...args);
          if (result?.updates?.length) updates.push(...result.updates);
        } catch (error) {
          const triggerName = game.i18n.localize(triggerData.label);
          const item = await foundry.utils.fromUuid(itemUuid);
          console.error(`${moduleName} | Daggerheart trigger failed`, {
            trigger: triggerName,
            currentActor: currentActor?.name,
            triggerActor: actor.name,
            item: item?.name,
            itemUuid,
            error
          });
        }
      }
    }

    return updates;
  };

  registry._dhsSafeTriggerDiagnostics = true;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
