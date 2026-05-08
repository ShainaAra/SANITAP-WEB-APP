-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2026 at 05:57 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sanitap_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `GetProductList` ()   BEGIN
    SELECT product_code, name, price 
    FROM products 
    ORDER BY product_code;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ProcessPurchase` (IN `rfid` VARCHAR(10), IN `product_letter` CHAR(1))   BEGIN
    DECLARE user_id_val INT;
    DECLARE product_id_val INT;
    DECLARE product_price_val DECIMAL(10,2);
    DECLARE product_name_val VARCHAR(255);
    DECLARE product_count_val INT;
    DECLARE new_count INT;
    DECLARE new_status VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'Transaction failed' AS message;
    END;

    START TRANSACTION;

    SELECT id INTO user_id_val
    FROM users
    WHERE rfidNumber = rfid;

    SELECT id, price, name, product_available
    INTO product_id_val, product_price_val, product_name_val, product_count_val
    FROM products
    WHERE product_code = product_letter
    LIMIT 1;

    IF user_id_val IS NULL OR product_id_val IS NULL THEN
        ROLLBACK;
        SELECT 'ERROR' AS status, 'Invalid RFID or Product' AS message;

    ELSEIF product_count_val <= 0 THEN
        ROLLBACK;
        SELECT 'NO_STOCK' AS status, 'Product is out of stock' AS message;

    ELSE
        SET new_count = product_count_val - 1;

        IF new_count = 0 THEN
            SET new_status = 'NO STOCK';
        ELSEIF new_count <= 4 THEN
            SET new_status = 'LOW STOCK';
        ELSE
            SET new_status = 'IN STOCK';
        END IF;

        UPDATE products
        SET sales = sales + 1,
            revenue = revenue + product_price_val,
            product_available = new_count,
            status = new_status
        WHERE id = product_id_val;

        UPDATE users
        SET totalPayment = totalPayment + product_price_val
        WHERE id = user_id_val;

        INSERT INTO transactions
        (user_id, product_id, rfid_number, product_code, product_name, price)
        VALUES
        (user_id_val, product_id_val, rfid, product_letter, product_name_val, product_price_val);

        COMMIT;

        SELECT 'SUCCESS' AS status,
               product_name_val AS product,
               product_price_val AS amount,
               new_count AS product_available,
               new_status AS product_status;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ValidateRFID` (IN `rfid` VARCHAR(10))   BEGIN
    SELECT id, studentName, totalPayment, 
           CASE 
               WHEN id IS NOT NULL THEN 'VALID'
               ELSE 'INVALID'
           END as status
    FROM users 
    WHERE rfidNumber = rfid;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '$2b$10$P.0sNEpC2YhLRI8oDrIi.uQH0Lc8DWYr7qWzLWsCdZx.Id2EcHGma', '2026-04-06 09:47:43');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(100) DEFAULT 'low_stock',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_code` char(1) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `sales` int(11) NOT NULL,
  `revenue` decimal(10,2) DEFAULT NULL,
  `product_available` int(11) NOT NULL DEFAULT 8,
  `status` varchar(50) NOT NULL,
  `servo_rotation` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `product_code`, `name`, `price`, `sales`, `revenue`, `product_available`, `status`, `servo_rotation`) VALUES
(5, 'A', 'Menstrual Pads', 10.00, 0, 0.00, 8, 'IN STOCK', 0),
(6, 'B', 'Wet Wipes', 16.50, 0, 0.00, 8, 'IN STOCK', 0),
(7, 'C', 'Tissue', 7.50, 0, 0.00, 8, 'IN STOCK', 0),
(8, 'D', 'Soap\r\n', 47.00, 0, 0.00, 8, 'IN STOCK', 0);

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `rfid_number` varchar(10) NOT NULL,
  `product_code` char(1) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `rfidNumber` varchar(10) NOT NULL,
  `studentNumber` varchar(20) NOT NULL,
  `studentName` varchar(255) NOT NULL,
  `course` varchar(10) NOT NULL,
  `totalPayment` decimal(10,2) DEFAULT 0.00,
  `balance_cleared_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rfidNumber` (`rfidNumber`),
  ADD UNIQUE KEY `studentNumber` (`studentNumber`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=458;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
