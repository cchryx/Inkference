-- One-off fix: posts/projects/galleries created before privacy existed got
-- NULL instead of an empty list, which hid them from everyone but the owner.
UPDATE "posts"     SET "allowedUserIds" = '{}' WHERE "allowedUserIds" IS NULL;
UPDATE "posts"     SET "hiddenFromUserIds" = '{}' WHERE "hiddenFromUserIds" IS NULL;
UPDATE "projects"  SET "allowedUserIds" = '{}' WHERE "allowedUserIds" IS NULL;
UPDATE "projects"  SET "hiddenFromUserIds" = '{}' WHERE "hiddenFromUserIds" IS NULL;
UPDATE "galleries" SET "allowedUserIds" = '{}' WHERE "allowedUserIds" IS NULL;
UPDATE "galleries" SET "hiddenFromUserIds" = '{}' WHERE "hiddenFromUserIds" IS NULL;
UPDATE "privacy_settings" SET "hiddenFrom" = '{}' WHERE "hiddenFrom" IS NULL;
