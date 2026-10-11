ALTER TABLE "FinanceRecord" ADD COLUMN "source_receipt_no" TEXT;

CREATE UNIQUE INDEX "FinanceRecord_source_receipt_no_key" ON "FinanceRecord"("source_receipt_no");

CREATE TABLE "pos_receipts" (
    "id" TEXT NOT NULL,
    "receipt_no" TEXT NOT NULL,
    "receipt_date" TIMESTAMP(3) NOT NULL,
    "table_name" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "receipt_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pos_receipt_items" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_receipt_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pos_receipts_receipt_no_key" ON "pos_receipts"("receipt_no");
CREATE INDEX "pos_receipts_receipt_date_idx" ON "pos_receipts"("receipt_date");
CREATE INDEX "pos_receipt_items_receipt_id_idx" ON "pos_receipt_items"("receipt_id");
CREATE INDEX "pos_receipt_items_product_id_idx" ON "pos_receipt_items"("product_id");

ALTER TABLE "pos_receipt_items"
ADD CONSTRAINT "pos_receipt_items_receipt_id_fkey"
FOREIGN KEY ("receipt_id") REFERENCES "pos_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;