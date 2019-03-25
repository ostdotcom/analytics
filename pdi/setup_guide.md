jdbc:redshift://pepo.cfwzkfyo2mfi.eu-west-1.redshift.amazonaws.com:5439/pepodb
oSt2018Stag!Pentaho
ost_pentaho_stag_user



cd /Users/amanbarbaria/workspace/projects/analytics/analytics/pdi 

cp configs/development/simple-jndi/jdbc.properties /Users/amanbarbaria/Downloads/data-integration/simple-jndi/jdbc.properties
cp configs/development/kettle.properties ~/.kettle/kettle.properties



Add to kettle.properties
ENV_SUFFIX=_s6
MYSQL_SCHEMA_NAME=ost_pentaho_sandbox
PRESTAGING_REDSHIFT_SCHEMA_NAME=ost_warehouse_sandbox
PENTAHO_REDSHIFT_SCHEMA_NAME=ost_pentaho_sandbox
TEMP_PENTAHO_REDSHIFT_SCHEMA_NAME=temp_ost_pentaho_sandbox

${TEMP_PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}

${PENTAHO_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}

${PRESTAGING_REDSHIFT_SCHEMA_PREFIX}_${SUB_ENV}${ENV_SUFFIX}

${CHAIN_ID}


KETTLE_TRANS_LOG_TABLE=transformation_logs
KETTLE_JOB_LOG_TABLE=job_logs

KETTLE_TRANS_LOG_DB=analyticsLogsConnection
KETTLE_JOB_LOG_DB=analyticsLogsConnection


TRANSFORMSTION_LOGS_RECORD_TIMEOUT=6
JOB_LOGS_RECORD_TIMEOUT=6

use 

Setup Log Db:

Select the fields you want to log in the Fields to log pane, or keep the default selections.
Click SQL to open the Simple SQL Editor.
Enter your SQL statements in the Simple SQL Editor.
Click Execute to execute the SQL code to create your log table, then click OK to exit the Results dialog box.



sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/test_job.kjb -level=Detailed -param:CHAIN_ID=199 -param:MYSQL_SCHEMA_NAME=ost_analytics_s6_sandbox


SQL WorkBench:
option 1
download from https://www.sql-workbench.eu/downloads.html

option2
cd /Applications/SQLWorkbenchJ.app/Contents/Java/
java -jar sqlworkbench.jar


PDI

https://sourceforge.net/projects/pentaho/files/latest/download
cd ~/data-integration (goto directory)

option1
sudo xattr -dr com.apple.quarantine ~/Downloads/data-integration/Data\ Integration.app

option2
sh spoon.sh









Setup a new env:
	Run PRESTAGING MIGRATION ON REDSHIFT
	Run PENTAHO MIGRATION ON REDSHIFT
		TEMP and all tables
	Run PENTAHO MIGRATION ON MYSQL
		all tables
	Run PDI ONETIMERS-
		populate_dim_dates
		populate_dim_times

	DEFINE NEW LOG TABLE NAME AND MYSQL Connection	





To configure a JNDI connection for your PDI client, edit the jdbc.properties file to mirror the JNDI connection information of your application server data sources. The jdbc.properties file is located here: /pentaho/design-tools/data-integration/simple-jndi.


Once you have the correct driver, copy it to the following directories:

Pentaho Server: /pentaho/server/pentaho-server/tomcat/lib/
Spoon: data-integration/lib 

cp -r $HOME/.pentaho/simple-jndi /data-integration/simple-jndi 


tools wizard add databse conection.


/Applications/data-integration/Data\ Integration.app\Contents\MacOS/JavaApplicationStub

or right click on DI icon and use package content ->contents macos -> JavaApplicationStub

add connection manually

right click on connection and sahre

copy mysql-connector-java-5.1.46.jar to data-integration/lib and redshift driver as well

use an OLD_PENTAHO_REDSHIFT_SCHEMA_NAME for staging of production data. so we can test on local.
grant_permission at last


${MYSQL_SCHEMA_NAME}${ENV_SUFFIX}
${PRESTAGING_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX}
${PENTAHO_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX}
${TEMP_PENTAHO_REDSHIFT_SCHEMA_NAME}${ENV_SUFFIX}


_${CHAIN_ID}

ssh -L 3307:ost-kit-saas-all.cr8jt6bpnicr.us-east-1.rds.amazonaws.com:3306 3.91.174.58 -N -f

node executables/extract_data.js --blockScanner true  --chainId 202

MySQL Connector/J 8.0 is highly recommended for use with MySQL Server 8.0, 5.7, 5.6, and 5.5. Please upgrade to MySQL Connector/J 8.0.

setting. useServerPrepStmts=false
rewriteBatchedStatements=true
useCompression=true

either remove fact constraint or create rows with 0 val


