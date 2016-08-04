# You wouldn't believe the time people waste trying to learn grunt,
# isobuild and all that jazz. And no, we don't care all that much
# about building on Windows.

.PHONY: init clean dbdump dbrestore

init:
	git submodule update --init
	meteor npm install

clean:
	rm .meteor/local/{build,bundler-cache,plugin-cache,isopacks}

dbdump:
	$(MAKE) dbdump.zip

dbdump.zip:
	mongodump -h 127.0.0.1 --port 3001 -d meteor
	zip -r dbdump.zip dump/
	rm -rf dump

# Usage:
#	make dbrestore
#	make dbrestore COLLECTIONS=billables
dbrestore: dbdump.zip
	@rm -rf dump/
	unzip dbdump.zip
	$(MAKE) __dbrestore

.PHONY: __dbrestore __dbpurge_table __dbrestore_table
# This is the default value; may be overridden on the command line.
COLLECTIONS=$(notdir $(patsubst %.metadata.json, %, $(wildcard dump/meteor/*.metadata.json)))
__dbrestore:
	@for table in $(COLLECTIONS); do $(MAKE) __dbpurge_table __dbrestore_table COLLECTION=$${table}; done

__dbpurge_table:
	@echo "Purging $(COLLECTION)"
	echo "db.$(COLLECTION).drop();"| meteor mongo

__dbrestore_table:
	@echo "Restoring $(COLLECTION)"
	@-mkdir -p dump/collections/$(COLLECTION)
	cp -f $(wildcard dump/meteor/$(COLLECTION)*) dump/collections/$(COLLECTION)/
	mongorestore -h 127.0.0.1 --port 3001 -d meteor dump/collections/$(COLLECTION)
