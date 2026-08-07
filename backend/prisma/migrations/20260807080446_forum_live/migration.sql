-- CreateTable
CREATE TABLE "ForumLive" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "invite" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3),
    "dureeMinutes" INTEGER NOT NULL DEFAULT 60,
    "dailyRoomName" TEXT,
    "dailyRoomUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumLive_pkey" PRIMARY KEY ("id")
);

