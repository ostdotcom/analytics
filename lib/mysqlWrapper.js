/*
 * Manage mysql clusters and connection pools
 */

const rootPrefix = '..',
	mysql = require('mysql'),
	mysqlConfig = require(rootPrefix + '/configs/mysql'),
	emailNotifier = require(rootPrefix + '/lib/notifier'),
	logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
	poolClusters = {};

class GeneratePoolClusters {
	constructor() {
	}

	// creating pool cluster object in poolClusters map
	static generateCluster(cName, dbName, cConfig, identifier) {
		const oThis = this;
		let clusterName = cName + '.' + dbName;
		if (identifier) {
			clusterName = clusterName + '.' + identifier
		}

		logger.log(" ========== Mysql Config =========== ", cConfig);


		// initializing the pool cluster obj using the commonClusterConfig
		poolClusters[clusterName] = mysql.createPoolCluster(mysqlConfig['commonClusterConfig']);

		// looping over each node and adding it to the pool cluster obj
		for (let nName in cConfig) {
			let finalConfig = Object.assign({}, cConfig[nName], mysqlConfig['commonNodeConfig'], {database: dbName});
			poolClusters[clusterName].add(nName, finalConfig);
		}

		// when a node dis-functions, it is removed from the pool cluster obj and following CB is called
		poolClusters[clusterName].on('remove', function (nodeId) {
			emailNotifier.perform('m_w_1', `REMOVED NODE: ${nodeId} in ${clusterName}`, {}, {});
			logger.error('m_w_1', 'REMOVED NODE : ' + nodeId + ' in ' + clusterName);
		});
	}

	// this loops over all the databases and creates pool cluster objects map in poolClusters
	static init() {
		const oThis = this;
		// looping over all databases
		for (let dbName in mysqlConfig['databases']) {
			let dbClusters = mysqlConfig['databases'][dbName];
			// looping over all clusters for the database
			for (let i = 0; i < dbClusters.length; i++) {
				let cName = dbClusters[i],
					cConfig = mysqlConfig['clusters'][cName];

				// creating pool cluster object in poolClusters map
				oThis.generateCluster(cName, dbName, cConfig);
			}
		}
	}
}

GeneratePoolClusters.init();

// helper methods for mysql pool clusters
class mysqlWrapper {
	constructor() {
	}

	static getPoolFor(dbName, nodeType, clusterName) {
		if (!clusterName) {
			clusterName = mysqlWrapper.getClusterName(dbName);
		}

		let dbClusterName = clusterName + '.' + dbName,
			sanitizedNType = nodeType == 'slave' ? 'slave*' : 'master';
		return poolClusters[dbClusterName].of(sanitizedNType);
	}

	static getClusterName(dbName) {
		let clusterNames = mysqlConfig['databases'][dbName];
		if (clusterNames.length > 1) {
			throw 'Multiple clusters are defined for this DB. Specify cluster name.';
		}
		return clusterNames[0];
	}

	static getPoolForDynamicHost(dbName, nodeType, clusterName, config) {
		if (!clusterName) {
			clusterName = mysqlWrapper.getClusterName(dbName);
		}

		logger.log()

		let identifier = config.host,
			dbClusterName = clusterName + '.' + dbName + '.' + identifier,
			sanitizedNType = nodeType == 'slave' ? 'slave*' : 'master';

		if (poolClusters[dbClusterName]) {
			return poolClusters[dbClusterName].of(sanitizedNType)
		} else {
			let cConfig = {...mysqlConfig['clusters'][clusterName]};

			for (let nName in cConfig) {
				cConfig[nName].host = config.host;
			}

			GeneratePoolClusters.generateCluster(clusterName, dbName, cConfig, identifier);
			return poolClusters[dbClusterName].of(sanitizedNType);
		}
	}

	static getPoolClustersFor(dbName) {
		let clusterPools = [],
			clusterNames = mysqlConfig['databases'][dbName];
		for (let i = 0; i < clusterNames.length; i++) {
			clusterPools.push(mysqlWrapper.getPoolFor(dbName, clusterNames[i], 'master'));
		}
		return clusterPools;
	}
}

module.exports = mysqlWrapper;
