const components = [
  { id: 1, name: "Resistor 10k", partNumber: "R-10K-0603", category: "Resistor", stock: 1200, monthlyRequired: 300 },
  { id: 2, name: "Capacitor 10uF", partNumber: "C-10uF-0805", category: "Capacitor", stock: 80, monthlyRequired: 200 },
  { id: 3, name: "MCU ATmega328", partNumber: "U-ATMEGA328", category: "IC", stock: 25, monthlyRequired: 30 },
  { id: 4, name: "LED Green", partNumber: "LED-G-0603", category: "LED", stock: 500, monthlyRequired: 150 },
  { id: 5, name: "Connector 10-pin", partNumber: "J-10P", category: "Connector", stock: 10, monthlyRequired: 40 }
];

const pcbs = [
  { id: 1, name: "Sensor Board", bom: [{ compId: 1, qty: 4 }, { compId: 2, qty: 2 }, { compId: 4, qty: 1 }] },
  { id: 2, name: "Control Board", bom: [{ compId: 1, qty: 10 }, { compId: 3, qty: 1 }, { compId: 5, qty: 2 }] }
];

const alerts = [
  { id: 1, compId: 2, name: "Capacitor 10uF", stock: 80, status: "LOW" },
  { id: 2, compId: 3, name: "MCU ATmega328", stock: 25, status: "CRITICAL" },
  { id: 3, compId: 5, name: "Connector 10-pin", stock: 10, status: "CRITICAL" }
];

const productionHistory = [
  { id: 1, pcbId: 1, quantity: 50, date: "2026-01-15" },
  { id: 2, pcbId: 2, quantity: 10, date: "2026-02-01" }
];

function seedLocal() {
  if (!localStorage.getItem("components")) localStorage.setItem("components", JSON.stringify(components));
  if (!localStorage.getItem("pcbs")) localStorage.setItem("pcbs", JSON.stringify(pcbs));
  if (!localStorage.getItem("alerts")) localStorage.setItem("alerts", JSON.stringify(alerts));
  if (!localStorage.getItem("productionHistory")) localStorage.setItem("productionHistory", JSON.stringify(productionHistory));
}

export { components, pcbs, alerts, productionHistory, seedLocal };
