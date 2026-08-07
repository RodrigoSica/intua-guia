CREATE TABLE `energia_audios` (
	`id` text PRIMARY KEY NOT NULL,
	`energia_id` text NOT NULL,
	`secao_id` text,
	`ordem` integer NOT NULL,
	`r2_key` text NOT NULL,
	FOREIGN KEY (`energia_id`) REFERENCES `energias`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `energia_audios_energia_secao_idx` ON `energia_audios` (`energia_id`,`secao_id`);