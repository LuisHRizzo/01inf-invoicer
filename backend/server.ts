import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';
import { Invoice, InvoiceItem } from '../types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const SERVICE_CATEGORIES = ['service', 'product'] as const;
type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

// --- UTILS ---
const snakeToCamel = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(snakeToCamel);
    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        acc[camelKey] = snakeToCamel(obj[key]);
        return acc;
    }, {} as any);
};


app.use(cors());
app.use(express.json());

// --- ROUTES ---

// GET All initial data
app.get('/api/data', async (req, res) => {
    try {
        const [invoicesRes, customersRes, servicesRes, itemsRes] = await Promise.all([
            pool.query('SELECT * FROM invoices ORDER BY date DESC'),
            pool.query('SELECT * FROM customers ORDER BY name ASC'),
            pool.query('SELECT * FROM services ORDER BY description ASC'),
            pool.query('SELECT * FROM invoice_items')
        ]);

        const invoicesWithItems = invoicesRes.rows.map(invoice => ({
            ...invoice,
            items: itemsRes.rows.filter(item => item.invoice_id === invoice.id)
        }));

        res.json({
            invoices: snakeToCamel(invoicesWithItems),
            customers: snakeToCamel(customersRes.rows),
            services: snakeToCamel(servicesRes.rows)
        });

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// POST a new customer
app.post('/api/customers', async (req, res) => {
    try {
        const { name, address, email, taxId } = req.body;
        const newCustomer = await pool.query(
            "INSERT INTO customers (name, address, email, tax_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, address, email, taxId]
        );
        res.status(201).json(snakeToCamel(newCustomer.rows[0]));
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST a new service/product
app.post('/api/services', async (req, res) => {
    try {
        const { description, price, category } = req.body as { description?: string; price?: number | string; category?: string };

        const trimmedDescription = description?.trim();
        const parsedPrice = typeof price === 'string' ? parseFloat(price) : price;
        const requestedCategory = typeof category === 'string' ? category.toLowerCase() : 'service';
        const normalizedCategory: ServiceCategory = SERVICE_CATEGORIES.includes(requestedCategory as ServiceCategory)
            ? (requestedCategory as ServiceCategory)
            : 'service';

        if (!trimmedDescription) {
            return res.status(400).json({ error: 'La descripción es obligatoria.' });
        }

        if (parsedPrice === undefined || Number.isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'El precio debe ser un número mayor o igual a 0.' });
        }

        const insertResult = await pool.query(
            `INSERT INTO services (description, price, category)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [trimmedDescription, parsedPrice, normalizedCategory]
        );

        const savedService = snakeToCamel(insertResult.rows[0]);
        savedService.price = Number(savedService.price);

        res.status(201).json(savedService);
    } catch (err) {
        if ((err as any)?.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un servicio o producto con esa descripción.' });
        }
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST a new invoice
app.post('/api/invoices', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { invoiceNumber, customerId, date, dueDate, notes, taxRate, status, subtotal, tax, total, items } = req.body as Invoice;
        
        const invoiceQuery = `
            INSERT INTO invoices (invoice_number, customer_id, date, due_date, notes, tax_rate, status, subtotal, tax, total) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
        const invoiceValues = [invoiceNumber, customerId, date, dueDate, notes, taxRate, status, subtotal, tax, total];
        const newInvoiceRes = await client.query(invoiceQuery, invoiceValues);
        const newInvoice = newInvoiceRes.rows[0];

        const itemPromises = items.map(item => {
            const itemQuery = `
                INSERT INTO invoice_items (invoice_id, description, quantity, price) 
                VALUES ($1, $2, $3, $4)`;
            return client.query(itemQuery, [newInvoice.id, item.description, item.quantity, item.price]);
        });
        await Promise.all(itemPromises);

        await client.query('COMMIT');

        const finalInvoice = { ...newInvoice, items: items.map(item => ({...item, invoice_id: newInvoice.id})) };
        res.status(201).json(snakeToCamel(finalInvoice));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// PUT (update) an invoice
app.put('/api/invoices/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { invoiceNumber, customerId, date, dueDate, notes, taxRate, status, subtotal, tax, total, items } = req.body as Invoice;

        const invoiceQuery = `
            UPDATE invoices 
            SET invoice_number = $1, customer_id = $2, date = $3, due_date = $4, notes = $5, tax_rate = $6, status = $7, subtotal = $8, tax = $9, total = $10 
            WHERE id = $11 RETURNING *`;
        const invoiceValues = [invoiceNumber, customerId, date, dueDate, notes, taxRate, status, subtotal, tax, total, id];
        const updatedInvoiceRes = await client.query(invoiceQuery, invoiceValues);
        const updatedInvoice = updatedInvoiceRes.rows[0];
        
        await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

        const itemPromises = items.map(item => {
            const itemQuery = `
                INSERT INTO invoice_items (invoice_id, description, quantity, price) 
                VALUES ($1, $2, $3, $4)`;
            return client.query(itemQuery, [id, item.description, item.quantity, item.price]);
        });
        await Promise.all(itemPromises);

        await client.query('COMMIT');
        
        const finalInvoice = { ...updatedInvoice, items };
        res.status(200).json(snakeToCamel(finalInvoice));

    } catch (err) {
        await client.query('ROLLBACK');
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

// DELETE an invoice
app.delete('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // The ON DELETE CASCADE on the invoice_items table will handle item deletion
        const deleteInvoice = await pool.query("DELETE FROM invoices WHERE id = $1 RETURNING id", [id]);
        if (deleteInvoice.rowCount === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        res.status(200).json({ message: 'Factura eliminada correctamente' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.listen(port, () => {
    console.log(`El servidor backend se está ejecutando en http://localhost:${port}`);
});
