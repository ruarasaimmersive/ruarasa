import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { v4 as uuidv4 } from 'uuid'
import { DEFAULT_PRODUCTS } from './products'

// RxDB Plugins
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema'

addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBMigrationPlugin)

if (import.meta.env.DEV) {
  await import('rxdb/plugins/dev-mode').then((module) =>
    addRxPlugin(module.RxDBDevModePlugin),
  )
}

// Schema definition
export const salesSchema = {
  version: 1, // Bump to version 1 to add variant
  primaryKey: 'transaction_id',
  type: 'object',
  properties: {
    transaction_id: {
      type: 'string',
      maxLength: 100,
    },
    tanggal: {
      type: 'string',
      format: 'date-time',
    },
    nama_barang: {
      type: 'string',
    },
    qty: {
      type: 'number',
      minimum: 0,
    },
    harga_satuan: {
      type: 'number',
      minimum: 0,
    },
    total_harga: {
      type: 'number',
    },
    metode_pembayaran: {
      type: 'string', // 'CASH' | 'QRIS'
    },
    nomor_hp: {
      type: 'string',
    },
    customer_name: {
      type: 'string',
    },
    kasir: {
      type: 'string',
    },
    order_id: {
      type: 'number',
      minimum: 0,
    },
    is_synced: {
      type: 'boolean',
    },
    is_deleted: {
      type: 'boolean',
    },
    // New Fields for Multi-Role & Features
    source: {
      type: 'string', // 'UMUM'
    },
    type: {
      type: 'string', // 'IN' | 'OUT'
    },

    notes: {
      type: 'string',
    },
    variant: {
      type: 'string',
    },
    display_total: {
      type: 'number',
    },
    booking_id: {
      type: 'number',
    },
  },
  required: [
    'transaction_id',
    'order_id',
    'tanggal',
    'nama_barang',
    'qty',
    'total_harga',
  ],
}

// Product Schema
export const productsSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    name: {
      type: 'string',
    },
    price: {
      type: 'number',
      minimum: 0,
    },
    emoji: {
      type: 'string',
    },
    color: {
      type: 'string',
    },
    shadow: {
      type: 'string',
    },
  },
  required: ['id', 'name', 'price', 'emoji', 'color'],
}

// Singleton database promise
let dbPromise: Promise<any> | null = null

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase({
        name: 'ruarasa_db_v102', // Keep same name to preserve data
        storage: wrappedValidateAjvStorage({
          storage: getRxStorageDexie(),
        }),
      })

      const collectionsToAdd: any = {}
      const collections = {
        sales: {
          schema: salesSchema,
          migrationStrategies: {
            1: function (oldDoc: any) {
              // Migrate old data to include the new 'variant' column natively
              const nameLower = oldDoc.nama_barang?.toLowerCase() || '';
              const isImmersive = nameLower.includes('immersive') || nameLower.includes('tiket') || false;
              const isPelajar = isImmersive && oldDoc.notes === 'PELAJAR';
              const isOuting = !isPelajar && ((isImmersive && oldDoc.harga_satuan < 50000) || (oldDoc.notes && (oldDoc.notes.includes('OUTING') || oldDoc.notes.includes('[VARIANT:PAKETAN]'))));
              
              let variant = '-';
              if (oldDoc.type !== 'OUT') {
                if (isImmersive) {
                  if (isPelajar) variant = 'PELAJAR';
                  else if (isOuting) variant = 'OUTING';
                  else variant = 'REGULER';
                } else {
                  variant = 'EVENT';
                }
              }
              oldDoc.variant = variant;
              return oldDoc;
            }
          }
        },
        products: {
          schema: productsSchema,
        },
      }

      // Only prepare to add collections that don't exist yet
      for (const [key, value] of Object.entries(collections)) {
        if (!db.collections[key]) {
          collectionsToAdd[key] = value
        }
      }

      if (Object.keys(collectionsToAdd).length > 0) {
        try {
          await db.addCollections(collectionsToAdd)
        } catch (err: any) {
          // Ignore error if collection already exists (race condition or HMR)
          if (!err.message.includes('already exists')) {
            throw err
          }
        }
      }

      // Seed products if empty, or update if names/prices changed
      const currentProducts = await db.products.find().exec()
      if (currentProducts.length === 0) {
        await Promise.all(DEFAULT_PRODUCTS.map((p) => db.products.insert(p)))
      } else {
        const currentProductsMap = new Map(
          currentProducts.map((p) => [p.primary || p.get('id'), p])
        )
        const defaultIds = new Set(DEFAULT_PRODUCTS.map((p) => p.id))
        const operations: Promise<any>[] = []

        // Check for updates to default products (name or price) or add new ones
        for (const defP of DEFAULT_PRODUCTS) {
          const existing = currentProductsMap.get(defP.id)
          if (existing) {
            if (existing.name !== defP.name || existing.price !== defP.price) {
              operations.push(existing.patch({ name: defP.name, price: defP.price }))
            }
          } else {
            // Insert the product if it doesn't exist yet
            operations.push(db.products.insert(defP))
          }
        }

        // Delete products that are no longer in DEFAULT_PRODUCTS (e.g. Sekar Geni)
        for (const [prodId, existingProduct] of currentProductsMap.entries()) {
          if (!defaultIds.has(prodId)) {
            operations.push(existingProduct.remove())
          }
        }

        if (operations.length > 0) {
          await Promise.all(operations)
        }
      }

      return db
    })()
  }
  return dbPromise
}

// Helper types
export type SaleDoc = {
  transaction_id: string
  order_id: number
  tanggal: string
  nama_barang: string
  qty: number
  harga_satuan: number
  total_harga: number
  metode_pembayaran?: string
  nomor_hp?: string
  customer_name?: string
  kasir?: string
  is_synced?: boolean
  is_deleted?: boolean
  // New Fields
  source?: 'UMUM' | string
  type?: 'IN' | 'OUT' | string

  notes?: string
  variant?: string
  display_total?: number
  booking_id?: number
}

export type ProductDoc = {
  id: string
  name: string
  price: number
  emoji: string
  color: string
  shadow: string
}

// Helper function to insert data
export const addSale = async (
  data: Omit<SaleDoc, 'transaction_id' | 'order_id'>,
) => {
  const db = await initDB()

  const source = 'UMUM'
  const storageKey = 'last_order_id'

  // Get last order_id from DB
  const lastSale = await db.sales
    .find()
    .sort({ order_id: 'desc' })
    .limit(1)
    .exec()

  let nextId = 0

  // UMUM Logic:
  // Prioritize DB sequence to handle deletions correctly.
  // Use LocalStorage/Server Sync ONLY if DB is empty.
  const lastDBId = lastSale.length > 0 ? lastSale[0].order_id : 0
  const storedLastId = parseInt(localStorage.getItem(storageKey) || '0')

  if (lastDBId > 0) {
    nextId = lastDBId + 1
  } else {
    // Fallback if DB is empty (e.g. first run or cleared cache)
    // Use storedLastId which might come from 'getLastID' server sync
    nextId = storedLastId + 1
  }

  // Persist the new high score
  localStorage.setItem(storageKey, nextId.toString())

  return db.sales.insert({
    transaction_id: uuidv4(),
    order_id: nextId,
    source, // Ensure source is saved
    type: data.type || 'IN', // Default to IN
    ...data,
  })
}

// Helper to get collection
export const getSalesCollection = async () => {
  const db = await initDB()
  return db.sales
}

export const getProducts = async () => {
  const db = await initDB()
  return db.products.find().exec()
}
