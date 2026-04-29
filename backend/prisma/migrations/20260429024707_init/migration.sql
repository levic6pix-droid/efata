/*
  Warnings:

  - You are about to drop the column `email` on the `AdminUser` table. All the data in the column will be lost.
  - Added the required column `username` to the `AdminUser` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Conversa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteNome" TEXT,
    "whatsapp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversaId" INTEGER NOT NULL,
    "corpo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mensagem_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AdminUser" ("ativo", "createdAt", "id", "nome", "passwordHash", "role") SELECT "ativo", "createdAt", "id", "nome", "passwordHash", "role" FROM "AdminUser";
DROP TABLE "AdminUser";
ALTER TABLE "new_AdminUser" RENAME TO "AdminUser";
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
CREATE TABLE "new_Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "total" REAL NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "tipoPedido" TEXT NOT NULL DEFAULT 'DELIVERY',
    "origem" TEXT NOT NULL DEFAULT 'APP',
    "entregadorId" INTEGER,
    "conversaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_entregadorId_fkey" FOREIGN KEY ("entregadorId") REFERENCES "Entregador" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "Conversa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("clienteId", "createdAt", "entregadorId", "formaPagamento", "id", "status", "total") SELECT "clienteId", "createdAt", "entregadorId", "formaPagamento", "id", "status", "total" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Conversa_whatsapp_key" ON "Conversa"("whatsapp");
