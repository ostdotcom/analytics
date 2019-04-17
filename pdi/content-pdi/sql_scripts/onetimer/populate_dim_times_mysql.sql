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
SELECT  tens.number * 10 + ones.number
FROM numbers_small tens, numbers_small ones
LIMIT 100;


/*
1. Modify start and end dates in below code for insert.
2. Replace 1 in below code with the last ID of dim_times used.
*/

INSERT INTO dim_times (`time_sk`, `timestamp`, `hour`)
SELECT number + 1, number * 3600, number + 1
FROM numbers
WHERE number < 24
ORDER BY number;

drop TABLE numbers_small;
drop TABLE numbers;