require('dotenv').config({ path: __dirname + '/../../.env' }); // using require('dotenv').config();  can cause problems if not ran from current directory... specifying this path fixes those problems
console.log(__dirname + '/../../.env');
console.log(process.env.AZURE_DB_HOST);
var Promise = require('bluebird');
var promises = require("../promises"),
	callFn = promises.callFn,
	chainable = promises.chainablePromise,
	dates = require("../dates");

// var TIMESTAMPTZ_OID = 1184;
// require("pg").types.setTypeParser(TIMESTAMPTZ_OID, dates.isoToUtc);

var KNEX;

module.exports = {
	knex: function () {
		if (!KNEX) {
			KNEX = require('knex')({
				client: 'mssql',
				connection: {
					host: process.env.AZURE_DB_HOST,
					user: process.env.AZURE_DB_USER,
					password: process.env.AZURE_DB_PASSWORD,
					options: {
						port: 1433,
						database: process.env.AZURE_DB_DBNAME,
						encrypt: true
					}
				}
			});
		}

		return KNEX;
	},

	/**
	 * Ensure all necessary tables exist.  
	 * 
	 * Note:  create logic only creates if a table does not exists, so it is enough to just
	 * 			call createTable() for each table.
	 * 
	 * @return {Promise} Promise to ensure all courtbot tables exist.
	 */
	ensureTablesExist: function () {
		return module.exports.createAll();
	},

	/**
	 * Drop all courtbot tables.
	 * 
	 * @return {Promise} Promise to drop all necessary tables.
	 */
	dropAll: function () {
		return Promise.all(Object.keys(_createTable).map(module.exports.dropTable));
	},

	/**
	 * Create all of the tables/indexes that the courtbot application depends on.
	 * 
	 * @return {Promise} promise to create all tables needed by courtbot
	 */
	createAll: function () {
		return Promise.all(Object.keys(_createTable).map(module.exports.createTable));
	},

	/**
	 * Drop specified table
	 * 
	 * @param  {String} table name of the table to be dropped.
	 * @return {Promise}	Promise to drop the specified table.
	 */
	dropTable: function (table) {
		return new Promise(function (resolve, reject) {
			module.exports.knex().schema.dropTableIfExists(table).asCallback(function () {
				console.log("Dropped existing table \"" + table + "\"");
				resolve();
			});
		});
	},

	/**
	 * Create specified table if it does not already exist.
	 * 
	 * @param  {String} table [description]
	 * @param  {function} table (optional) function to be performed after table is created.
	 * @return {Promise}  Promise to create table if it does not exist.
	 */
	createTable: function (table, postCreateCallback) {
		return new Promise(function (resolve, reject) {
			console.log("Trying to create table: " + table);
			if (!_createTable[table]) {
				console.log("No Table Creation Instructions found for table \"" + table + "\".");
				resolve();
			} else {
				module.exports.knex().schema.hasTable(table).then(function (exists) {
					if (exists) {
						console.log("Table \"" + table + "\" already exists.  Will not create.");
						resolve();
					} else {
						_createTable[table](postCreateCallback)
							.then(function () {
								console.log("Table created:  \"" + table + "\"");
								resolve();
							});
					}
				});
			}
		});
	},

	/**
	 * Insert chunk of data to table
	 * 
	 * @param  {String} table Table to insert data to.
	 * @param  {Array} chunk Array of rows to insert into the table.
	 * @return {void} 
	 */
	insertTableChunk: function (table, chunk) {
		return module.exports.knex()(table).insert(chunk);
	},

	/**
	 * Manually close database connection.
	 * 
	 * @return {void} 
	 */
	closeConnection: function () {
		return module.exports.knex().client.pool.destroy();
	}
};

/**
 * Set of instructions for creating tables needed by the courtbot application.
 * 
 * @type {Object} 
 */
var _createTable = {
	cases: function (cb) {
		return new Promise(function (resolve, reject) {
			module.exports.knex().schema.createTableIfNotExists("cases", function (table) {
				table.string('id', 100).primary();
				table.string('defendant', 100);
				table.timestamp('date');
				//table.specificType("date", "datetime2");
				table.string('time', 100);
				table.string('room', 100);
				//table.json('citations');
				table.specificType("citations", "nvarchar(max)");
			})
				.then(_createCitationsTable)
				.then(callFn(_postCreateCallback, cb))
				.then(resolve);
		});
	},
	queued: function (cb) {
		return new Promise(function (resolve, reject) {
			module.exports.knex().schema.createTableIfNotExists("queued", function (table) {
				table.increments("queued_id").primary();
				table.dateTime("created_at");
				table.string("citation_id", 100);
				table.string("phone", 100);
				table.boolean("sent");
				table.boolean("asked_reminder");
				table.dateTime("asked_reminder_at");
			})
				.then(_createCitationsTable)
				.then(callFn(_postCreateCallback, cb))
				.then(resolve);
		});
	},
	reminders: function (cb) {
		return new Promise(function (resolve, reject) {
			module.exports.knex().schema.createTableIfNotExists("reminders", function (table) {
				table.increments("reminder_id").primary();
				table.dateTime("created_at");
				table.string("case_id", 100);
				table.string("phone", 100);
				table.boolean("sent", 100);
				table.json("original_case");
			})
				.then(_createCitationsTable)
				.then(callFn(_postCreateCallback, cb))
				.then(resolve);
		});
	}

};

/**
 * Callback function for once a table has been created.  Typically used for bulk insert of data prior to 
 * indexing the table, etc...
 * 
 * @param  {Function} cb function to be called
 * @return {Promise}	promise to execute callback function
 */
var _postCreateCallback = function (cb) {
	return new Promise(function (resolve, reject) {
		if (cb && typeof cb === "function") {
			cb().then(resolve);
		} else {
			resolve();
		}
	});
};

var _createCitationsTable = function () {
	return new Promise(function (resolve, reject) {
		module.exports.knex().schema.createTableIfNotExists("citations", function (table) {
			table.string('id', 100).primary();
			table.string('violation', 100);
			table.string('description', 250);
			table.string('location', 25);
			table.string('caseId', 100);
			table.foreign('caseID').references('cases.id');
		})
		.then(resolve);
	});
};