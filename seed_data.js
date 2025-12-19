const db = require("./app/models");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    // Sync database (create tables if not exists)
    await db.sequelize.sync();
    console.log("Database synced.");

    // --- 1. Users ---
    console.log("\n--- Seeding Users ---");
    const users = [
      { matricule: "ADMIN001", firstName: "Admin", lastName: "User", role: "admin", email: "admin@factory.com", password: "admin_password" },
      { matricule: "SUP001", firstName: "Super", lastName: "Visor", role: "superviseur", email: "supervisor@factory.com", password: "password123" },
      { matricule: "OP001", firstName: "John", lastName: "Operator", role: "operateur", email: "operator@factory.com", password: "password123" }
    ];

    for (const u of users) {
      const existing = await db.user.findOne({ where: { matricule: u.matricule } });
      if (!existing) {
        u.password = bcrypt.hashSync(u.password, 8);
        await db.user.create(u);
        console.log(`+ User ${u.matricule} created.`);
      } else {
        console.log(`- User ${u.matricule} exists.`);
      }
    }

    const operatorUser = await db.user.findOne({ where: { matricule: "OP001" } });

    // --- 2. Clients ---
    console.log("\n--- Seeding Clients ---");
    const clients = [
      { firstName: "Client", lastName: "One", email: "client1@test.com", phone: "111222333", address: "123 Ind. Zone" },
      { firstName: "Client", lastName: "Two", email: "client2@test.com", phone: "444555666", address: "456 Commerce Park" }
    ];
    for (const c of clients) {
        if(!(await db.client.findOne({where: {email: c.email}}))) {
            await db.client.create(c);
            console.log(`+ Client ${c.lastName} created.`);
        }
    }

    // --- 3. Materials ---
    console.log("\n--- Seeding Materials ---");
    const materials = [
      { material: "MAT-A", materialDescription: "Plastic Granules A", storageUn: "Kg", availStock: 500.000 },
      { material: "MAT-B", materialDescription: "Metal Sheet B", storageUn: "Pcs", availStock: 120.000 }
    ];
     for (const m of materials) {
        if(!(await db.material.findOne({where: {material: m.material}}))) {
            await db.material.create(m);
            console.log(`+ Material ${m.material} created.`);
        }
    }

    // --- 4. Parts ---
    console.log("\n--- Seeding Parts ---");
    const parts = [
      { learPN: "LEAR-1001", tescaPN: "TESCA-5001", desc: "Armrest Cover Left", qtyPerBox: 20 },
      { learPN: "LEAR-1002", tescaPN: "TESCA-5002", desc: "Armrest Cover Right", qtyPerBox: 20 }
    ];
    for (const p of parts) {
        if(!(await db.part.findOne({where: {learPN: p.learPN}}))) {
            await db.part.create(p);
            console.log(`+ Part ${p.learPN} created.`);
        }
    }

    // --- 5. Tickets ---
    console.log("\n--- Seeding Tickets ---");
    const tickets = [
        { ticketCode: "TCK-001", barcode: "BAR-TCK-001" },
        { ticketCode: "TCK-002", barcode: "BAR-TCK-002" }
    ];
    for (const t of tickets) {
        if(!(await db.ticket.findOne({where: {barcode: t.barcode}}))) {
            await db.ticket.create(t);
            console.log(`+ Ticket ${t.barcode} created.`);
        }
    }

    // --- 6. Ticket Codes ---
    console.log("\n--- Seeding Ticket Codes ---");
    const ticketCodes = [
        { code: "CODE-1", matricule: "OP001", learPN: "LEAR-1001", quantity: 20, hu: "HU-101" },
        { code: "CODE-2", matricule: "OP001", learPN: "LEAR-1002", quantity: 20, hu: "HU-102" }
    ];
    for (const tc of ticketCodes) {
         // Assuming 'code' is not unique in model def, but we check to avoid duplicates for seeding
         const exists = await db.ticketCode.findOne({where: {code: tc.code, hu: tc.hu}});
         if(!exists) {
             await db.ticketCode.create(tc);
             console.log(`+ TicketCode ${tc.code} created.`);
         }
    }

    // --- 7. Packets & Pieces ---
    console.log("\n--- Seeding Packets & Pieces ---");
    const packets = [
        { 
            packetId: "PKT-001", huGalia: "GALIA-001", location: "354D", status: "Ready for Transfer", quantity: 2, 
            pieces: [ { barcode: "PIECE-001-A", status: "OK" }, { barcode: "PIECE-001-B", status: "OK" } ]
        },
        { 
            packetId: "PKT-002", huGalia: "GALIA-002", location: "Stock 354D", status: "In Stock", quantity: 1, 
            pieces: [ { barcode: "PIECE-002-A", status: "OK" } ]
        }
    ];

    for (const pkt of packets) {
        const existingPkt = await db.packets.findOne({where: {packetId: pkt.packetId}});
        if(!existingPkt) {
            const createdPkt = await db.packets.create({
                packetId: pkt.packetId, huGalia: pkt.huGalia, location: pkt.location, status: pkt.status, quantity: pkt.quantity, date: new Date()
            });
            
            const pieces = pkt.pieces.map(p => ({ ...p, packetId: createdPkt.id }));
            await db.pieces.bulkCreate(pieces);
            console.log(`+ Packet ${pkt.packetId} created with ${pieces.length} pieces.`);
        } else {
             console.log(`- Packet ${pkt.packetId} exists.`);
        }
    }

    // --- 8. Retouching ---
    console.log("\n--- Seeding Retouching ---");
    const retouchings = [
        { refLear: "LEAR-1001", refTesca: "TESCA-5001", huGalia: "GALIA-BAD-1", quantity: 5, codeProblem: "SCRATCH", status: "Non Réceptionne" }
    ];
    for(const r of retouchings) {
        // No unique constraint checking here easily, just insert if empty or simplistic check
        const count = await db.retouching.count();
        if(count < 2) {
            await db.retouching.create(r);
            console.log(`+ Retouching record created.`);
        }
    }

    // --- 9. Quality Inspection ---
    console.log("\n--- Seeding Quality Inspection ---");
    const inspections = [
        { huGalia: "GALIA-001", quantity: 20, operator: "Admin", status: "Passed", uniquePieceCode: "UPC-001" },
        { huGalia: "GALIA-002", quantity: 20, operator: "Admin", status: "Failed", problemCode: "WRONG_COLOR" }
    ];
     for(const i of inspections) {
        const count = await db.qualityInspection.count();
        if(count < 2) {
             await db.qualityInspection.create(i);
             console.log(`+ Inspection record created.`);
        }
    }

    // --- 10. History ---
    console.log("\n--- Seeding History ---");
    if(operatorUser) {
        const hists = [
            { action: "CREATE", entity: "Packet", entityId: "PKT-001", userId: operatorUser.id, details: "Created packet during seed" }
        ];
        for(const h of hists) {
             const count = await db.history.count();
            if(count < 5) {
                await db.history.create(h);
                console.log(`+ History record created.`);
            }
        }
    }

    // --- 11. Logs ---
    console.log("\n--- Seeding Logs ---");
    if(operatorUser) {
        const logs = [
            { matricule: "OP001", model: "Packet", action: "Create", previousData: null, currentData: {id: "PKT-001"} }
        ];
        for(const l of logs) {
             const count = await db.log.count();
             if(count < 5) {
                 await db.log.create(l);
                 console.log(`+ Log record created.`);
             }
        }
    }

    console.log("\n--- All dummy data seeded successfully! ---");
    process.exit(0);

  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seed();
