/*
  Warnings:

  - You are about to drop the column `locationUpdatedAt` on the `delivery` table. All the data in the column will be lost.
  - You are about to drop the column `riderLatitude` on the `delivery` table. All the data in the column will be lost.
  - You are about to drop the column `riderLongitude` on the `delivery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `delivery` DROP COLUMN `locationUpdatedAt`,
    DROP COLUMN `riderLatitude`,
    DROP COLUMN `riderLongitude`;
