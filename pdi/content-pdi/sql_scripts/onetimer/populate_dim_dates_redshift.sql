/*
WbVarDef ENV_SUFFIX=_d6;
WbVarDef SUB_ENV=main;
WbVarDef PENTAHO_REDSHIFT_SCHEMA_PREFIX=ost_pentaho;
*/

SET search_path = ${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX};


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

INSERT INTO dim_dates (date_sk, timestamp, day, week_of_the_year, month, quarter, year)
SELECT number + 1, extract(epoch from DATEADD( day, number, '2018-01-01')), 0,0,0,0,0
FROM numbers
WHERE DATEADD( day, number, '2018-01-01') BETWEEN '2018-01-01' AND '2028-12-31'
ORDER BY number;


UPDATE dim_dates SET
day             = date_part( d, (timestamp 'epoch' + timestamp * interval '1 second') ),
week_of_the_year    = date_part( w,  (timestamp 'epoch' + timestamp * interval '1 second') ),
month           = date_part( mon, (timestamp 'epoch' + timestamp * interval '1 second')),
quarter = date_part( qtr, (timestamp 'epoch' + timestamp * interval '1 second')),
year            = date_part(y,  (timestamp 'epoch' + timestamp * interval '1 second'));

drop TABLE numbers_small;
drop TABLE numbers;