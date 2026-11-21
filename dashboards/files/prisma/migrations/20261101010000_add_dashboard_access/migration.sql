CREATE TABLE `DashboardAccess` (
  `userId` VARCHAR(191) NOT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`userId`),
  CONSTRAINT `DashboardAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DashboardRolePermission` (
  `role` ENUM('user', 'admin') NOT NULL,
  `permission` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`role`, `permission`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `DashboardRolePermission` (`role`, `permission`) VALUES
('user', 'dashboard.read'),
('admin', 'dashboard.read'),
('admin', 'administration.read');
