CREATE TABLE `energias` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`consulente_nome` text NOT NULL,
	`orientacoes` text,
	`secoes` text,
	`status` text DEFAULT 'preparando' NOT NULL,
	`criada_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`publicada_em` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `energias_token_unique` ON `energias` (`token`);