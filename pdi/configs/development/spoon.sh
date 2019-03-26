# set PENTAHO_HOME=C:\Pentaho800
# set PENTAHO_JAVA_HOME=C:\Pentaho800\java
# set KETTLE_CLIENT_DIR="%PENTAHO_HOME%\


# export KETTLE_HOME=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development
# export KETTLE_JNDI_ROOT=/Users/amanbarbaria/workspace/projects/analytics/analytics/pdi/configs/development/simple-jndi

set KETTLE_CLIENT_DIR="/Users/amanbarbaria/Downloads/data-integration" 
set KETTLE_HOME=%CD%
set KETTLE_META_HOME=%CD%
set PENTAHO_DI_JAVA_OPTIONS="-Xms1024m" "-Xmx2048m"
set OPT=%OPT% "-DPENTAHO_METASTORE_FOLDER=%KETTLE_META_HOME%" 
sh ${KETTLE_CLIENT_DIR}/spoon.sh ${OPT} %*