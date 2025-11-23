const db = require("./app/models");
const Packet = db.packets;
const Piece = db.pieces;

// Import test data
const testData = require('./test_packet_creation.json');

// Function to create a single packet
async function createPacket(packetData) {
    try {
        console.log(`Creating packet: ${packetData.packetId}...`);

        const packet = await Packet.create({
            packetId: packetData.packetId,
            huGalia: packetData.huGalia,
            location: packetData.location || '354D',
            status: packetData.status || 'Ready for Transfer',
            quantity: packetData.quantity || 0,
            date: packetData.date || new Date()
        });

        // If pieces are provided, create them
        if (packetData.pieces && packetData.pieces.length > 0) {
            const pieces = packetData.pieces.map(p => ({
                ...p,
                packetId: packet.id
            }));

            await Piece.bulkCreate(pieces);
            console.log(`✓ Created packet ${packetData.packetId} with ${pieces.length} pieces`);
        } else {
            console.log(`✓ Created packet ${packetData.packetId}`);
        }

        return packet;
    } catch (error) {
        console.error(`✗ Error creating packet ${packetData.packetId}:`, error.message);
        return null;
    }
}

// Function to create all test packets
async function createAllTestPackets() {
    try {
        console.log('Starting packet creation...\n');

        // Sync database
        await db.sequelize.sync({ force: false });

        // Create all packets from test data
        for (const [key, packetData] of Object.entries(testData)) {
            await createPacket(packetData);
        }

        console.log('\n✓ All test packets created successfully!');

        // Display summary
        const totalPackets = await Packet.count();
        const totalPieces = await Piece.count();
        console.log(`\nSummary:`);
        console.log(`- Total packets in database: ${totalPackets}`);
        console.log(`- Total pieces in database: ${totalPieces}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating test packets:', error);
        process.exit(1);
    }
}

// Function to create a specific packet by key
async function createSpecificPacket(packetKey) {
    try {
        await db.sequelize.sync({ force: false });

        if (!testData[packetKey]) {
            console.error(`Packet key "${packetKey}" not found in test data.`);
            console.log('Available keys:', Object.keys(testData).join(', '));
            process.exit(1);
        }

        await createPacket(testData[packetKey]);
        process.exit(0);
    } catch (error) {
        console.error('Error creating specific packet:', error);
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    // No arguments - create all packets
    createAllTestPackets();
} else if (args[0] === '--list') {
    // List available packet keys
    console.log('Available test packet keys:');
    Object.keys(testData).forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
    });
    process.exit(0);
} else {
    // Create specific packet by key
    createSpecificPacket(args[0]);
}
