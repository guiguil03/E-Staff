-- CreateTable
CREATE TABLE "EntrepriseFormation" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "effectif" TEXT NOT NULL,
    "motif" TEXT NOT NULL,
    "message" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseFormation_pkey" PRIMARY KEY ("id")
);

