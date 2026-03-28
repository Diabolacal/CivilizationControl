/**
 * Test turret targeting function via devInspect.
 * Uses raw HTTPS RPC calls + SDK for TX building only.
 */
import https from 'node:https';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { toBase64 } from '@mysten/sui/utils';

const WORLD = '0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75';
const CC_V3 = '0xb3fd08b7b3a1d2d964c6fc0952955f0ad7a796a6bb174a934522a818a0cc93e7';
const TURRET = '0x557e67427071e146865063de44c3cb2ffddc780801c09b6bf4d621e35ba85462';
const CHAR = '0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110';
const SENDER = '0x0000000000000000000000000000000000000000000000000000000000000000';

function rpc(method, params) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
        const req = https.request({
            hostname: 'fullnode.testnet.sui.io',
            port: 443, path: '/', method: 'POST',
            headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
        }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const TargetCandidate = bcs.struct('TargetCandidate', {
    item_id: bcs.u64(), type_id: bcs.u64(), group_id: bcs.u64(),
    character_id: bcs.u32(), character_tribe: bcs.u32(),
    hp_ratio: bcs.u64(), shield_ratio: bcs.u64(), armor_ratio: bcs.u64(),
    is_aggressor: bcs.bool(), priority_weight: bcs.u64(), behaviour_change: bcs.u8(),
});

const ReturnEntry = bcs.struct('ReturnTargetPriorityList', {
    target_item_id: bcs.u64(), priority_weight: bcs.u64(),
});

async function main() {
    // 1. Get owner tribe and turret state
    const [charR, turretR] = await Promise.all([
        rpc('sui_getObject', [CHAR, { showContent: true }]),
        rpc('sui_getObject', [TURRET, { showContent: true }]),
    ]);
    const ownerTribe = Number(charR.result?.data?.content?.fields?.tribe_id ?? 0);
    console.log('Owner tribe:', ownerTribe);

    const ext = turretR.result?.data?.content?.fields?.extension?.fields?.name;
    console.log('Current extension:', ext);
    const isCommercial = ext?.includes('CommercialAuth');
    console.log('Current doctrine:', isCommercial ? 'COMMERCIAL' : 'DEFENSE');

    // Also get initial shared versions
    const [turretOwner, charOwner] = await Promise.all([
        rpc('sui_getObject', [TURRET, { showOwner: true }]),
        rpc('sui_getObject', [CHAR, { showOwner: true }]),
    ]);
    const turretISV = turretOwner.result?.data?.owner?.Shared?.initial_shared_version;
    const charISV = charOwner.result?.data?.owner?.Shared?.initial_shared_version;
    console.log('Turret ISV:', turretISV, 'Char ISV:', charISV);

    // 3. Build synthetic candidates
    const otherTribe = ownerTribe === 1 ? 2 : 1;
    const candidates = [
        { item_id: 1001n, type_id: 100n, group_id: 1n, character_id: 10, character_tribe: ownerTribe,
          hp_ratio: 100n, shield_ratio: 100n, armor_ratio: 100n, is_aggressor: false, priority_weight: 1000n, behaviour_change: 1 },
        { item_id: 1002n, type_id: 100n, group_id: 1n, character_id: 20, character_tribe: otherTribe,
          hp_ratio: 100n, shield_ratio: 100n, armor_ratio: 100n, is_aggressor: false, priority_weight: 1000n, behaviour_change: 1 },
        { item_id: 1003n, type_id: 100n, group_id: 1n, character_id: 30, character_tribe: otherTribe + 1,
          hp_ratio: 100n, shield_ratio: 100n, armor_ratio: 100n, is_aggressor: true, priority_weight: 1000n, behaviour_change: 2 },
    ];

    const candidateBytes = Array.from(
        new Uint8Array(bcs.vector(TargetCandidate).serialize(candidates).toBytes())
    );

    // 4. Build PTB with explicit shared object inputs
    const tx = new Transaction();
    tx.setSender(SENDER);
    tx.setGasBudget(100_000_000);
    tx.setGasPayment([]);

    const turretInput = tx.sharedObjectRef({
        objectId: TURRET,
        initialSharedVersion: turretISV,
        mutable: false,
    });
    const charInput = tx.sharedObjectRef({
        objectId: CHAR,
        initialSharedVersion: charISV,
        mutable: false,
    });

    const [receipt] = tx.moveCall({
        target: `${WORLD}::turret::verify_online`,
        arguments: [turretInput],
    });
    tx.moveCall({
        target: `${CC_V3}::turret::get_target_priority_list`,
        arguments: [
            turretInput,
            charInput,
            tx.pure(bcs.vector(bcs.u8()).serialize(candidateBytes).toBytes()),
            receipt,
        ],
    });

    const txBytes = await tx.build({ onlyTransactionKind: true });
    const b64 = toBase64(txBytes);
    console.log('\nRunning devInspect... (tx bytes:', txBytes.length, ')');

    // 5. Execute devInspect
    const result = await rpc('sui_devInspectTransactionBlock', [SENDER, b64]);
    console.log('RPC result keys:', result ? Object.keys(result) : 'null');
    if (result.error) {
        console.log('RPC error:', JSON.stringify(result.error, null, 2).slice(0, 500));
        process.exit(1);
    }
    const effects = result.result;

    console.log('Status:', effects?.effects?.status?.status);
    if (effects?.effects?.status?.status !== 'success') {
        console.log('Result keys:', effects ? Object.keys(effects) : 'null');
        if (effects?.effects) console.log('Effects keys:', Object.keys(effects.effects));
        console.log('Top-level status:', effects?.status);
        console.log('Error:', JSON.stringify(effects?.effects?.status ?? effects?.error, null, 2)?.slice(0, 500));
        process.exit(1);
    }

    // 6. Parse return values
    const rv = effects?.results?.[1]?.returnValues;
    if (!rv?.length) { console.log('No return values'); process.exit(1); }

    const rawBytes = new Uint8Array(rv[0][0]);
    const innerBytes = new Uint8Array(bcs.vector(bcs.u8()).parse(rawBytes));
    console.log('Return bytes length:', innerBytes.length);

    if (innerBytes.length === 0) {
        console.log('\nRESULT: EMPTY target list (0 engaged)');
    } else {
        const entries = bcs.vector(ReturnEntry).parse(innerBytes);
        console.log('\nRESULT: Engaged targets:', entries.length);
        for (const e of entries) {
            const id = Number(e.target_item_id);
            const prio = Number(e.priority_weight);
            let label = '';
            if (id === 1001) label = '(same-tribe non-aggressor)';
            else if (id === 1002) label = '(outsider non-aggressor — NEUTRAL)';
            else if (id === 1003) label = '(outsider aggressor)';
            console.log(`  item_id: ${id} ${label} → priority: ${prio}`);
        }
    }

    // 7. Print events
    if (effects?.events?.length) {
        console.log('\nEvents:');
        for (const ev of effects.events) {
            console.log(`  ${ev.type}`);
            console.log(`  ${JSON.stringify(ev.parsedJson)}`);
        }
    }

    console.log('\n=== EXPECTED ===');
    if (isCommercial) {
        console.log('COMMERCIAL: Only aggressors engaged.');
        console.log('  1001 (same-tribe, non-agg) → EXCLUDED');
        console.log('  1002 (outsider, non-agg)   → EXCLUDED');
        console.log('  1003 (outsider, aggressor)  → ENGAGED');
    } else {
        console.log('DEFENSE: All non-tribe engaged + all aggressors.');
        console.log('  1001 (same-tribe, non-agg) → EXCLUDED');
        console.log('  1002 (outsider, non-agg)   → ENGAGED ← KEY');
        console.log('  1003 (outsider, aggressor)  → ENGAGED');
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
