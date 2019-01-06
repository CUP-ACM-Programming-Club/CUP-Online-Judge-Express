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
  PRIMARY KEY (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

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
