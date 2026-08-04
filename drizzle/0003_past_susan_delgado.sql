CREATE TABLE `audios` (
	`id` text PRIMARY KEY NOT NULL,
	`momento_id` text NOT NULL,
	`ordem` integer NOT NULL,
	`r2_key` text NOT NULL,
	`duracao` integer,
	FOREIGN KEY (`momento_id`) REFERENCES `momentos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `momentos` DROP COLUMN `audio_key`;--> statement-breakpoint
ALTER TABLE `momentos` DROP COLUMN `audio_duracao`;