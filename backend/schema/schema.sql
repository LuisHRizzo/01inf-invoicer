-- schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE customers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT        NOT NULL,
    address      TEXT,
    email        TEXT        NOT NULL UNIQUE,
    tax_id       TEXT
);

CREATE TABLE services (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description  TEXT           NOT NULL UNIQUE,
    price        NUMERIC(12,2)  NOT NULL CHECK (price >= 0),
    category     TEXT           NOT NULL DEFAULT 'service' CHECK (category IN ('product', 'service'))
);

CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT        NOT NULL UNIQUE,
    customer_id    UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    date           DATE        NOT NULL,
    due_date       DATE,
    notes          TEXT,
    tax_rate       NUMERIC(5,2)  NOT NULL DEFAULT 0,
    status         TEXT          NOT NULL DEFAULT 'Borrador',
    subtotal       NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    tax            NUMERIC(12,2) NOT NULL CHECK (tax >= 0),
    total          NUMERIC(12,2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT        NOT NULL,
    quantity    NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    price       NUMERIC(12,2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
