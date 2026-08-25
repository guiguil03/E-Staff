-- CreateTable
CREATE TABLE "Reunion" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "audience" TEXT NOT NULL,
    "participants" TEXT NOT NULL DEFAULT '[]',
    "startAt" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "lieu" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifiee',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);
