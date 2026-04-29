-- CreateTable
CREATE TABLE "Entregador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "documento" TEXT,
    "tipoVeiculo" TEXT NOT NULL DEFAULT 'Moto',
    "placa" TEXT,
    "modelo" TEXT,
    "areaAtuacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "disponibilidade" TEXT NOT NULL DEFAULT 'Disponível',
    "turno" TEXT NOT NULL DEFAULT 'Livre',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
