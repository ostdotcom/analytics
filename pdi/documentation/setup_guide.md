## Setup PDI:
	1. Download PDI
	2. Download SqlWorkbench (download from https://www.sql-workbench.eu/downloads.html)
	3. Copy JDBC Drivers to data-integration/lib for mysql and Redshift (MySQL Connector/J 8.0) (RedshiftJDBC42-no-awssdk-1.2.20.1043.jar)
	4. configure connections
	5. Refer: https://gist.github.com/matthewtckr/5e9167f283f2267a4890       
        rm -r plugins/pentaho-big-data-plugin/
        rm -rf plugins/kettle5-log4j-plugin/
        vim classes/kettle-lifecycle-listeners.xml
        vim classes/kettle-registry-extensions.xml

## Setup PDI spoon:
	1. download from https://sourceforge.net/projects/pentaho/files/latest/download
	2. cd ~/data-integration (goto directory)

	-> option1
		sudo xattr -dr com.apple.quarantine ~/Downloads/data-integration/Data\ Integration.app

	-> option2
		sh spoon.sh

	-> option3
		right click on app icon
		click Contents->MAcOS->JavaApplicationStub

## To Open Spoon:
	export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
	cp ${KETTLE_HOME}/simple-jndi/jdbc.properties /Users/amanbarbaria/Downloads/data-integration/simple-jndi/jdbc.properties
	cp -r ${KETTLE_HOME}/.kettle/ ~/.kettle/	

	GO TO data-integration folder
	right click on app icon
	click Contents->MAcOS->JavaApplicationStub
	
## Configure Connection:
	1. Add Jdbc connection in jdbc.properties file
	2. Add jndi connection 
		-> using spoon. Tools->Wizard->create database connection 
		-> Or directly copy shared.xml file from kettle folder

## Start SQL WorkBench:
	 1. download from https://www.sql-workbench.eu/downloads.html 
	 	-> option1: click on icon
		-> option2: cd /Applications/SQLWorkbenchJ.app/Contents/Java/
				 java -jar sqlworkbench.jar

			
## Setup a new env or sub env

### Option 1
    export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
    export KETTLE_JNDI_ROOT=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development/simple-jndi

    sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/setup_new_sub_environment.kjb -level=Detailed -param:SUB_ENV=main -param:ENV_SUFFIX=_d6 -param:ORIGIN_CHAIN_ID=100
    sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/setup_new_chain.kjb -level=Detailed -param:SUB_ENV=main -param:AUX_CHAIN_ID=202 -param:ENV_SUFFIX=_d6

###  Option 2

	1. Add JDBC Connection setting in jdbc.properties for redshift analytics, mysql analytics & log 
	2. run Table Migrations:
	    MYSQL:
		    1. Add a new Database
		    2. run create_all.sql
	    Redshift
	        1. run create_all_tables.sql
	        2. run create_temp_all_tables.sql
	        3. run create_all.sql in analytics folder
	3. Follow steps for AUX CHAIN SETUP
	        
    3. run onetimer/populate_dim_dates.kjb (chain id is needed for logging)   
        sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/onetimer/populate_dim_dates.kjb -level=Detailed -param:SUB_ENV=main -param:ENV_SUFFIX=_d6 
    4. run onetimer/populate_dim_timess.kjb (chain id is needed for logging)
         sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/onetimer/populate_dim_times.kjb -level=Detailed -param:SUB_ENV=main -param:ENV_SUFFIX=_d6

## Setup a new AUX CHAIN_ID:

### Option 1
	    export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
    	export KETTLE_JNDI_ROOT=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development/simple-jndi

        sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/setup_new_chain.kjb -level=Detailed -param:SUB_ENV=main -param:AUX_CHAIN_ID=202 -param:ENV_SUFFIX=_d10

### Option 2 
	1. run Table Migrations:
	    MYSQL:
			2. run create_all_chain_specific.sql
		Redshift
			2. run create_chain_specific_tables.sql		
			4. run create_temp_chain_specific_tables.sql
			5. run create_all_chain_specific.sql in analytics folder

## TO Run A JOB:
	export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
	export KETTLE_JNDI_ROOT=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development/simple-jndi

	sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/load_aux_token_transfer_cube.kjb -level=Debug -param:CHAIN_ID=202 -param:SUB_ENV=main -param:ENV_SUFFIX=_d6 
	sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/incremental_consistency.kjb -level=Debug -param:CHAIN_ID=202 -param:SUB_ENV=main -param:ENV_SUFFIX=_d6 -param:CONSISTENCY_LOGS_PATH=/Users/amanbarbaria/Desktop/consistency 

    sh kitchen.sh -file=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/content-pdi/jobs/load_all_cubes.kjb -level=Debug -param:SUB_ENV=main -param:ENV_SUFFIX=_d6 


## Update Shared.xml in development:
	export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
	cp ~/.kettle/shared.xml ${KETTLE_HOME}/.kettle/shared.xml
