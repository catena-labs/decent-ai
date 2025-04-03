CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generation_id` text NOT NULL,
	`uri` text NOT NULL,
	`prompt` text NOT NULL,
	`model_slug` text NOT NULL,
	`model` text,
	`provider` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_images_user_id` ON `images` (`user_id`);
