-- Add persistent XP and achievement tracking for the gamification MVP.
ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAchievement_user_id_code_key" ON "UserAchievement"("user_id", "code");
CREATE INDEX "UserAchievement_user_id_idx" ON "UserAchievement"("user_id");

CREATE UNIQUE INDEX "XpEvent_action_key_key" ON "XpEvent"("action", "key");
CREATE INDEX "XpEvent_user_id_idx" ON "XpEvent"("user_id");

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
