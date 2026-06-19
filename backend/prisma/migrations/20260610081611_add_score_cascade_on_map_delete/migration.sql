-- DropForeignKey
ALTER TABLE "Map" DROP CONSTRAINT "Map_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_map_id_fkey";

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "Map"("id") ON DELETE CASCADE ON UPDATE CASCADE;
