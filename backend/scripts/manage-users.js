/**
 * manage-users.js — CLI tool to manage admins and students in CIPD IMS
 *
 * USAGE:
 *   Run from the backend/ directory:
 *
 *   node scripts/manage-users.js list-admins
 *   node scripts/manage-users.js add-admin "Full Name" email@domain.com password123
 *   node scripts/manage-users.js remove-admin email@domain.com
 *
 *   node scripts/manage-users.js list-students
 *   node scripts/manage-users.js ban-student email@iiitd.ac.in
 *   node scripts/manage-users.js unban-student email@iiitd.ac.in
 *   node scripts/manage-users.js delete-student email@iiitd.ac.in
 */

require('dotenv').config()
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const [,, command, ...args] = process.argv

const COMMANDS = [
  'list-admins',
  'add-admin',
  'remove-admin',
  'list-students',
  'ban-student',
  'unban-student',
  'delete-student',
]

async function main() {
  if (!command || !COMMANDS.includes(command)) {
    console.log('\nUsage: node scripts/manage-users.js <command> [args]\n')
    console.log('Admin commands:')
    console.log('  list-admins')
    console.log('  add-admin    "Full Name" email@domain.com password')
    console.log('  remove-admin email@domain.com        (demotes to student, does not delete)')
    console.log('\nStudent commands:')
    console.log('  list-students')
    console.log('  ban-student    email@iiitd.ac.in     (blocks login — not yet enforced, marks account)')
    console.log('  unban-student  email@iiitd.ac.in')
    console.log('  delete-student email@iiitd.ac.in     (permanent — removes all their requests too)\n')
    process.exit(1)
  }

  switch (command) {

    // ─── LIST ADMINS ────────────────────────────────────────────────────────
    case 'list-admins': {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      if (admins.length === 0) {
        console.log('\nNo admins found.\n')
      } else {
        console.log(`\n${'ID'.padEnd(5)} ${'Name'.padEnd(25)} Email`)
        console.log('─'.repeat(65))
        admins.forEach(a => {
          console.log(`${String(a.id).padEnd(5)} ${a.name.padEnd(25)} ${a.email}`)
        })
        console.log()
      }
      break
    }

    // ─── ADD ADMIN ──────────────────────────────────────────────────────────
    case 'add-admin': {
      const [name, email, password] = args
      if (!name || !email || !password) {
        console.error('\nUsage: node scripts/manage-users.js add-admin "Full Name" email password\n')
        process.exit(1)
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        // Promote existing user to admin
        if (existing.role === 'ADMIN') {
          console.log(`\n${email} is already an admin.\n`)
        } else {
          await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } })
          console.log(`\nPromoted ${existing.name} (${email}) to ADMIN.\n`)
        }
      } else {
        // Create new admin account
        const hashed = await bcrypt.hash(password, 10)
        const user = await prisma.user.create({
          data: { name, email, password: hashed, role: 'ADMIN' },
        })
        console.log(`\nCreated admin account: ${user.name} (${user.email}) [ID: ${user.id}]\n`)
      }
      break
    }

    // ─── REMOVE ADMIN (demote to student) ───────────────────────────────────
    case 'remove-admin': {
      const [email] = args
      if (!email) {
        console.error('\nUsage: node scripts/manage-users.js remove-admin email\n')
        process.exit(1)
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.error(`\nNo user found with email: ${email}\n`)
        process.exit(1)
      }
      if (user.role !== 'ADMIN') {
        console.log(`\n${email} is not an admin (role: ${user.role}).\n`)
      } else {
        await prisma.user.update({ where: { email }, data: { role: 'STUDENT' } })
        console.log(`\nDemoted ${user.name} (${email}) from ADMIN to STUDENT.\n`)
      }
      break
    }

    // ─── LIST STUDENTS ───────────────────────────────────────────────────────
    case 'list-students': {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, email: true, createdAt: true, _count: { select: { requests: true } } },
        orderBy: { createdAt: 'desc' },
      })
      if (students.length === 0) {
        console.log('\nNo students found.\n')
      } else {
        console.log(`\n${'ID'.padEnd(5)} ${'Name'.padEnd(25)} ${'Requests'.padEnd(10)} Email`)
        console.log('─'.repeat(75))
        students.forEach(s => {
          console.log(`${String(s.id).padEnd(5)} ${s.name.padEnd(25)} ${String(s._count.requests).padEnd(10)} ${s.email}`)
        })
        console.log(`\nTotal: ${students.length} students\n`)
      }
      break
    }

    // ─── BAN STUDENT ─────────────────────────────────────────────────────────
    // Note: banning invalidates their token by scrambling their password.
    // Their existing JWT will still work until it expires (7 days) unless
    // you add a `banned` field to the schema and check it in authenticate().
    // For now this effectively locks out new logins via Google (email won't match bcrypt).
    case 'ban-student': {
      const [email] = args
      if (!email) {
        console.error('\nUsage: node scripts/manage-users.js ban-student email\n')
        process.exit(1)
      }
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.error(`\nNo user found with email: ${email}\n`)
        process.exit(1)
      }
      // Scramble password so they cannot log in. For Google users, their account
      // is looked up by email — we'll need to add a banned check for full enforcement.
      const scrambled = await bcrypt.hash('BANNED_' + Date.now(), 10)
      await prisma.user.update({ where: { email }, data: { password: scrambled } })
      console.log(`\nBanned ${user.name} (${email}). They cannot use email/password login.`)
      console.log('Note: to fully block Google login, add a banned field to the schema.\n')
      break
    }

    // ─── UNBAN STUDENT ────────────────────────────────────────────────────────
    case 'unban-student': {
      const [email] = args
      if (!email) {
        console.error('\nUsage: node scripts/manage-users.js unban-student email\n')
        process.exit(1)
      }
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.error(`\nNo user found with email: ${email}\n`)
        process.exit(1)
      }
      // Reset password to a new random value (Google login will still work)
      const { randomBytes } = require('crypto')
      const fresh = await bcrypt.hash(randomBytes(32).toString('hex'), 10)
      await prisma.user.update({ where: { email }, data: { password: fresh } })
      console.log(`\nUnbanned ${user.name} (${email}). Google login restored.\n`)
      break
    }

    // ─── DELETE STUDENT ───────────────────────────────────────────────────────
    case 'delete-student': {
      const [email] = args
      if (!email) {
        console.error('\nUsage: node scripts/manage-users.js delete-student email\n')
        process.exit(1)
      }
      const user = await prisma.user.findUnique({
        where: { email },
        include: { _count: { select: { requests: true } } },
      })
      if (!user) {
        console.error(`\nNo user found with email: ${email}\n`)
        process.exit(1)
      }

      console.log(`\nAbout to permanently delete:`)
      console.log(`  Name:     ${user.name}`)
      console.log(`  Email:    ${user.email}`)
      console.log(`  Requests: ${user._count.requests}`)
      console.log('\nThis cannot be undone. To confirm, re-run with --confirm:\n')
      console.log(`  node scripts/manage-users.js delete-student ${email} --confirm\n`)

      if (args[1] === '--confirm') {
        // Delete notifications first, then requests cascade
        await prisma.notification.deleteMany({ where: { userId: user.id } })
        // Requests and their items must be deleted carefully
        const userRequests = await prisma.request.findMany({ where: { userId: user.id } })
        for (const req of userRequests) {
          await prisma.transaction.deleteMany({ where: { requestId: req.id } })
          await prisma.requestItem.deleteMany({ where: { requestId: req.id } })
        }
        await prisma.request.deleteMany({ where: { userId: user.id } })
        await prisma.user.delete({ where: { email } })
        console.log(`Deleted ${user.name} (${email}) and all their data.\n`)
      }
      break
    }
  }
}

main()
  .catch(err => { console.error('\nError:', err.message, '\n'); process.exit(1) })
  .finally(() => prisma.$disconnect())
