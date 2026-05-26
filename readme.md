# The New Unknown for Daggerheart

The New Unknown for Daggerheart is an unofficial Foundry VTT compendium module for the Foundryborne Daggerheart system. It packages The New Unknown playtest classes, subclasses, ancestries, communities, domain cards, weapons, armor, gear, implants, expendables, and rules journals.

## Installation

Use this manifest URL in Foundry VTT:

```text
https://github.com/Happytreedice/daggerheart-the-new-unknown/releases/latest/download/module.json
```

## Development

Build compendium packs with the official Foundry CLI:

```powershell
npm install
npm run build:packs
```

Create a release ZIP without uploading:

```powershell
npm run zip
```

Publish a GitHub release:

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
npm run release
```

The module registers The New Unknown domains, domain card types, weapon features, and armor features during Foundry initialization. It logs `The New Unknown for Daggerheart | Initialized successfully.` to the browser console when registration succeeds.

## Credits and Legal

This module is unofficial and independent. It is not affiliated with, endorsed by, sponsored by, or approved by Darrington Press, Critical Role, Foundry Gaming, EuryDice, Echoes of Ink, or The New Unknown creators.

- Daggerheart and the Daggerheart SRD are published by Darrington Press / Critical Role: https://darringtonpress.com/daggerheart/
- Darrington Press Community Gaming License: https://darringtonpress.com/license/
- Foundry Virtual Tabletop is published by Foundry Gaming LLC: https://foundryvtt.com/
- The New Unknown is published by EuryDice / Echoes of Ink: https://heartofdaggers.com/products/the-new-unknown-2nd-preview-playtest-volume-2-0-mind/
