// Synthetic demo catalog for the QuotePilot prototype.
// All entries are fictional sample data, not real customer or supplier data.
const SAMPLE_CATALOG = [
  { sku: "BRG-6204ZZ", name: "Deep Groove Ball Bearing", spec: "6204ZZ, 20x47x14 mm, shielded", unit: "pcs", price: 95, stock: 480 },
  { sku: "BRG-6205ZZ", name: "Deep Groove Ball Bearing", spec: "6205ZZ, 25x52x15 mm, shielded", unit: "pcs", price: 110, stock: 320 },
  { sku: "BRG-6306-2RS", name: "Deep Groove Ball Bearing", spec: "6306-2RS, 30x72x19 mm, sealed", unit: "pcs", price: 165, stock: 150 },
  { sku: "MTR-1HP-3P", name: "Three-Phase Induction Motor", spec: "1 HP, 415V, 1440 RPM, foot mount, IE2", unit: "nos", price: 6200, stock: 12 },
  { sku: "MTR-2HP-3P", name: "Three-Phase Induction Motor", spec: "2 HP, 415V, 1440 RPM, foot mount, IE2", unit: "nos", price: 8400, stock: 8 },
  { sku: "MTR-5HP-3P", name: "Three-Phase Induction Motor", spec: "5 HP, 415V, 1440 RPM, foot mount, IE2", unit: "nos", price: 15500, stock: 5 },
  { sku: "VBT-A52", name: "V-Belt", spec: "A-section, 52 inch inside length", unit: "pcs", price: 180, stock: 200 },
  { sku: "VBT-B68", name: "V-Belt", spec: "B-section, 68 inch inside length", unit: "pcs", price: 320, stock: 140 },
  { sku: "FST-M8X30-88", name: "Hex Bolt", spec: "M8 x 30 mm, class 8.8, zinc plated", unit: "box of 100", price: 240, stock: 90 },
  { sku: "FST-M10X40-88", name: "Hex Bolt", spec: "M10 x 40 mm, class 8.8, zinc plated", unit: "box of 100", price: 380, stock: 75 },
  { sku: "FST-M12-NYL", name: "Nylock Nut", spec: "M12, zinc plated", unit: "box of 100", price: 210, stock: 110 },
  { sku: "PIP-GI-1IN", name: "GI Pipe", spec: "1 inch NB, class B, 6 m length, IS 1239", unit: "length", price: 1450, stock: 60 },
  { sku: "PIP-GI-2IN", name: "GI Pipe", spec: "2 inch NB, class B, 6 m length, IS 1239", unit: "length", price: 2900, stock: 35 },
  { sku: "CBL-2.5SQ-CU", name: "Copper Flexible Cable", spec: "2.5 sq mm, single core, 90 m coil, FR PVC", unit: "coil", price: 2350, stock: 45 },
  { sku: "CBL-4SQ-CU", name: "Copper Flexible Cable", spec: "4 sq mm, single core, 90 m coil, FR PVC", unit: "coil", price: 3600, stock: 28 },
  { sku: "WLD-E6013-3.15", name: "Welding Electrode", spec: "E6013, 3.15 mm, 20 kg carton", unit: "carton", price: 1980, stock: 40 },
  { sku: "GRW-4IN", name: "Grinding Wheel", spec: "4 inch (100 mm) x 6 mm, A24, pack of 25", unit: "pack", price: 620, stock: 85 },
  { sku: "SFT-HV-90", name: "Safety Helmet", spec: "HDPE, ratchet adjustment, IS 2925", unit: "pcs", price: 145, stock: 260 },
  { sku: "GLV-LEA-14", name: "Leather Safety Gloves", spec: "14 inch, split leather, heat resistant", unit: "pair", price: 95, stock: 300 },
  { sku: "BRG-UCFL205", name: "Flange Bearing Unit", spec: "UCFL205, 25 mm bore, 2-bolt cast housing", unit: "pcs", price: 340, stock: 65 }
];

const SAMPLE_RFQ = `Hi, please quote for the following requirement:
1) Ball bearing 6204ZZ - 50 pcs
2) 2 HP three phase motor, 415V - 2 nos
3) M8 hex bolts 30mm, 8.8 grade - 4 boxes
4) GI pipe 1 inch class B - 20 lengths
5) Welding electrodes 6013 3.15mm - 10 cartons
Also need V-belts B section 68 inch, quantity will confirm tomorrow.
Required delivery by next Friday. Send best prices.`;
