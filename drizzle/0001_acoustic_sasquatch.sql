PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_leituras` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`consulente_nome` text NOT NULL,
	`consulente_nascimento` text,
	`tipo_leitura` text NOT NULL,
	`perguntas` text,
	`status` text DEFAULT 'preparando' NOT NULL,
	`prazo` text,
	`criada_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`publicada_em` text
);
--> statement-breakpoint
INSERT INTO `__new_leituras`("id", "token", "consulente_nome", "consulente_nascimento", "tipo_leitura", "perguntas", "status", "prazo", "criada_em", "publicada_em") SELECT "id", "token", "consulente_nome", "consulente_nascimento", "tipo_leitura", "perguntas", "status", "prazo", "criada_em", "publicada_em" FROM `leituras`;--> statement-breakpoint
DROP TABLE `leituras`;--> statement-breakpoint
ALTER TABLE `__new_leituras` RENAME TO `leituras`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `leituras_token_unique` ON `leituras` (`token`);