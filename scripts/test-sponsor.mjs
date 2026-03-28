// Diagnostic: Test sponsor path with a correctly-built posture-switch TransactionKind
// Usage: node scripts/test-sponsor.mjs

import { Transaction } from '@mysten/sui/transactions';
import { toBase64 } from '@mysten/sui/utils';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const WORLD = '0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75';
const CC = '0xeffb45b2b2e5419e05fc863ff25d2a593d55edb6e9e68c7e10ecef07c0b6aaed';
const GATE_CONFIG = '0x3695f8978ab8cc36b6ff3ebdf8b8882e2f4d73c5a9cce0918a04d0a6a29a3eee';
const CHAR = '0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110';
const OWNER_CAP = '0xa107699ef73b9ed369dfb15dbebdaa2ab9f36da0b63616a2af94c0117906f80a';
const GATE = '0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68';
const SENDER = '0xad0221857e57908707762a74b68e6f340b06a6e9f991c270ae9c06cf1a92fb71';
const SPONSOR_URL = 'https://flappy-frontier-sponsor.michael-davis-home.workers.dev/sponsor';

async function main() {
  const client = new SuiJsonRpcClient({ url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' });
  const gateType = `${WORLD}::gate::Gate`;

  const tx = new Transaction();
  const [gateCap, gateReceipt] = tx.moveCall({
    target: `${WORLD}::character::borrow_owner_cap`,
    typeArguments: [gateType],
    arguments: [tx.object(CHAR), tx.object(OWNER_CAP)],
  });
  tx.moveCall({
    target: `${CC}::posture::set_posture`,
    arguments: [tx.object(GATE_CONFIG), gateCap, tx.pure.id(GATE), tx.pure.u8(1)],
  });
  tx.moveCall({
    target: `${WORLD}::character::return_owner_cap`,
    typeArguments: [gateType],
    arguments: [tx.object(CHAR), gateCap, gateReceipt],
  });

  tx.setSenderIfNotSet(SENDER);

  console.log('--- Step 1: Building TransactionKind ---');
  const kindBytes = await tx.build({ client, onlyTransactionKind: true });
  const kindB64 = toBase64(kindBytes);
  console.log(`TransactionKind: ${kindBytes.length} bytes, ${kindB64.length} b64 chars`);
  console.log('First 4 bytes (hex):', Buffer.from(kindBytes.slice(0, 4)).toString('hex'));

  console.log('--- Step 2: Sending to sponsor worker ---');
  const resp = await fetch(SPONSOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txKindB64: kindB64, sender: SENDER }),
  });
  console.log(`Worker response: ${resp.status} ${resp.statusText}`);
  const body = await resp.text();
  console.log(`Worker body: ${body}`);

  if (resp.ok) {
    const data = JSON.parse(body);
    console.log('--- SUCCESS: Worker accepted the posture-switch PTB ---');
    console.log(`txB64 length: ${data.txB64?.length}`);
    console.log(`sponsorSignature length: ${data.sponsorSignature?.length}`);

    // Step 3: Can CC SDK parse the worker's txB64?
    console.log('--- Step 3: Parsing worker txB64 with Transaction.from() ---');
    try {
      const sponsoredTx = Transaction.from(data.txB64);
      const sponsoredData = sponsoredTx.getData();
      console.log(`Parsed OK. sender=${sponsoredData.sender}`);
      console.log('gasConfig:', JSON.stringify(sponsoredData.gasConfig, null, 2));
      console.log('Full data keys:', Object.keys(sponsoredData));

      // Step 4: Can we re-build it (what signTransaction would do)?
      console.log('--- Step 4: Re-building with toJSON() ---');
      const json = await sponsoredTx.toJSON({ client });
      const parsed = JSON.parse(json);
      console.log('toJSON gasConfig:', JSON.stringify(parsed.gasData, null, 2));
      console.log('toJSON sender:', parsed.sender);

      // Step 5: Build to BCS bytes and check gas owner
      console.log('--- Step 5: Build to BCS bytes ---');
      sponsoredTx.setSenderIfNotSet(SENDER);
      const builtBytes = await sponsoredTx.build({ client });
      console.log(`Built bytes: ${builtBytes.length} bytes`);
      console.log('--- ALL STEPS PASSED ---');
    } catch (parseErr) {
      console.error('PARSE FAILED:', parseErr.message);
      console.error(parseErr.stack);
    }
  } else {
    console.log('--- REJECTED: Worker did NOT accept ---');
  }
}

main().catch(err => { console.error('FATAL:', err.message); console.error(err.stack); });
