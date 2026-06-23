ALTER TABLE `contact_attempts` ADD `new_mileage` integer;--> statement-breakpoint
ALTER TABLE `service_records` ADD `service_description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `service_records` ADD `current_mileage_date` integer;
