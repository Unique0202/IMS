/**
 * Item seed script — populates the database with CIPD inventory items.
 *
 * Run with: node prisma/seedItems.js
 *
 * These items come from the CIPD Inventory PDF spreadsheet.
 * Each item is mapped to one of the 9 categories created by seed.js.
 *
 * PREREQUISITES:
 *   Run `node prisma/seed.js` first to create the categories.
 *
 * IDEMPOTENT:
 *   Uses upsert-like logic (find by name+category, create if not exists).
 *   Safe to run multiple times.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * ITEM DATA — from the CIPD Inventory PDF
 *
 * Each entry: [name, quantity, type, categoryName]
 *   type: CONSUMABLE (wires, resistors — not returned)
 *         RETURNABLE (boards, tools — must be returned)
 *         NA (not classified)
 */
const itemData = [
  // ===== Basic Electronics =====
  ['Resistor Kit (assorted)', 500, 'CONSUMABLE', 'Basic Electronics'],
  ['Capacitor Kit (assorted)', 300, 'CONSUMABLE', 'Basic Electronics'],
  ['LED Kit (assorted colors)', 400, 'CONSUMABLE', 'Basic Electronics'],
  ['Breadboard (830 points)', 50, 'RETURNABLE', 'Basic Electronics'],
  ['Breadboard (400 points)', 30, 'RETURNABLE', 'Basic Electronics'],
  ['Jumper Wires (M-M, pack of 40)', 60, 'CONSUMABLE', 'Basic Electronics'],
  ['Jumper Wires (M-F, pack of 40)', 60, 'CONSUMABLE', 'Basic Electronics'],
  ['Jumper Wires (F-F, pack of 40)', 40, 'CONSUMABLE', 'Basic Electronics'],
  ['Push Button Switch', 100, 'CONSUMABLE', 'Basic Electronics'],
  ['Toggle Switch', 50, 'CONSUMABLE', 'Basic Electronics'],
  ['Potentiometer 10K', 40, 'CONSUMABLE', 'Basic Electronics'],
  ['Diode 1N4007', 100, 'CONSUMABLE', 'Basic Electronics'],
  ['Transistor BC547', 80, 'CONSUMABLE', 'Basic Electronics'],
  ['Buzzer (Piezo)', 30, 'CONSUMABLE', 'Basic Electronics'],

  // ===== Integrated Circuits =====
  ['IC 7805 (Voltage Regulator)', 40, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC 7812 (Voltage Regulator)', 20, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC LM317 (Adj. Voltage Regulator)', 15, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC 555 Timer', 50, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC LM358 (Op-Amp)', 30, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC 74LS08 (AND Gate)', 20, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC 74LS32 (OR Gate)', 20, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC 74LS04 (NOT Gate)', 20, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC L293D (Motor Driver)', 25, 'CONSUMABLE', 'Integrated Circuits'],
  ['IC ATmega328P', 10, 'CONSUMABLE', 'Integrated Circuits'],

  // ===== Development Boards =====
  ['Arduino UNO R3', 20, 'RETURNABLE', 'Development Boards'],
  ['Arduino Mega 2560', 8, 'RETURNABLE', 'Development Boards'],
  ['Arduino Nano', 15, 'RETURNABLE', 'Development Boards'],
  ['Raspberry Pi 4 Model B (4GB)', 5, 'RETURNABLE', 'Development Boards'],
  ['Raspberry Pi Pico', 10, 'RETURNABLE', 'Development Boards'],
  ['ESP32 DevKit V1', 15, 'RETURNABLE', 'Development Boards'],
  ['ESP8266 NodeMCU', 12, 'RETURNABLE', 'Development Boards'],
  ['STM32 Blue Pill', 8, 'RETURNABLE', 'Development Boards'],
  ['FPGA Spartan-6 Board', 3, 'RETURNABLE', 'Development Boards'],

  // ===== Sensors & Modules =====
  ['Ultrasonic Sensor HC-SR04', 20, 'RETURNABLE', 'Sensors & Modules'],
  ['IR Sensor Module', 25, 'RETURNABLE', 'Sensors & Modules'],
  ['PIR Motion Sensor', 10, 'RETURNABLE', 'Sensors & Modules'],
  ['DHT11 Temperature & Humidity', 15, 'RETURNABLE', 'Sensors & Modules'],
  ['DHT22 Temperature & Humidity', 8, 'RETURNABLE', 'Sensors & Modules'],
  ['LDR (Light Dependent Resistor)', 30, 'CONSUMABLE', 'Sensors & Modules'],
  ['Soil Moisture Sensor', 10, 'RETURNABLE', 'Sensors & Modules'],
  ['MQ-2 Gas Sensor', 8, 'RETURNABLE', 'Sensors & Modules'],
  ['MPU6050 Gyro + Accelerometer', 10, 'RETURNABLE', 'Sensors & Modules'],
  ['HC-SR501 PIR Module', 10, 'RETURNABLE', 'Sensors & Modules'],
  ['Rain Sensor Module', 5, 'RETURNABLE', 'Sensors & Modules'],
  ['Sound Sensor Module', 8, 'RETURNABLE', 'Sensors & Modules'],

  // ===== Communication & RF =====
  ['Bluetooth Module HC-05', 10, 'RETURNABLE', 'Communication & RF'],
  ['Bluetooth Module HC-06', 8, 'RETURNABLE', 'Communication & RF'],
  ['nRF24L01 Wireless Module', 12, 'RETURNABLE', 'Communication & RF'],
  ['SIM800L GSM Module', 4, 'RETURNABLE', 'Communication & RF'],
  ['RFID Reader RC522', 8, 'RETURNABLE', 'Communication & RF'],
  ['RFID Cards (pack of 5)', 20, 'CONSUMABLE', 'Communication & RF'],
  ['GPS Module NEO-6M', 5, 'RETURNABLE', 'Communication & RF'],
  ['LoRa Module SX1278', 4, 'RETURNABLE', 'Communication & RF'],
  ['Zigbee Module', 3, 'RETURNABLE', 'Communication & RF'],

  // ===== Power Supply & Batteries =====
  ['9V Battery', 30, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['9V Battery Snap Connector', 30, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['18650 Li-ion Battery (3.7V)', 20, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['18650 Battery Holder (single)', 15, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['LiPo Battery 3.7V 1000mAh', 10, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['Bench Power Supply (30V/5A)', 4, 'RETURNABLE', 'Power Supply & Batteries'],
  ['5V 2A USB Power Adapter', 15, 'RETURNABLE', 'Power Supply & Batteries'],
  ['12V 2A DC Adapter', 10, 'RETURNABLE', 'Power Supply & Batteries'],
  ['TP4056 Li-ion Charging Module', 15, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['Buck Converter LM2596', 10, 'CONSUMABLE', 'Power Supply & Batteries'],
  ['Boost Converter XL6009', 8, 'CONSUMABLE', 'Power Supply & Batteries'],

  // ===== Tools & Equipment =====
  ['Digital Multimeter', 10, 'RETURNABLE', 'Tools & Equipment'],
  ['Soldering Iron (40W)', 8, 'RETURNABLE', 'Tools & Equipment'],
  ['Soldering Iron Stand', 8, 'RETURNABLE', 'Tools & Equipment'],
  ['Solder Wire (lead-free, 100g)', 10, 'CONSUMABLE', 'Tools & Equipment'],
  ['Desoldering Pump', 6, 'RETURNABLE', 'Tools & Equipment'],
  ['Wire Stripper', 6, 'RETURNABLE', 'Tools & Equipment'],
  ['Needle Nose Pliers', 6, 'RETURNABLE', 'Tools & Equipment'],
  ['Diagonal Cutter', 6, 'RETURNABLE', 'Tools & Equipment'],
  ['Screwdriver Kit (precision)', 5, 'RETURNABLE', 'Tools & Equipment'],
  ['Hot Glue Gun', 4, 'RETURNABLE', 'Tools & Equipment'],
  ['Glue Sticks (pack of 10)', 20, 'CONSUMABLE', 'Tools & Equipment'],
  ['Oscilloscope (2-channel)', 3, 'RETURNABLE', 'Tools & Equipment'],
  ['Logic Analyzer', 3, 'RETURNABLE', 'Tools & Equipment'],
  ['Heat Shrink Tube Kit', 15, 'CONSUMABLE', 'Tools & Equipment'],

  // ===== Cables & Connectors =====
  ['USB-A to USB-B Cable', 20, 'RETURNABLE', 'Cables & Connectors'],
  ['USB-A to Micro-USB Cable', 25, 'RETURNABLE', 'Cables & Connectors'],
  ['USB-A to USB-C Cable', 15, 'RETURNABLE', 'Cables & Connectors'],
  ['HDMI Cable (1.5m)', 8, 'RETURNABLE', 'Cables & Connectors'],
  ['Ethernet Cable (1m)', 10, 'RETURNABLE', 'Cables & Connectors'],
  ['DC Barrel Jack Connector', 20, 'CONSUMABLE', 'Cables & Connectors'],
  ['Screw Terminal Block (2-pin)', 30, 'CONSUMABLE', 'Cables & Connectors'],
  ['Header Pins (Male, 40-pin strip)', 50, 'CONSUMABLE', 'Cables & Connectors'],
  ['Header Pins (Female, 40-pin strip)', 50, 'CONSUMABLE', 'Cables & Connectors'],
  ['Crocodile Clip Wires (pack of 10)', 10, 'RETURNABLE', 'Cables & Connectors'],

  // ===== Mechanical/Robotics/Miscellaneous =====
  ['DC Motor (3-6V)', 20, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Servo Motor SG90', 15, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Servo Motor MG996R', 8, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Stepper Motor 28BYJ-48', 8, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Stepper Motor Driver ULN2003', 8, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Robot Chassis Kit (2WD)', 5, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Robot Chassis Kit (4WD)', 3, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Relay Module (single channel)', 15, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Relay Module (4 channel)', 8, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['LCD 16x2 Display', 10, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['LCD I2C Adapter', 10, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['OLED Display 0.96" (I2C)', 8, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['7-Segment Display (single)', 15, 'CONSUMABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['4-Digit 7-Segment Display', 8, 'CONSUMABLE', 'Mechanical/Robotics/Miscellaneous'],
  ['Dot Matrix 8x8 LED', 6, 'RETURNABLE', 'Mechanical/Robotics/Miscellaneous'],
]

async function main() {
  console.log('Seeding inventory items...\n')

  // First, fetch all categories to build a name→id map
  const categories = await prisma.category.findMany()
  const categoryMap = {}
  for (const cat of categories) {
    categoryMap[cat.name] = cat.id
  }

  let created = 0
  let skipped = 0

  for (const [name, quantity, type, categoryName] of itemData) {
    const categoryId = categoryMap[categoryName]
    if (!categoryId) {
      console.log(`  SKIP: category "${categoryName}" not found for "${name}"`)
      skipped++
      continue
    }

    // Check if item already exists in this category
    const existing = await prisma.item.findFirst({
      where: { name, categoryId },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.item.create({
      data: {
        name,
        quantity,
        type,
        categoryId,
        status: 'ACTIVE',
        purpose: 'ISSUE',
      },
    })
    created++
  }

  console.log(`  Created: ${created} items`)
  console.log(`  Skipped: ${skipped} items (already existed)`)
  console.log(`  Total in database: ${await prisma.item.count()}`)
  console.log('\nItem seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
