-- CreateTable
CREATE TABLE "Notation" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "apprenantId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileName" TEXT,
    "soumisAt" TIMESTAMP(3),
    "gridData" TEXT,
    "note" DOUBLE PRECISION,
    "commentaires" TEXT,
    "scoreOn20" DOUBLE PRECISION,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "Notation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notation_seanceId_apprenantId_competence_key" ON "Notation"("seanceId", "apprenantId", "competence");

-- AddForeignKey
ALTER TABLE "Notation" ADD CONSTRAINT "Notation_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "Seance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notation" ADD CONSTRAINT "Notation_apprenantId_fkey" FOREIGN KEY ("apprenantId") REFERENCES "Apprenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

