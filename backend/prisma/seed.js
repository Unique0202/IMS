/**
 * Database seed script — creates initial data.
 *
 * Run with: node prisma/seed.js
 *
 * Creates:
 *   - 1 admin user (admin@cipd.iiitd.ac.in / admin123)
 *   - 1 test student (test@iiitd.ac.in / test123)
 *   - 9 inventory categories matching the CIPD lab sheets
 *
 * IDEMPOTENT:
 *   Uses upsert so you can run this multiple times safely.
 *   If the data already exists, it updates instead of duplicating.
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ===== USERS =====
  const adminPassword = await bcrypt.hash('admin123', 10)
  const studentPassword = await bcrypt.hash('test123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cipd.iiitd.ac.in' },
    update: { name: 'CIPD Admin', password: adminPassword },
    create: {
      name: 'CIPD Admin',
      email: 'admin@cipd.iiitd.ac.in',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`  Admin: ${admin.email} (password: admin123)`)

  const student = await prisma.user.upsert({
    where: { email: 'test@iiitd.ac.in' },
    update: { name: 'Test Student', password: studentPassword },
    create: {
      name: 'Test Student',
      email: 'test@iiitd.ac.in',
      password: studentPassword,
      role: 'STUDENT',
    },
  })
  console.log(`  Student: ${student.email} (password: test123)`)

  // ===== CATEGORIES =====
  // These 9 categories match the tabs in the CIPD Inventory spreadsheet
  const categories = [
    'Basic Electronics',
    'Integrated Circuits',
    'Development Boards',
    'Sensors & Modules',
    'Communication & RF',
    'Power Supply & Batteries',
    'Tools & Equipment',
    'Cables & Connectors',
    'Mechanical/Robotics/Miscellaneous',
  ]

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log(`  Categories: ${categories.length} created`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
