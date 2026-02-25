-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COMPONENT MASTER
CREATE TABLE components (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    part_number TEXT UNIQUE NOT NULL,
    current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
    monthly_required_quantity INTEGER NOT NULL
);

-- PCB MASTER
CREATE TABLE pcbs (
    id SERIAL PRIMARY KEY,
    pcb_name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- BILL OF MATERIALS
CREATE TABLE pcb_components (
    id SERIAL PRIMARY KEY,
    pcb_id INT REFERENCES pcbs(id) ON DELETE CASCADE,
    component_id INT REFERENCES components(id) ON DELETE CASCADE,
    quantity_required INT NOT NULL CHECK (quantity_required > 0)
);

-- PRODUCTION ENTRIES
CREATE TABLE production_entries (
    id SERIAL PRIMARY KEY,
    pcb_id INT REFERENCES pcbs(id),
    quantity_produced INT NOT NULL,
    production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONSUMPTION HISTORY
CREATE TABLE consumption_history (
    id SERIAL PRIMARY KEY,
    component_id INT REFERENCES components(id),
    pcb_id INT REFERENCES pcbs(id),
    quantity_used INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROCUREMENT TRIGGERS
CREATE TABLE procurement_triggers (
    id SERIAL PRIMARY KEY,
    component_id INT REFERENCES components(id),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'OPEN'
);
