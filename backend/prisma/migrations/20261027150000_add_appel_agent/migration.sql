-- CreateTable
CREATE TABLE "AppelAgent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),

    CONSTRAINT "AppelAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppelAgent_agentId_debut_idx" ON "AppelAgent"("agentId", "debut");

-- AddForeignKey
ALTER TABLE "AppelAgent" ADD CONSTRAINT "AppelAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
