-- Add inventory management fields to laptops table
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS processor VARCHAR(100);
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS ram VARCHAR(50);
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS storage VARCHAR(50);
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS screen VARCHAR(50);
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS original_price REAL;
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS discounted_price REAL;
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE laptops ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update existing records to have valid values
UPDATE laptops SET original_price = price WHERE original_price IS NULL;
UPDATE laptops SET discounted_price = price WHERE discounted_price IS NULL;
UPDATE laptops SET stock_quantity = 0 WHERE stock_quantity IS NULL;
UPDATE laptops SET is_active = TRUE WHERE is_active IS NULL;
UPDATE laptops SET updated_at = NOW() WHERE updated_at IS NULL;

-- Create index for active laptops (frequently queried by students)
CREATE INDEX IF NOT EXISTS laptops_is_active_idx ON laptops(is_active);
CREATE INDEX IF NOT EXISTS laptops_stock_idx ON laptops(stock_quantity);
