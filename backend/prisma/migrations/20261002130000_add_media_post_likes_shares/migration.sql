-- Compteurs publics like/partage sur MediaPost (voir schema.prisma). Pur
-- ajout, non destructif.

-- AlterTable
ALTER TABLE "MediaPost" ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shares" INTEGER NOT NULL DEFAULT 0;
