const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.artifact.deleteMany({});
  
  const newArtifacts = [
    { id: 'v_obchod_1', name: 'Voucher do obchodu 1 000 Kč', description: 'Voucher pro nákup v partnerském obchodu.', type: 'ticket', price: 150000, rarity: 'common', image: '🎫', quantity: 999 },
    { id: 'v_obchod_2', name: 'Voucher do obchodu 2 000 Kč', description: 'Voucher pro nákup v partnerském obchodu.', type: 'ticket', price: 300000, rarity: 'rare', image: '🎟️', quantity: 999 },
    { id: 'v_obchod_5', name: 'Voucher do obchodu 5 000 Kč', description: 'Voucher pro nákup v partnerském obchodu.', type: 'ticket', price: 750000, rarity: 'epic', image: '🎁', quantity: 999 },
    { id: 'v_slevomat_1', name: 'Voucher na Slevomat 1 000 Kč', description: 'Slevový voucher na zážitky.', type: 'ticket', price: 150000, rarity: 'common', image: '🔖', quantity: 999 },
    { id: 'v_slevomat_2', name: 'Voucher na Slevomat 2 000 Kč', description: 'Slevový voucher na zážitky.', type: 'ticket', price: 300000, rarity: 'rare', image: '🏷️', quantity: 999 },
    { id: 'v_slevomat_5', name: 'Voucher na Slevomat 5 000 Kč', description: 'Slevový voucher na zážitky.', type: 'ticket', price: 750000, rarity: 'epic', image: '🎉', quantity: 999 },
    { id: 'v_vecere', name: 'Večeře pro dva 2 000 Kč', description: 'Zážitek večeře pro dva.', type: 'ticket', price: 300000, rarity: 'rare', image: '🍽️', quantity: 999 },
    { id: 'v_macbook', name: 'MacBook Air', description: 'Nový výkonný MacBook Air.', type: 'ticket', price: 4000000, rarity: 'legendary', image: '💻', quantity: 999 },
    { id: 'v_dovolena', name: 'Dovolená pro dva', description: 'Nezapomenutelná dovolená.', type: 'ticket', price: 10000000, rarity: 'legendary', image: '🏖️', quantity: 999 },
    { id: 'v_auto', name: 'Firemní auto', description: 'Pronájem nebo předání firemního vozu.', type: 'ticket', price: 1000000, rarity: 'legendary', image: '🚗', quantity: 999 }
  ];

  for (const item of newArtifacts) {
    await prisma.artifact.create({ data: item });
  }

  console.log('Store updated');
}

run().catch(console.error).finally(() => prisma.$disconnect());
