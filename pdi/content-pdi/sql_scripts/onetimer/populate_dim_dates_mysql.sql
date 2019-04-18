-- NOTE:: not tested for redshift.

-- Create helper numbers_small

-- DROP TABLE numbers_small;

drop TABLE if exists  numbers_small;
drop TABLE if exists  numbers;

CREATE TABLE numbers_small (number INT);
INSERT INTO numbers_small VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);


-- Create helper numbers

-- DROP TABLE  numbers;
CREATE TABLE numbers (number BIGINT);
INSERT INTO numbers
SELECT thousands.number * 1000 + hundreds.number * 100 + tens.number * 10 + ones.number
FROM numbers_small thousands, numbers_small hundreds, numbers_small tens, numbers_small ones
LIMIT 1000000;


/*
1. Modify start and end dates in below code for insert.
2. Replace 1 in below code with the last ID of dim_dates used.
*/

INSERT INTO dim_dates (`date_sk`, `timestamp`, `day`, `week_of_the_year`, `month`, `quarter`, `year`)
SELECT number + 1, UNIX_TIMESTAMP(DATE_ADD( CONVERT_TZ('2018-01-01', '+00:00', @@session.time_zone), INTERVAL number DAY )), 0,0,0,0,0
FROM numbers
WHERE DATE_ADD( '2018-01-01', INTERVAL number DAY ) BETWEEN '2018-01-01' AND '2028-12-31'
ORDER BY number;


UPDATE dim_dates SET
`day`             = DATE_FORMAT( from_unixtime(timestamp), "%d" ),
`week_of_the_year`    = DATE_FORMAT( from_unixtime(timestamp), "%v" ),
`month`           = DATE_FORMAT( from_unixtime(timestamp), "%m"),
`quarter` = QUARTER(from_unixtime(timestamp)),
`year`            = DATE_FORMAT( from_unixtime(timestamp), "%Y" );

drop TABLE numbers_small;
drop TABLE numbers;