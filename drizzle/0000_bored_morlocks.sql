CREATE TABLE `fotos` (
	`id` text PRIMARY KEY NOT NULL,
	`momento_id` text NOT NULL,
	`ordem` integer NOT NULL,
	`r2_key` text NOT NULL,
	FOREIGN KEY (`momento_id`) REFERENCES `momentos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `leituras` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`consulente_nome` text NOT NULL,
	`tipo_leitura` text NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`prazo` text,
	`criada_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`publicada_em` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leituras_token_unique` ON `leituras` (`token`);--> statement-breakpoint
CREATE TABLE `momentos` (
	`id` text PRIMARY KEY NOT NULL,
	`leitura_id` text NOT NULL,
	`ordem` integer NOT NULL,
	`titulo` text,
	`audio_key` text,
	`audio_duracao` integer,
	FOREIGN KEY (`leitura_id`) REFERENCES `leituras`(`id`) ON UPDATE no action ON DELETE cascade
);
