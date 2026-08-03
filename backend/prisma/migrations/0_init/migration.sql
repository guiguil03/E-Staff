-- CreateTable
CREATE TABLE "EntrepriseProjet" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "needsDetails" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseProjet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connecteur" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "clientCount" TEXT NOT NULL,
    "soughtRoles" TEXT NOT NULL,
    "cvVolume" TEXT NOT NULL,
    "budgetPerAgent" TEXT NOT NULL,
    "presentationMode" TEXT NOT NULL,
    "paymentChannel" TEXT NOT NULL,
    "opportunityTiming" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'nouveau',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connecteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidat" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationAttempt" (
    "id" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'en_cours',
    "lexiqueAnswers" TEXT,
    "oralAnswers" TEXT,
    "lexiqueScore" DOUBLE PRECISION,
    "oralScore" DOUBLE PRECISION,
    "situationsScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "tier" TEXT,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "resultEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SituationResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "situationIndex" INTEGER NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "gradedCriteria" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SituationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SituationResponse_attemptId_situationIndex_key" ON "SituationResponse"("attemptId", "situationIndex");

-- AddForeignKey
ALTER TABLE "EvaluationAttempt" ADD CONSTRAINT "EvaluationAttempt_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "Candidat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SituationResponse" ADD CONSTRAINT "SituationResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "EvaluationAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

