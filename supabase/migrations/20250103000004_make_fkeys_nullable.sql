-- Make foreign key columns nullable to avoid constraint violations
ALTER TABLE invoices ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE content_plans ALTER COLUMN assigned_to DROP NOT NULL;