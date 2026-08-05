CREATE TABLE `clientes` (
	`id` text PRIMARY KEY NOT NULL,
	`leitura_id` text,
	`nome` text NOT NULL,
	`veio_por_onde` text,
	`atendimento` text,
	`valor_consulta` real,
	`status` text DEFAULT 'pendente' NOT NULL,
	`data_nascimento` text,
	`telefone` text,
	`data_agendada` text,
	`quem_indicou` text,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`leitura_id`) REFERENCES `leituras`(`id`) ON UPDATE no action ON DELETE set null
);
