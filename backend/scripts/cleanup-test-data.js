/**
 * cleanup-test-data.js
 * Removes all test data before go-live.
 *
 * DELETES:  Notifications, Transactions, RequestItems, Requests
 * KEEPS:    Users (all accounts), Categories, Items (inventory untouched)
 *
 * Run once from backend/:
 *   node scripts/cleanup-test-data.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\nStarting test data cleanup...\n')

  const notifications = await prisma.notification.deleteMany({})
  console.log(`Deleted ${notifications.count} notification(s)`)

  const transactions = await prisma.transaction.deleteMany({})
  console.log(`Deleted ${transactions.count} transaction(s)`)

  const requestItems = await prisma.requestItem.deleteMany({})
  console.log(`Deleted ${requestItems.count} request item(s)`)

  const requests = await prisma.request.deleteMany({})
  console.log(`Deleted ${requests.count} request(s)`)

  console.log('\nDone. Inventory, categories, and all accounts are untouched.\n')
}

main()
  .catch(err => { console.error('\nError:', err.message, '\n'); process.exit(1) })
  .finally(() => prisma.$disconnect())
