/**
 * scripts/patch-elder-scrolls.ts
 *
 * Renames "The Elder Scrolls: Skyrim" to "The Elder Scrolls" and rewrites
 * every field to encompass the full franchise and lore of Tamriel.
 *
 * Usage:  npm run patch:elder-scrolls
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = 'dev';
const COLLECTION = 'settings';

// ─────────────────────────────────────────────────────────────────────────────
// Full replacement document (preserves _id, votes, cover_image)
// ─────────────────────────────────────────────────────────────────────────────

const ELDER_SCROLLS_UPDATE = {
    name: 'The Elder Scrolls',

    description:
        'The continent of Tamriel stretches across an age of gods, prophecy, and empire. ' +
        'From the ashen wastes of Vvardenfell and the verdant heartlands of Cyrodiil to ' +
        'the frozen peaks of Skyrim, mortal heroes rise to face Daedric invasions, ' +
        'political collapse, and world-ending prophecies written in the inscrutable Elder Scrolls themselves.',

    system_message:
        'You are the game master of The Elder Scrolls universe, spanning all eras and provinces of Tamriel. ' +
        'Draw on the full breadth of lore — Morrowind\'s divine politics, Oblivion\'s Daedric invasions, ' +
        'Skyrim\'s dragon crisis, the ancient Dwemer mysteries, and the machinations of the Aldmeri Dominion. ' +
        'The player may be a prophesied hero, a wandering adventurer, or a humble guild-member; ' +
        'honour their archetype (warrior, mage, thief) and the province they inhabit. ' +
        'Invoke the five schools of magic, the Daedric Princes, and the Elder Scrolls themselves ' +
        'as forces that shape fate. Let the world feel vast, ancient, and morally complex.',

    genres: ['Fantasy', 'Action RPG', 'Open World', 'High Fantasy'],

    factions: [
        {
            name: 'The Cyrodiilic Empire',
            description:
                'The great human empire founded by Tiber Septim (Talos), ruling most of Tamriel ' +
                'through military might and the Dragonfires of the Elder Council.',
        },
        {
            name: 'The Aldmeri Dominion',
            description:
                'A powerful elven alliance of Altmer, Bosmer, and Khajiit seeking to reclaim ' +
                'Elven supremacy and erase the worship of Talos from the Empire.',
        },
        {
            name: 'The Tribunal Temple',
            description:
                'The theocratic ruling body of Morrowind, worshipping the living gods Vivec, ' +
                'Almalexia, and Sotha Sil — Dunmer heroes who stole divine power from Lorkhan\'s heart.',
        },
        {
            name: 'The Mages Guild',
            description:
                'An empire-sanctioned organisation overseeing the study and regulation of magic ' +
                'across Tamriel, constantly in tension with independent schools and Daedric cults.',
        },
        {
            name: 'The Dark Brotherhood',
            description:
                'A secretive assassin\'s guild serving the Daedric Prince Sithis, bound by the ' +
                'sacred tenets of the Night Mother and feared across all provinces.',
        },
    ],

    key_beings: [
        {
            name: 'The Nerevarine',
            description:
                'The prophesied reincarnation of Indoril Nerevar, destined to defeat the corrupted ' +
                'Tribunal and the Blight-spreading Dagoth Ur on Vvardenfell.',
        },
        {
            name: 'The Champion of Cyrodiil',
            description:
                'The Hero of Kvatch who closed the Oblivion Gates and helped Martin Septim sacrifice ' +
                'himself to banish Mehrunes Dagon from Tamriel forever.',
        },
        {
            name: 'The Dovahkiin',
            description:
                'A mortal born with the soul of a dragon, wielding the Thu\'um (dragon shouts) to ' +
                'defeat Alduin the World-Eater and prevent the end of the world.',
        },
        {
            name: 'Vivec',
            description:
                'Poet-warrior-god of Morrowind, one of the Tribunal, whose contradictory nature ' +
                'embodies the central tension between mortality and divinity in TES lore.',
        },
        {
            name: 'Mehrunes Dagon',
            description:
                'Daedric Prince of Destruction, Change, and Revolution — the primary antagonist of ' +
                'the Oblivion Crisis and an eternal threat lurking beyond the veil of reality.',
        },
    ],

    key_themes: [
        {
            theme: 'Prophecy and the Elder Scrolls',
            description:
                'The titular scrolls contain all things past, present, and future but blind those who ' +
                'read them. Every era sees a mortal hero called to fulfil an inscrutable prophecy.',
        },
        {
            theme: 'Mortal Divinity',
            description:
                'Gods were once mortals; mortals can ascend to godhood. The line between worship and ' +
                'history is blurred, and the nature of divinity is repeatedly contested.',
        },
        {
            theme: 'Empire and Resistance',
            description:
                'Imperial expansion, elven supremacism, and provincial identity create perpetual ' +
                'political tension across every era of Tamriel\'s history.',
        },
        {
            theme: 'Daedric Influence',
            description:
                'The Daedric Princes are neither good nor evil but ineffable — bargaining with them ' +
                'offers great power at unknowable cost.',
        },
        {
            theme: 'The Lost Dwemer',
            description:
                'The Dwemer (Deep Elves) vanished entirely in the First Era, leaving behind enigmatic ' +
                'ruins, clockwork automatons, and unanswered questions that drive countless quests.',
        },
    ],

    major_locations: [
        {
            name: 'Vvardenfell',
            description:
                'The volcanic island heart of Morrowind, home to the Tribunal Temple, the Red Mountain\'s ' +
                'Blight, and the ruins of a Dwemer civilisation that simply ceased to exist.',
        },
        {
            name: 'The Imperial City',
            description:
                'The seat of human power on the Isle of the Amulet of Kings, Cyrodiil — a gleaming ' +
                'city at the centre of the continent and the Empire.',
        },
        {
            name: 'Sovngarde',
            description:
                'The Nordic afterlife — a golden mead-hall realm where honoured warriors feast for ' +
                'eternity, reached through Skuldafn by the Dovahkiin.',
        },
        {
            name: 'The Clockwork City',
            description:
                'Sotha Sil\'s hidden mechanical realm — an impossibly intricate city of gears, pipes, ' +
                'and constructs that the Tribunal god built to perfect the laws of reality.',
        },
        {
            name: 'Oblivion',
            description:
                'The planes of the Daedric Princes — pocket dimensions of fire, madness, order, and ' +
                'decay bleed into Tamriel through Oblivion Gates during times of crisis.',
        },
    ],

    rules: [
        {
            rule: 'The Scrolls Are Unknowable',
            description:
                'Elder Scrolls are artefacts of unimaginable age that reveal fate but shatter the ' +
                'mind of any mortal who reads them without years of preparation.',
        },
        {
            rule: 'Skills Grow Through Use',
            description:
                'All classes progress by doing — every school of magic, weapon type, and craft ' +
                'improves with practice, not by spending points in a menu.',
        },
        {
            rule: 'Daedric Bargains Have Costs',
            description:
                'Each of the seventeen Daedric Princes can be bargained with, but their gifts always ' +
                'serve their own inscrutable ends — never trust their generosity.',
        },
        {
            rule: 'Province Shapes Culture',
            description:
                'Dunmer, Nord, Imperial, Bosmer, Khajiit, and Argonian cultures have deeply different ' +
                'values, laws, and relationships with magic — roleplay accordingly.',
        },
        {
            rule: 'Lore Respects Canon',
            description:
                'In-universe knowledge is shaped by unreliable in-game texts; the game master may ' +
                'contradict "fact" because all Tamrielic history is filtered through biased narrators.',
        },
    ],

    // Keep the existing cover image for now — it's a snow/mountain landscape
    // that still works as Tamriel. Update manually if a better image is found.
    cover_image:
        'https://images.unsplash.com/photo-1551968118-ccc547339041?w=800&q=80',

    // ── Theme — aged parchment / scroll gold on deep charcoal ─────────────────
    //
    // The Elder Scrolls franchise identity: The ES logo is gold on near-black.
    // Mountains and ruins of Tamriel suggest charcoal-brown depths, with warm
    // amber-gold accents echoing the physical scrolls, candlelight, and alchemy.
    // Cinzel is the definitive ES display font.
    //
    theme: {
        bg:             '#050404',
        panel:          '#0c0906',
        elevated:       '#18130a',
        muted:          '#c4a030',
        text:           '#f4ead8',
        textWeak:       '#d0b878',
        accent:         '#b08820',
        accentStrong:   '#f0c84a',
        border:         'rgba(190, 150, 30, 0.12)',
        glow:           'rgba(180, 135, 20, 0.30)',
        ambientA:       'rgba(120, 60, 10, 0.20)',
        ambientB:       'rgba(60, 90, 30, 0.14)',
        buttonGradient: 'linear-gradient(135deg, #4a2800 0%, #7a5500 50%, #2e1600 100%)',
        playerBubble:   'linear-gradient(135deg, rgba(74,40,0,0.36) 0%, rgba(122,85,0,0.14) 100%)',
        fontUrl:        'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
        fontDisplay:    "'Cinzel', 'Space Grotesk', serif",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in your .env.local file');

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);

    const result = await col.updateOne(
        { name: { $regex: /^the elder scrolls/i } },
        { $set: ELDER_SCROLLS_UPDATE },
    );

    if (result.matchedCount === 0) {
        console.log('⚠️  No setting matching "The Elder Scrolls..." found in the database.');
    } else if (result.modifiedCount === 0) {
        console.log('ℹ️  Document already up-to-date (no changes written).');
    } else {
        console.log('✅  The Elder Scrolls setting patched successfully.');
        console.log('    name:  ', ELDER_SCROLLS_UPDATE.name);
        console.log('    genres:', ELDER_SCROLLS_UPDATE.genres.join(', '));
        console.log('    theme.accent:', ELDER_SCROLLS_UPDATE.theme.accent);
    }

    await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
