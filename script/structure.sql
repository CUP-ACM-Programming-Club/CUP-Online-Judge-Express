-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- ------------------------------------------------------
-- Server version	8.0.13

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acm_member`
--
CREATE DATABASE IF NOT EXISTS `jol`;

USE `jol`;

DROP TABLE IF EXISTS `acm_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `acm_member` (
  `user_id` varchar(48) NOT NULL,
  `level` tinyint(4) NOT NULL DEFAULT '0',
  KEY `acm_member_user_id_index` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `article`
--

DROP TABLE IF EXISTS `article`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `article` (
  `user_id` int(11) NOT NULL,
  `article_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `defunct` varchar(2) NOT NULL DEFAULT 'N',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `edit_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `content` text,
  `last_post` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`article_id`),
  KEY `article_user_id_index` (`user_id`),
  KEY `article_create_time_index` (`create_time`),
  KEY `article_edit_time_index` (`edit_time`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `article_content`
--

DROP TABLE IF EXISTS `article_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `article_content` (
  `user_id` varchar(35) NOT NULL,
  `content` text,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `edit_time` datetime DEFAULT NULL,
  `article_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`comment_id`),
  KEY `article_content_user_id_index` (`user_id`),
  KEY `article_content_create_time_index` (`create_time`),
  KEY `earticle_content__index` (`edit_time`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `update_article_edit_time_insert` BEFORE INSERT ON `article_content` FOR EACH ROW BEGIN
    update article set last_post =NOW() where article.article_id = NEW.article_id;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `update_article_edit_time` BEFORE UPDATE ON `article_content` FOR EACH ROW BEGIN
    update article set last_post = NOW() where article.article_id = NEW.article_id;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `award`
--

DROP TABLE IF EXISTS `award`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `award` (
  `user_id` varchar(48) NOT NULL,
  `award` varchar(48) NOT NULL,
  `year` int(11) NOT NULL,
  KEY `award_user_id_index` (`user_id`),
  KEY `award_year_index` (`year`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ban_user`
--

DROP TABLE IF EXISTS `ban_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ban_user` (
  `user_id` varchar(40) NOT NULL,
  `bantime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `club_register`
--

DROP TABLE IF EXISTS `club_register`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `club_register` (
  `user_id` varchar(48) NOT NULL,
  `name` varchar(48) NOT NULL,
  `sex` tinyint(4) NOT NULL DEFAULT '0',
  `class` varchar(48) NOT NULL,
  `mobile_phone` varchar(48) NOT NULL,
  `qq` varchar(48) NOT NULL,
  `wechat` varchar(48) NOT NULL,
  `email` char(48) NOT NULL,
  `club` tinyint(4) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compileinfo`
--

DROP TABLE IF EXISTS `compileinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compileinfo` (
  `solution_id` int(11) NOT NULL DEFAULT '0',
  `error` text,
  PRIMARY KEY (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest`
--

DROP TABLE IF EXISTS `contest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest` (
  `contest_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `defunct` char(1) NOT NULL DEFAULT 'N',
  `description` text,
  `private` tinyint(4) NOT NULL DEFAULT '0',
  `vjudge` tinyint(4) NOT NULL DEFAULT '0',
  `cmod_visible` tinyint(4) NOT NULL DEFAULT '0',
  `homework` tinyint(4) NOT NULL DEFAULT '0',
  `langmask` int(11) NOT NULL DEFAULT '0' COMMENT 'bits for LANG to mask',
  `password` char(16) NOT NULL DEFAULT '',
  `ip_policy` char(40) DEFAULT NULL,
  `limit_hostname` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`contest_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1147 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_clarification`
--

DROP TABLE IF EXISTS `contest_clarification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_clarification` (
  `contest_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `time` datetime DEFAULT NULL,
  `discuss_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`discuss_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest_problem`
--

DROP TABLE IF EXISTS `contest_problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_problem` (
  `problem_id` int(11) NOT NULL DEFAULT '0',
  `contest_id` int(11) DEFAULT NULL,
  `title` char(200) NOT NULL DEFAULT '',
  `oj_name` char(10) DEFAULT NULL,
  `num` int(11) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contestregister`
--

DROP TABLE IF EXISTS `contestregister`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contestregister` (
  `user_id` varchar(48) NOT NULL DEFAULT '',
  `name` varchar(100) NOT NULL DEFAULT '',
  `department` varchar(100) NOT NULL DEFAULT '',
  `major` varchar(100) NOT NULL DEFAULT '',
  `phonenumber` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(100) DEFAULT NULL,
  `school` varchar(100) NOT NULL DEFAULT '',
  `ip` varchar(20) NOT NULL DEFAULT '',
  `reg_time` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cprogram`
--

DROP TABLE IF EXISTS `cprogram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cprogram` (
  `name` varchar(10) NOT NULL,
  `user_id` varchar(30) NOT NULL,
  `sex` tinyint(4) NOT NULL,
  `scholar` varchar(32) NOT NULL,
  `subject` varchar(32) NOT NULL,
  `teacher` varchar(32) NOT NULL,
  `class` varchar(16) NOT NULL,
  `bornday` varchar(24) NOT NULL,
  `mobile_phone` varchar(15) NOT NULL,
  `qq` varchar(15) NOT NULL,
  `wechat` varchar(48) NOT NULL,
  `email` varchar(48) NOT NULL,
  `group` tinyint(4) NOT NULL,
  `room` int(11) DEFAULT '0',
  `seat` int(11) DEFAULT '0',
  `pass` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `custominput`
--

DROP TABLE IF EXISTS `custominput`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custominput` (
  `solution_id` int(11) NOT NULL DEFAULT '0',
  `input_text` text,
  PRIMARY KEY (`solution_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `global_setting`
--

DROP TABLE IF EXISTS `global_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `global_setting` (
  `label` varchar(24) NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
LOCK TABLES `global_setting` WRITE;
/*!40000 ALTER TABLE `global_setting` DISABLE KEYS */;
INSERT INTO `global_setting` VALUES ('contest','0'),('closed','0'),('email','0'),('view_own_code','1'),('label_color','{\"\\u6b63\\u5219\\u8868\\u8fbe\\u5f0f\":\"olive\",\"\\u6d4b\\u8bd5\":\"purple\",\"test\":\"brown\",\"\\u5206\\u6cbb\":\"purple\",\"\\u6b27\\u62c9\\u56de\\u8def\":\"purple\",\"\\u5206\\u5757\":\"\",\"\\u6570\\u5b66\":\"yellow\",\"\\u7b80\\u5355\\u9898\":\"brown\",\"\\u54c8\\u5e0c\\u8868\":\"pink\",\"\\u7ebf\\u6bb5\\u6811\":\"teal\",\"\\u6df1\\u5ea6\\u4f18\\u5148\\u641c\\u7d22\":\"olive\",\"\\u679a\\u4e3e\":\"purple\",\"\\u961f\\u5217\":\"orange\",\"\\u7f51\\u7edc\\u6d41\":\"pink\",\"\\u7ec4\\u5408\\u6570\\u5b66\":\"pink\",\"\\u9ad8\\u7cbe\\u5ea6\":\"teal\",\"\\u6784\\u9020\":\"green\",\"\\u5e76\\u67e5\\u96c6\":\"green\",\"\\u8d2a\\u5fc3\":\"violet\",\"\\u5e73\\u8861\\u6811\":\"brown\",\"\\u6811\\u5f62\\u89c4\\u5212\":\"pink\",\"\\u6811\\u7ed3\\u6784\":\"purple\",\"\\u53cc\\u6307\\u9488\\u626b\\u63cf\":\"blue\",\"\\u89e3\\u6790\\u51e0\\u4f55\":\"teal\",\"\\u51f8\\u5305\":\"black\",\"\\u5750\\u6807\\u53d8\\u6362\":\"pink\",\"\\u8fde\\u901a\\u6027\":\"red\",\"\\u7fa4\\u8bba\":\"pink\",\"\\u5e7f\\u5ea6\\u4f18\\u5148\\u641c\\u7d22\":\"olive\",\"KMP\\u7b97\\u6cd5\":\"black\",\"\\u535a\\u5f08\\u8bba\":\"orange\",\"\\u72b6\\u6001\\u538b\\u7f29\":\"brown\",\"\\u77e9\\u9635\":\"purple\",\"\\u56fe\\u5339\\u914d\":\"brown\",\"\\u80cc\\u5305\\u95ee\\u9898\":\"pink\",\"\\u4e8c\\u5206\\u67e5\\u627e\":\"orange\",\"\\u5355\\u8c03\\u961f\\u5217\":\"black\",\"\\u5806\":\"grey\",\"\\u53ef\\u6301\\u4e45\\u5316\":\"green\",\"\\u4e09\\u5206\\u67e5\\u627e\":\"\",\"\\u534a\\u5e73\\u9762\\u4ea4\":\"olive\",\"\\u9ad8\\u65af\\u6d88\\u5143\":\"violet\",\"\\u62d3\\u6251\\u6392\\u5e8f\":\"purple\",\"\\u5f52\\u5e76\":\"orange\",\"2-\\u53ef\\u6ee1\\u8db3\\u95ee\\u9898\":\"grey\",\"\\u540e\\u7f00\\u6811\":\"black\",\"\\u8868\\u8fbe\\u5f0f\\u5904\\u7406\":\"brown\",\"\\u6808\":\"olive\",\"\\u751f\\u6210\\u6811\":\"violet\",\"\\u6674\\u5929\\u5c0f\\u732a\\u5386\\u9669\\u8bb0\":\"teal\",\"\\u6e05\\u5e1d\\u4e4b\\u60d1\":\"yellow\",\"NOIP\":\"teal\",\"2005\":\"olive\",\"\\u63d0\\u9ad8\\u7ec4\":\"red\",\"\\u7701\\u9009\":\"violet\",\"2000\":\"pink\",\"\\u4e0a\\u6d77\":\"red\",\"Victoria\\u7684\\u821e\\u4f1a\":\"red\",\"NOI\":\"orange\",\"2003\":\"olive\",\"\\u6d59\\u6c5f\":\"yellow\",\"IOI\":\"olive\",\"1994\":\"red\",\"1999\":\"\",\"CTSC\":\"olive\",\"\\u9001\\u7ed9\\u5723\\u8bde\\u591c\\u7684\\u793c\\u7269\":\"grey\",\"\\u8fce\\u6625\\u821e\\u4f1a\":\"green\",\"2002\":\"blue\",\"WC\":\"olive\",\"\\u666e\\u53ca\\u7ec4\":\"yellow\",\"\\u65b0\\u5e74\\u8da3\\u4e8b\":\"blue\",\"2004\":\"grey\",\"\\u5c0f\\u80d6\\u7cfb\\u5217\":\"black\",\"Sunnypig\\u7684\\u5947\\u5e7b\\u4e4b\\u65c5\":\"purple\",\"\\u6e56\\u5357\":\"pink\",\"2001\":\"grey\",\"\\u91ce\\u732b\\u6c5f\\u7c73\":\"violet\",\"\\u4e09\\u56fd\\u4e89\\u9738\":\"purple\",\"2006\":\"orange\",\"AsukaNoKaze\'s\":\"violet\",\"Retiring\":\"orange\",\"Problems\":\"orange\",\"\\u661f\\u9645\\u9752\\u86d9\":\"teal\",\"\\u56db\\u5ddd\":\"pink\",\"\\u67ef\\u5357\\u4e4bVijos\\u88ab\\u9ed1\\u4e8b\\u4ef6\":\"teal\",\"\\u7ea2\\u8272\\u8b66\\u6212\":\"red\",\"CQF\":\"pink\",\"OIBH\\u676fNOIP2006\\u6a21\\u62df\\u8d5b\":\"pink\",\"\\u5b89\\u5fbd\":\"\",\"Wind~\\u673a\\u5668\\u4eba\\u7cfb\\u5217\":\"olive\",\"\\u5929\\u4f7f\\u7684\\u65bd\\u820d\":\"\",\"@.@\":\"black\",\"\\u4ed9\\u5251\\u7cfb\\u5217\":\"yellow\",\"OIBH\\u676fNOIP2006\\u7b2c\\u4e8c\\u6b21\\u6a21\\u62df\\u8d5b\":\"blue\",\"\\u9ed1\\u76ae\\u7684\\u821e\\u8e48\":\"pink\",\"\\u5e7f\\u4e1c\":\"pink\",\"2007\":\"black\",\"\\u6570\\u72ec\":\"orange\",\"\\u65f6\\u4ee3\\u4e2d\\u5b66\":\"pink\",\"\\u602a\\u76d7\\u57fa\\u5fb7\":\"blue\",\"VS\":\"black\",\"OIBH\":\"violet\",\"Super\":\"violet\",\"pig\\u676fNOIp2008\\u63d0\\u9ad8\\u7ec4\\u6a21\\u62df\\u8d5b\":\"olive\",\"2008\":\"orange\",\"Colorful\":\"olive\",\"Valentine\'s\":\"\",\"Day\":\"black\",\"\\u602a\\u76d7\\u57fa\\u5fb7-\\u5fe7\\u90c1\\u7684\\u751f\\u65e5\":\"pink\",\"\\u4e2d\\u5b66\\u751f\\u8bba\\u575b\":\"red\",\"F1\":\"purple\",\"Orz\\u6559\\u4e3b\":\"grey\",\"\\u5341\\u516b\\u5c45\\u58eb\\u7684\\u767d\\u65e5\\u68a6\":\"yellow\",\"CSCII\":\"brown\",\"CSC\":\"violet\",\"WorkGroup\":\"grey\",\"III\":\"orange\",\"csapc\":\"yellow\",\"\\u91cd\\u6e38SC\":\"teal\",\"theme\":\"purple\",\"Park\":\"pink\",\"1997\":\"pink\",\"\\u7b28\\u7b28\\u5de5\\u4f5c\\u5ba4\\u7cfb\\u5217\":\"orange\",\"zgx\":\"brown\",\"curimit\":\"violet\",\"2009\":\"teal\",\"\\u91cd\\u5e86\":\"pink\",\"\\u5c71\\u4e1c\":\"green\",\"YYHS\\u8bad\\u7ec3\\u9898\":\"grey\",\"\\u6c5f\\u82cf\":\"red\",\"1996\":\"orange\",\"1998\":\"blue\",\"\\u602a\\u76d7\\u57fa\\u5fb7-\\u6708\\u4e0b\\u306e\\u8c1c\":\"pink\",\"HOI\":\"\",\"\\u5de5\\u85e4\\u65b0\\u4e00\\u3078\\u306e\\u6311\\u6230\\u72c0\":\"orange\",\"\\u5929\\u624d\\u7684talent\":\"orange\",\"ORZ5\":\"teal\",\"OrzTky\":\"red\",\"\\u9676\\u9676\":\"\",\"Lwins.\":\"blue\",\"Island_Fantasy.\":\"pink\",\"\\u5fae\\u89c2\\u4e16\\u754c\\u5947\\u9047\\u8bb0\":\"yellow\",\"2011\":\"black\",\"\\u521d\\u97f3\\u672a\\u6765_Miku\":\"\",\"2010\":\"olive\",\"2012\":\"red\",\"YYB\\u7684OI\\u4e4b\\u8def\":\"yellow\",\"2013\":\"orange\",\"NOI2003\":\"purple\",\"2014\":\"teal\",\"\\u5929\\u6d25\":\"blue\",\"COI2008\":\"violet\",\"\\u5317\\u4eac\":\"teal\",\"SPOJ\":\"purple\",\"Disillusioning_1\":\"red\",\"2015\":\"red\",\"\\u56fe\\u7ed3\\u6784\":\"brown\",\"\\u5dee\\u5206\\u7ea6\\u675f\":\"teal\",\"\\u6982\\u7387\\u8bba\":\"purple\",\"\\u5355\\u8c03\\u6027DP\":\"green\",\"Link-Cut-Tree\":\"green\",\"\\u6700\\u8fd1\\u516c\\u5171\\u7956\\u5148\":\"yellow\",\"2016\":\"yellow\",\"2017\":\"pink\",\"2018\":\"pink\",\"APIO\":\"purple\",\"USACO\":\"purple\",\"POI\":\"green\",\"ZJOI\":\"\",\"HNOI\":\"yellow\",\"HAOI\":\"brown\",\"\\u6cb3\\u5357\":\"orange\",\"SCOI\":\"red\",\"JLOI\":\"green\",\"\\u5409\\u6797\":\"orange\",\"CERC\":\"orange\",\"SHOI\":\"olive\",\"SDOI\":\"red\",\"TJOI\":\"violet\",\"CQOI\":\"olive\",\"HEOI\":\"blue\",\"\\u6cb3\\u5317\":\"brown\",\"Baltic\":\"teal\",\"JSOI\":\"violet\",\"AHOI\":\"brown\",\"BJOI\":\"\",\"FJOI\":\"grey\",\"\\u798f\\u5efa\":\"yellow\",\"\\u8f93\\u5165\\u8f93\\u51fa\\u6d4b\\u8bd5\":\"green\",\"\\u7f16\\u7a0b\\u5165\\u95e8\":\"teal\",\"\\u5b57\\u7b26\\u4e32\":\"pink\",\"Trie\":\"red\",\"\\u6392\\u5e8f\":\"purple\",\"\\u56fe\\u8bba\":\"olive\",\"\\u6700\\u77ed\\u8def\":\"brown\",\"\\u51e0\\u4f55\":\"violet\",\"Hash\":\"teal\",\"\\u9884\\u5904\\u7406\":\"blue\",\"\\u6570\\u636e\\u7ed3\\u6784\":\"red\",\"\\u4e3b\\u5e2d\\u6811\":\"olive\",\"\\u5f3a\\u8fde\\u901a\\u5206\\u91cf\":\"brown\",\"\\u65e5\\u671f\":\"pink\",\"\\u641c\\u7d22\":\"blue\",\"\\u9012\\u63a8\":\"red\",\"STL\":\"grey\",\"\\u9012\\u5f52\":\"green\",\"\\u6570\\u8bba\":\"red\",\"\\u66b4\\u529b\":\"olive\",\"AC\\u81ea\\u52a8\\u673a\":\"purple\",\"KMP\":\"purple\",\"\\u524d\\u7f00\\u548c\":\"blue\",\"\\u4f4d\\u8fd0\\u7b97\":\"green\",\"\\u601d\\u7ef4\":\"blue\",\"FFT\":\"brown\",\"\\u6982\\u7387\":\"yellow\",\"\\u54c8\\u5e0c\":\"red\",\"\\u77e9\\u9635\\u5feb\\u901f\\u5e42\":\"red\",\"\\u52a8\\u6001\\u89c4\\u5212\":\"brown\",\"\\u6c42\\u548c\":\"blue\",\"\\u5165\\u95e8\":\"orange\",\"\\u6a21\\u62df\":\"yellow\",\"\\u4e8c\\u5206\":\"olive\",\"\\u8ba1\\u7b97\\u51e0\\u4f55\":\"blue\",\"\\u79bb\\u6563\\u5316\":\"grey\",\"\\u533a\\u95f4\\u6392\\u5e8f\":\"grey\"}');
/*!40000 ALTER TABLE `global_setting` ENABLE KEYS */;
UNLOCK TABLES;
--
-- Table structure for table `label_list`
--

DROP TABLE IF EXISTS `label_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `label_list` (
  `label_name` varchar(20) NOT NULL,
  `label_id` int(11) NOT NULL AUTO_INCREMENT,
  `prev_label_id` int(11) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`label_id`),
  KEY `label_list_label_name_index` (`label_name`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loginlog`
--

DROP TABLE IF EXISTS `loginlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loginlog` (
  `user_id` varchar(48) NOT NULL DEFAULT '',
  `password` varchar(40) DEFAULT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `time` datetime DEFAULT NULL,
  `browser_name` varchar(20) DEFAULT NULL,
  `browser_version` varchar(10) DEFAULT NULL,
  `os_name` varchar(20) DEFAULT NULL,
  `os_version` varchar(10) DEFAULT NULL,
  KEY `user_log_index` (`user_id`,`time`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mail`
--

DROP TABLE IF EXISTS `mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mail` (
  `mail_id` int(11) NOT NULL AUTO_INCREMENT,
  `to_user` varchar(48) NOT NULL DEFAULT '',
  `from_user` varchar(48) NOT NULL DEFAULT '',
  `title` varchar(200) NOT NULL DEFAULT '',
  `content` text,
  `new_mail` tinyint(1) NOT NULL DEFAULT '1',
  `reply` tinyint(4) DEFAULT '0',
  `in_date` datetime DEFAULT NULL,
  `defunct` char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`mail_id`),
  KEY `uid` (`to_user`)
) ENGINE=MyISAM AUTO_INCREMENT=1033 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maintain_info`
--

DROP TABLE IF EXISTS `maintain_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `maintain_info` (
  `mtime` date NOT NULL,
  `msg` text NOT NULL,
  `version` varchar(20) DEFAULT NULL,
  `vj_version` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mention`
--

DROP TABLE IF EXISTS `mention`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mention` (
  `user_id` varchar(40) NOT NULL,
  `article_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `viewed` tinyint(1) NOT NULL DEFAULT '0',
  KEY `mention_article_id_index` (`article_id`),
  KEY `mention_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news` (
  `news_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(48) NOT NULL DEFAULT '',
  `title` varchar(200) NOT NULL DEFAULT '',
  `content` text NOT NULL,
  `time` datetime NOT NULL DEFAULT '2016-05-13 19:24:00',
  `importance` tinyint(4) NOT NULL DEFAULT '0',
  `defunct` char(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`news_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1005 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `online`
--

DROP TABLE IF EXISTS `online`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `online` (
  `hash` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(20) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `ua` varchar(255) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `refer` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lastmove` int(10) NOT NULL,
  `firsttime` int(10) DEFAULT NULL,
  `uri` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`hash`),
  UNIQUE KEY `hash` (`hash`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `prefile`
--

DROP TABLE IF EXISTS `prefile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prefile` (
  `problem_id` int(11) NOT NULL,
  `prepend` tinyint(4) NOT NULL,
  `code` text NOT NULL,
  `type` varchar(4) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `privilege`
--

DROP TABLE IF EXISTS `privilege`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `privilege` (
  `user_id` char(48) NOT NULL DEFAULT '',
  `rightstr` char(30) NOT NULL DEFAULT '',
  `defunct` char(1) NOT NULL DEFAULT 'N'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `problem`
--

DROP TABLE IF EXISTS `problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `problem` (
  `problem_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL DEFAULT '',
  `description` mediumtext,
  `input` text,
  `output` text,
  `sample_input` text,
  `sample_output` text,
  `spj` char(1) NOT NULL DEFAULT '0',
  `hint` text,
  `source` varchar(100) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `in_date` datetime DEFAULT NULL,
  `time_limit` double NOT NULL DEFAULT '0',
  `memory_limit` int(11) NOT NULL DEFAULT '0',
  `defunct` char(1) NOT NULL DEFAULT 'N',
  `accepted` int(11) DEFAULT '0',
  `submit` int(11) DEFAULT '0',
  `solved` int(11) DEFAULT '0',
  PRIMARY KEY (`problem_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6562 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `runtimeinfo`
--

DROP TABLE IF EXISTS `runtimeinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `runtimeinfo` (
  `solution_id` int(11) NOT NULL DEFAULT '0',
  `error` text,
  PRIMARY KEY (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sim`
--

DROP TABLE IF EXISTS `sim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sim` (
  `s_id` int(11) NOT NULL,
  `sim_s_id` int(11) DEFAULT NULL,
  `sim` int(11) DEFAULT NULL,
  `s_user_id` char(48) DEFAULT NULL,
  `s_s_user_id` char(48) DEFAULT NULL,
  PRIMARY KEY (`s_id`),
  KEY `sim_s_id_index` (`s_id`),
  KEY `sim_s_user_id_index` (`s_user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `sim_update_name` BEFORE INSERT ON `sim` FOR EACH ROW BEGIN
    set NEW.s_user_id = (select user_id from solution where solution_id = new.s_id limit 1);
    set NEW.s_s_user_id = (select user_id from solution where solution_id = new.sim_s_id limit 1);
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `solution`
--

DROP TABLE IF EXISTS `solution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solution` (
  `solution_id` int(11) NOT NULL AUTO_INCREMENT,
  `problem_id` int(11) NOT NULL DEFAULT '0',
  `user_id` char(48) NOT NULL,
  `time` int(11) NOT NULL DEFAULT '0',
  `memory` int(11) NOT NULL DEFAULT '0',
  `in_date` datetime NOT NULL DEFAULT '2016-05-13 19:24:00',
  `result` smallint(6) NOT NULL DEFAULT '0',
  `language` int(10) unsigned NOT NULL DEFAULT '0',
  `ip` char(100) NOT NULL,
  `contest_id` int(11) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `valid` tinyint(4) NOT NULL DEFAULT '1',
  `pass_point` tinyint(3) DEFAULT '0',
  `num` tinyint(4) NOT NULL DEFAULT '-1',
  `code_length` int(11) NOT NULL DEFAULT '0',
  `judgetime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pass_rate` decimal(3,2) unsigned NOT NULL DEFAULT '0.00',
  `judger` char(16) NOT NULL DEFAULT 'LOCAL',
  `share` tinyint(1) DEFAULT '0',
  `fingerprint` varchar(40) DEFAULT NULL,
  `fingerprintRaw` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`solution_id`),
  KEY `uid` (`user_id`),
  KEY `pid` (`problem_id`),
  KEY `res` (`result`),
  KEY `cid` (`contest_id`),
  KEY `solution_time_index` (`time`),
  KEY `solution_in_date_index` (`in_date`),
  KEY `solution_memory_index` (`memory`),
  KEY `solution_in_date_result_index` (`in_date`,`result`)
) ENGINE=MyISAM AUTO_INCREMENT=314052 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `subaccountResultCopy` BEFORE INSERT ON `solution` FOR EACH ROW BEGIN
    declare e int;
    set e = (SELECT EXISTS(
         SELECT *
         FROM users_account
         WHERE cup = NEW.user_id));
    if e = 1 then begin
      insert into vjudge_record (user_id,oj_name,problem_id,time,result,time_running,memory,code_length,language)
        values ((select user_id from users_account where cup = new.user_id),
        "CUP",new.problem_id,new.in_date,new.result,new.time,new.memory,new.code_length,new.language);
    end; END IF;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `subaccountResultCopyUpdate` BEFORE UPDATE ON `solution` FOR EACH ROW BEGIN
    declare e int;
    set e = (SELECT EXISTS(
         SELECT *
         FROM users_account
         WHERE cup = NEW.user_id));
    if e = 1 then begin
      update vjudge_record set result = new.result ,time_running = new.time ,memory = new.memory
      where time = new.in_date;
    end; END IF;
  END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `source_code`
--

DROP TABLE IF EXISTS `source_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `source_code` (
  `solution_id` int(11) NOT NULL,
  `source` text NOT NULL,
  PRIMARY KEY (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `source_code_user`
--

DROP TABLE IF EXISTS `source_code_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `source_code_user` (
  `solution_id` int(11) NOT NULL,
  `source` text NOT NULL,
  `hash`        varchar(64) null,
  PRIMARY KEY (`solution_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `special_subject`
--

DROP TABLE IF EXISTS `special_subject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `special_subject` (
  `topic_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `defunct` char(1) CHARACTER SET latin1 NOT NULL,
  `description` text NOT NULL,
  `private` tinyint(4) NOT NULL,
  `vjudge` tinyint(4) NOT NULL DEFAULT '0',
  `langmask` int(11) NOT NULL,
  `password` char(16) NOT NULL,
  PRIMARY KEY (`topic_id`),
  UNIQUE KEY `special_subject_title_pk` (`title`)
) ENGINE=MyISAM AUTO_INCREMENT=53 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `special_subject_problem`
--

DROP TABLE IF EXISTS `special_subject_problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `special_subject_problem` (
  `problem_id` int(11) NOT NULL DEFAULT '0',
  `topic_id` int(11) DEFAULT NULL,
  `title` char(200) DEFAULT NULL,
  `oj_name` char(20) DEFAULT NULL,
  `num` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `topic`
--

DROP TABLE IF EXISTS `topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topic` (
  `tid` int(11) NOT NULL AUTO_INCREMENT,
  `title` varbinary(60) NOT NULL,
  `status` int(2) NOT NULL DEFAULT '0',
  `top_level` int(2) NOT NULL DEFAULT '0',
  `cid` int(11) DEFAULT NULL,
  `pid` int(11) NOT NULL,
  `author_id` varchar(48) NOT NULL,
  PRIMARY KEY (`tid`),
  KEY `cid` (`cid`,`pid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tutorial`
--

DROP TABLE IF EXISTS `tutorial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tutorial` (
  `tutorial_id` int(11) NOT NULL AUTO_INCREMENT,
  `problem_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `in_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` varchar(30) NOT NULL,
  `solution_id` int(11) NOT NULL,
  `source` varchar(10) NOT NULL DEFAULT 'local',
  `like` int(11) NOT NULL DEFAULT '0',
  `dislike` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`tutorial_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tutorial_like`
--

DROP TABLE IF EXISTS `tutorial_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tutorial_like` (
  `user_id` varchar(40) NOT NULL,
  `tutorial_id` int(11) NOT NULL,
  `type` int(11) NOT NULL DEFAULT '0',
  KEY `tutorial_like_tutorial_tutorial_id_fk` (`tutorial_id`),
  CONSTRAINT `tutorial_like_tutorial_tutorial_id_fk` FOREIGN KEY (`tutorial_id`) REFERENCES `tutorial` (`tutorial_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` varchar(48) NOT NULL DEFAULT '',
  `email` varchar(100) DEFAULT NULL,
  `submit` int(11) DEFAULT '0',
  `solved` int(11) DEFAULT '0',
  `vjudge_submit` int(11) DEFAULT '0',
  `vjudge_accept` int(11) DEFAULT '0',
  `vjudge_solved` int(11) DEFAULT '0',
  `defunct` char(1) NOT NULL DEFAULT 'N',
  `ip` varchar(20) NOT NULL DEFAULT '',
  `accesstime` datetime DEFAULT NULL,
  `volume` int(11) NOT NULL DEFAULT '1',
  `language` int(11) NOT NULL DEFAULT '1',
  `password` varchar(32) DEFAULT NULL,
  `newpassword` varchar(64) DEFAULT NULL,
  `authcode` varchar(32) DEFAULT NULL,
  `reg_time` datetime DEFAULT NULL,
  `nick` varchar(100) NOT NULL DEFAULT '',
  `school` varchar(100) NOT NULL DEFAULT '',
  `confirmquestion` char(100) DEFAULT NULL,
  `confirmanswer` varchar(100) DEFAULT NULL,
  `avatar` tinyint(1) DEFAULT '0',
  `money` int(11) NOT NULL DEFAULT '0',
  `blog` text,
  `github` text,
  `biography` text,
  `avatarUrl` varchar(100) null,
  PRIMARY KEY (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `users` (user_id) VALUES ('admin');
--
-- Table structure for table `users_account`
--

DROP TABLE IF EXISTS `users_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_account` (
  `user_id` varchar(48) NOT NULL DEFAULT '',
  `hdu` varchar(48) DEFAULT NULL,
  `poj` varchar(48) DEFAULT NULL,
  `codeforces` varchar(48) DEFAULT NULL,
  `uva` varchar(48) DEFAULT NULL,
  `vjudge` varchar(48) DEFAULT NULL,
  `hustoj-upc` varchar(48) DEFAULT NULL,
  `upcvj` varchar(48) DEFAULT NULL,
  `cup` varchar(48) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_accept_language`
--

DROP TABLE IF EXISTS `vjudge_accept_language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_accept_language` (
  `problem_id` int(11) NOT NULL,
  `accept_language` text NOT NULL,
  `source` varchar(12) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_custom_input`
--

DROP TABLE IF EXISTS `vjudge_custom_input`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_custom_input` (
  `solution_id` int(11) NOT NULL,
  `input_text` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_label_list`
--

DROP TABLE IF EXISTS `vjudge_label_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_label_list` (
  `label_name` varchar(30) NOT NULL,
  `label_id` int(11) NOT NULL AUTO_INCREMENT,
  `prev_label_id` int(11) NOT NULL DEFAULT '-1',
  PRIMARY KEY (`label_id`),
  UNIQUE KEY `vjudge_label_list_label_id_uindex` (`label_id`),
  KEY `table_name_label_name_index` (`label_name`)
) ENGINE=InnoDB AUTO_INCREMENT=201 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_original_problem`
--

DROP TABLE IF EXISTS `vjudge_original_problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_original_problem` (
  `original_problem_id` varchar(48) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `source` varchar(10) NOT NULL,
  PRIMARY KEY (`original_problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_problem`
--

DROP TABLE IF EXISTS `vjudge_problem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_problem` (
  `problem_id` int(11) NOT NULL,
  `vjudge_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `description` text,
  `input` text,
  `output` text,
  `sample_input` text,
  `sample_output` text,
  `accepted` int(11) DEFAULT '0',
  `submit` int(11) DEFAULT '0',
  `time_limit` int(11) NOT NULL,
  `memory_limit` int(11) DEFAULT NULL,
  `source` varchar(10) NOT NULL,
  `spj` tinyint(4) DEFAULT '0',
  `defunct` varchar(3) DEFAULT 'N',
  `in_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vjudge_id`),
  KEY `vjudge_problem_problemset` (`source`),
  KEY `vjudge_problem_problem` (`source`,`problem_id`),
  KEY `title` (`title`)
) ENGINE=MyISAM AUTO_INCREMENT=28992 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_record`
--

DROP TABLE IF EXISTS `vjudge_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_record` (
  `user_id` varchar(48) NOT NULL,
  `oj_name` varchar(30) NOT NULL,
  `problem_id` varchar(20) NOT NULL,
  `time` datetime NOT NULL,
  `result` int(11) NOT NULL DEFAULT '4',
  `time_running` int(11) NOT NULL DEFAULT '0',
  `memory` int(11) NOT NULL DEFAULT '0',
  `code_length` int(11) NOT NULL DEFAULT '0',
  `language` varchar(25) NOT NULL DEFAULT 'C++',
  KEY `vjudge_record_user_id_index` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_solution`
--

DROP TABLE IF EXISTS `vjudge_solution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_solution` (
  `runner_id` text,
  `solution_id` int(11) NOT NULL AUTO_INCREMENT,
  `problem_id` int(11) NOT NULL DEFAULT '0',
  `user_id` char(48) NOT NULL,
  `time` int(11) NOT NULL DEFAULT '0',
  `memory` int(11) NOT NULL DEFAULT '0',
  `in_date` datetime NOT NULL DEFAULT '2016-05-13 19:24:00',
  `result` smallint(6) NOT NULL DEFAULT '0',
  `language` int(10) unsigned NOT NULL DEFAULT '0',
  `ip` char(42) NOT NULL,
  `contest_id` int(11) DEFAULT NULL,
  `num` tinyint(4) NOT NULL DEFAULT '-1',
  `code_length` int(11) NOT NULL DEFAULT '0',
  `oj_name` varchar(24) NOT NULL,
  `judger` varchar(24) NOT NULL,
  `ustatus` tinyint(1) DEFAULT '0',
  `share` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`solution_id`),
  KEY `pid` (`problem_id`),
  KEY `uid` (`user_id`),
  KEY `cid` (`contest_id`),
  KEY `sid` (`solution_id`),
  KEY `problemfrom` (`oj_name`,`problem_id`),
  KEY `vjudge_solution_time_index` (`time`)
) ENGINE=MyISAM AUTO_INCREMENT=4887 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_source`
--

DROP TABLE IF EXISTS `vjudge_source`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_source` (
  `source_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`source_id`),
  UNIQUE KEY `vjudge_source_name_uindex` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vjudge_source_code`
--

DROP TABLE IF EXISTS `vjudge_source_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vjudge_source_code` (
  `solution_id` int(11) NOT NULL,
  `source` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'jol'
--

--
-- Dumping routines for database 'jol'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
CREATE USER 'root'@'%' IDENTIFIED BY 'new_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
