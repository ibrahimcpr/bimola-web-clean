DELETE FROM "FinanceRecord"
WHERE "source_receipt_no" IS NOT NULL
   OR "created_by" = 'adisyon-pos';
